import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveSkillItems } from '../types/resume';
import type { ResumeData } from '../types/resume';
import type { AtsAuditResult } from '../types/builder';

// Store value + timestamp for TTL expiry
const responseCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export const clearGeminiCache = () => responseCache.clear();

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is missing.');
  return apiKey;
};

let _genAI: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  if (!_genAI) _genAI = new GoogleGenerativeAI(getApiKey());
  return _genAI;
};

const getModel = (expectJson = false) =>
  getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      ...(expectJson ? { responseMimeType: 'application/json' } : {}),
    },
  });

const handleError = (error: any): never => {
  if (error?.message?.includes('429'))
    throw new Error('Rate limit reached. Please wait a moment and try again.');
  if (error?.message?.includes('quota'))
    throw new Error('Daily quota exceeded. Try again tomorrow.');
  console.error('Gemini Error:', error);
  throw new Error(error?.message || 'AI Provider Failed. See console for details.');
};

// Exponential backoff: 5s → 15s → 45s
// Flat 15s risks not clearing the rate limit window if hit early in the minute
const RETRY_DELAYS = [5000, 15000, 45000];

// Retry with exponential backoff — handles transient 429s without user intervention
const callWithRetry = async (
  prompt: string,
  expectJson: boolean,
  retries = 2,
): Promise<string> => {
  try {
    const model = getModel(expectJson);
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    if (expectJson) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return text;
  } catch (error: any) {
    if (error?.message?.includes('429') && retries > 0) {
      const delay = RETRY_DELAYS[RETRY_DELAYS.length - retries] ?? 15000;
      console.warn(`Rate limited — retrying in ${delay / 1000}s (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, delay));
      return callWithRetry(prompt, expectJson, retries - 1);
    }
    return handleError(error);
  }
};

let activeRequests = 0;
const MAX_CONCURRENT = 2;

const callGemini = async (
  prompt: string,
  cacheKey: string,
  expectJson = false,
): Promise<string> => {
  const cached = responseCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    console.log('Using cached AI response');
    return cached.value;
  }

  if (activeRequests >= MAX_CONCURRENT) {
    throw new Error('Another AI request is in progress. Please wait a moment.');
  }

  activeRequests++;
  try {
    const text = await callWithRetry(prompt, expectJson);
    responseCache.set(cacheKey, { value: text, timestamp: Date.now() });
    return text;
  } finally {
    activeRequests--;
  }
};

const buildAtsResumeContext = (resumeData: ResumeData): string => {
  const { personalInfo, summary, experience, education, skills } = resumeData;

  let activeSkills: string[] = [];
  try {
    activeSkills = getActiveSkillItems(skills);
  } catch {
    activeSkills = [];
  }

  return `
Name: ${personalInfo?.fullName || 'N/A'}
Title: ${personalInfo?.jobTitle || 'N/A'}
Summary: ${summary || 'None'}
Skills: ${activeSkills.join(', ') || 'None'}
Experience: ${
    experience
      ?.slice(0, 4)
      .map(
        (e) =>
          `${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${
            e.description?.slice(0, 800) || ''
          }`,
      )
      .join('\n') || 'None'
  }
Education: ${
    education
      ?.slice(0, 2)
      .map((e) => `${e.degree} at ${e.school}`)
      .join(', ') || 'None'
  }`.trim();
};

const splitBullets = (description: string): string[] => {
  if (!description) return [];

  const byNewline = description.split('\n').map((b) => b.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const bySentence = description
    .split(/(?<=[.!?])\s+(?=[A-Z][a-z])/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (bySentence.length > 1) return bySentence;

  return [description.trim()];
};

// Declared AFTER splitBullets — safe to reference it now
const extractTopAchievement = (resumeData: ResumeData): string => {
  const allBullets: string[] = [];

  resumeData.experience?.forEach((e) => {
    if (!e.description) return;
    const bullets = splitBullets(e.description);
    allBullets.push(...bullets);
  });

  if (!allBullets.length) return '';

  const scored = allBullets.map((bullet) => {
    let score = 0;
    if (/\d+%/.test(bullet)) score += 4;
    if (/\$[\d,]+/.test(bullet)) score += 4;
    if (/\d+x/.test(bullet)) score += 3;
    if (/\d+/.test(bullet)) score += 2;
    if (/reduced|increased|improved|grew|scaled|led|launched|built|saved/i.test(bullet)) score += 2;
    if (bullet.length > 60) score += 1;
    return { bullet, score };
  });

  const top = scored.sort((a, b) => b.score - a.score)[0];
  return top?.score > 0 ? top.bullet : allBullets[0];
};

// Two-pass hash — collision-safe on large strings
const hashString = (str: string): string => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};

export const generateTailoredSummary = async (
  resumeData: ResumeData,
  role: string,
  company: string,
  jobDescription: string,
): Promise<{
  summary: string;
  jobTitle: string;
  experienceBullets: { id: string; bullets: string[] }[];
  keywordAlignment: {
    matched: string[];
    injected: string[];
    stillMissing: string[];
  };
  missingSkills: string[];
  changesSummary: string[];
}> => {
  const trimmedJD = jobDescription.trim().slice(0, 2000);

  let activeSkills: string[] = [];
  try {
    activeSkills = getActiveSkillItems(resumeData.skills);
  } catch {
    activeSkills = [];
  }

  const experienceContext = resumeData.experience.map((e) => {
    const bullets = splitBullets(e.description || '');
    return {
      id: e.id,
      role: e.role,
      company: e.company,
      dates: `${e.startDate} - ${e.endDate}`,
      bullets,
      bulletCount: bullets.length,
    };
  });

  const experienceText = experienceContext
    .map(
      (e) =>
        `${e.role} at ${e.company} (${e.dates})
Bullets (${e.bulletCount} total, ID: ${e.id}):
${e.bullets.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}`,
    )
    .join('\n\n');

  const cacheKey = `tailor-${role}-${hashString(trimmedJD)}-${hashString(
    experienceText + activeSkills.join(','),
  )}`;

  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('Using cached tailor response');
    return JSON.parse(cached.value);
  }

  const prompt = `You are a senior technical resume writer and ATS optimization expert.
Your goal: tailor this resume to maximize relevance and keyword alignment for the role of "${role}" at "${company}" without fabricating experience.

═══════════════════════════════
JOB DESCRIPTION:
${trimmedJD}
═══════════════════════════════
CURRENT RESUME:
Title: ${resumeData.personalInfo?.jobTitle || ''}
Summary: ${resumeData.summary?.slice(0, 300) || ''}
Skills: ${activeSkills.join(', ')}
Experience:
${experienceText}
═══════════════════════════════

Before returning JSON, silently work through:
- What are the 5 most important technical requirements in this JD?
- Which of those are absent or underrepresented in the resume?
- What is the single strongest alignment between this resume and the JD?

Then return ONLY the JSON below with no preamble.

STEP 1 — SKILL GAP ANALYSIS (run mentally before writing anything):
  a) Extract every named tool, technology, framework and platform from the JD
  b) Cross-reference against resume skills using equivalence
     ("React" = "React 18", "PostgreSQL" = "SQL" — mark as PRESENT, not missing)
  c) Flag as missing ONLY if: named explicitly in JD + absent with no equivalent + is a specific tool not a category
  d) Rank by JD prominence, cap at 6

STEP 2 — BULLET REWRITING:
  - Rewrite EVERY bullet for EVERY job — bullets array MUST match bulletCount exactly
  - Structure: [Action Verb from JD language] + [What] + [How/Stack] + [Metric]
  - Mirror JD phrasing exactly where it fits (e.g. "cross-functional collaboration" not "worked with teams")
  - Max 2 JD keywords per bullet, woven in naturally
  - Preserve or improve existing metrics. Add ~estimates only when clearly inferable
  - Never change the core claim of a bullet — only reframe and sharpen it

STEP 3 — SUMMARY:
  - Open with exact JD job title — NEVER open with "Highly skilled", "Seasoned", "Passionate", "Results-driven" or any adjective
  - 2-3 sentences, keyword-rich, grounded only in resume content — no fabrication
  - Do NOT mention "${company}" anywhere
  - If seniority gap exists, use JD title but frame scope honestly

STEP 4 — OUTPUT:
Return ONLY valid JSON, no preamble, no markdown fences:
{
  "summary": "tailored summary here",
  "jobTitle": "exact title from JD",
  "experienceBullets": [
    {
      "id": "exact_existing_id",
      "bullets": [
        "rewritten bullet 1",
        "rewritten bullet 2",
        "rewritten bullet 3"
      ]
    }
  ],
  "keywordAlignment": {
    "matched": ["keywords already in resume that appear in JD"],
    "injected": ["JD keywords added through bullet rewrites"],
    "stillMissing": ["JD keywords that could not be naturally incorporated"]
  },
  "missingSkills": ["specific named tools from stillMissing that are worth adding to skills section"],
  "changesSummary": [
    "Specific change e.g. Rewrote 5 bullets to surface WebSockets and real-time data alignment",
    "Summary rewritten to open with Frontend Engineer and highlight TypeScript depth",
    "Added D3.js and Three.js from stillMissing to skills section"
  ]
}`;

  try {
    const resultText = await callGemini(prompt, cacheKey, true);
    const parsed = JSON.parse(resultText);

    // Patch bullet mismatch — pad or trim instead of silently breaking UI
    parsed.experienceBullets?.forEach((eb: any) => {
      const original = experienceContext.find((e) => e.id === eb.id);
      if (original && eb.bullets?.length !== original.bulletCount) {
        console.warn(
          `Bullet mismatch for ${eb.id}: expected ${original.bulletCount}, got ${eb.bullets?.length} — patching`,
        );
        if (eb.bullets.length < original.bulletCount) {
          eb.bullets = [
            ...eb.bullets,
            ...Array(original.bulletCount - eb.bullets.length).fill(''),
          ];
        } else {
          eb.bullets = eb.bullets.slice(0, original.bulletCount);
        }
      }
    });

    // Store patched result in cache
    responseCache.set(cacheKey, { value: JSON.stringify(parsed), timestamp: Date.now() });

    return parsed;
  } catch (error: any) {
    return handleError(error);
  }
};

export const generateCoverLetterText = async (
  resumeData: ResumeData,
  role: string,
  company: string,
  manager: string,
  tone: string,
  jobDescription?: string,
): Promise<string> => {
  let activeSkills: string[] = [];
  try {
    activeSkills = getActiveSkillItems(resumeData.skills);
  } catch {
    activeSkills = [];
  }

  const topAchievement = extractTopAchievement(resumeData);
  const candidateName = resumeData.personalInfo?.fullName || '';

  // Cache cover letter — same inputs = return cached draft instantly
  const cacheKey = `coverletter-${role}-${company}-${tone}-${hashString(
    (jobDescription || '') + (topAchievement || '') + activeSkills.slice(0, 8).join(','),
  )}`;

  const prompt = `
You are an expert cover letter writer. Write a ${tone} cover letter for the role of "${role}" at "${company}". Address it to ${manager || 'Hiring Manager'}.

═══════════════════════════════
CANDIDATE PROFILE:
Name: ${candidateName}
Current Title: ${resumeData.personalInfo?.jobTitle || ''}
Summary: ${resumeData.summary?.slice(0, 200) || ''}
Top Skills: ${activeSkills.slice(0, 8).join(', ')}
Key Achievement (from experience): ${topAchievement || 'None provided'}
${
    jobDescription
      ? `
═══════════════════════════════
JOB DESCRIPTION (extract and use keywords naturally):
${jobDescription.trim().slice(0, 800)}`
      : ''
  }
═══════════════════════════════

TONE GUIDANCE:
- "professional" → clear, direct, no contractions, formal but not stiff
- "confident" → assertive verbs, quantified claims, no hedging words like "I believe" or "I think"
- "conversational" → natural phrasing, one contraction per paragraph allowed, warm but focused
- "enthusiastic" → specific excitement about THIS company/role, not generic passion statements

STRUCTURE (follow exactly):
Paragraph 1 (2-3 sentences):
  Open with a specific hook — a named achievement, a relevant observation about ${company},
  or a direct statement of fit. NEVER open with "I am writing to apply",
  "I am excited to apply", "As a [adjective]", or "I have always been passionate".

Paragraph 2 (3-4 sentences):
  Pull 1-2 specific achievements from the candidate profile with real metrics where available.
  Connect them directly to requirements in the JD. Use JD language naturally.

Paragraph 3 (2-3 sentences):
  One specific reason this company/role appeals — not generic.
  Clear call to action — offer to discuss, not "I hope to hear from you".

RULES:
- 270-320 words total
- No fabricated metrics — only use numbers present in the candidate profile
- Max 2 JD keywords per paragraph, woven in naturally
- End with: "Best regards," on its own line — nothing after it
- Return ONLY the letter text
`.trim();

  return callGemini(prompt, cacheKey, false);
};

export const analyzeAtsCompleteness = async (
  resumeData: ResumeData,
  role: string,
  jobDescription: string,
): Promise<AtsAuditResult> => {
  const trimmedJD = jobDescription.trim().slice(0, 1500);

  // ATS-specific context with higher char limit per job
  const resumeContext = buildAtsResumeContext(resumeData);

  // Hash full resumeContext — any resume edit invalidates cache
  const cacheKey = `ats-${role}-${hashString(trimmedJD)}-${hashString(resumeContext)}`;

  const prompt = `
You are an ATS (Applicant Tracking System) scoring engine. Analyze this resume
against the job description and return a structured score.

═══════════════════════════════
ROLE: ${role}

JOB DESCRIPTION:
${trimmedJD}

RESUME:
${resumeContext}
═══════════════════════════════

SCORING INSTRUCTIONS — follow this exact rubric:

STEP 1 — KEYWORD EXTRACTION (from JD only):
  Extract keywords in two tiers:
  - Hard keywords: specific tools, technologies, frameworks, certifications
    (e.g. "Kafka", "dbt", "AWS", "PMP") — worth 2 points each when matched
  - Soft keywords: methodologies, practices, domain terms
    (e.g. "agile", "cross-functional", "stakeholder management") — worth 1 point each
  Ignore filler phrases: "fast-paced", "passionate", "team player", "detail-oriented"

STEP 2 — KEYWORD MATCHING:
  Match against resume using equivalence rules:
  - "React" matches "React 18", "ReactJS" ✓
  - "PostgreSQL" matches "SQL", "relational databases" ✓
  - Partial matches do NOT count (e.g. "Python" ≠ "experience with scripting") ✗

STEP 3 — SCORE BREAKDOWN (each category scored independently):
  a) Keyword Match     — max 35 pts: (matched points / total possible points) × 35
  b) Quantified Impact — max 25 pts: count bullets with numbers/metrics
     - 0 bullets = 0pts, 1-2 = 10pts, 3-4 = 18pts, 5+ = 25pts
  c) Title Alignment   — max 20 pts: how closely resume title matches JD title
     - Exact match = 20, Same domain/seniority = 14, Related = 8, Unrelated = 0
  d) Summary Relevance — max 10 pts: JD hard keywords present in summary
     - 3+ hard keywords = 10, 2 = 7, 1 = 4, 0 = 0
  e) Structure & Clarity — max 10 pts: clear sections, action verbs, no walls of text
     - Estimate based on content structure visible in the resume

STEP 4 — SUGGESTIONS (max 5):
  Each suggestion MUST follow this exact format:
  "[Section] — [Specific action referencing a real JD keyword or gap]"
  Good: "Summary — Add 'Kafka' and 'event-driven architecture' which appear 3x in JD"
  Good: "Experience — Quantify the 'reduced load time' bullet with a % or time metric"
  Good: "Skills — Add 'dbt' and 'BigQuery' which are listed as requirements"
  NEVER write: "Add more keywords", "Improve your summary", or any vague generic advice

Return ONLY valid JSON, no markdown fences:
{
  "score": number,
  "keywordCoverage": number,
  "matchedCount": number,
  "keywordCount": number,
  "quantifiedBulletCount": number,
  "breakdown": [
    { "label": "Keyword Match", "score": number, "max": 35 },
    { "label": "Quantified Impact", "score": number, "max": 25 },
    { "label": "Title Alignment", "score": number, "max": 20 },
    { "label": "Summary Relevance", "score": number, "max": 10 },
    { "label": "Structure & Clarity", "score": number, "max": 10 }
  ],
  "matchedKeywords": [ string ],
  "missingKeywords": [ string ],
  "suggestions": [ string ]
}
`.trim();

  const resultText = await callGemini(prompt, cacheKey, true);
  try {
    return JSON.parse(resultText);
  } catch (e) {
    console.error('JSON Parse Error', e);
    return {
      score: 0,
      keywordCoverage: 0,
      matchedCount: 0,
      keywordCount: 0,
      quantifiedBulletCount: 0,
      breakdown: [],
      matchedKeywords: [],
      missingKeywords: [],
      suggestions: ['AI Error: Could not parse analysis.'],
    };
  }
};