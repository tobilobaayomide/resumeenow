import { findMatchingDescriptionBullet } from './descriptionBullets';
import { supabase } from './supabase';
import { sanitizeAiKeywordList, sanitizeAiPlainText } from './aiText';
import { getActiveSkillItems } from '../types/resume';
import { parseAiGroupedSkills } from './aiResumeApply';
import type { ResumeData } from '../types/resume';
import type { AtsAuditImprovement, AtsAuditResult } from '../types/builder';

// ─── Cache ────────────────────────────────────────────────────────────────────
const responseCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;
export const clearGeminiCache = () => responseCache.clear();

// ─── Error handler ────────────────────────────────────────────────────────────
const handleError = (error: unknown): never => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Invalid JWT') || message.includes('invalid JWT') || message.includes('auth token')) {
    throw new Error('Your session expired. Please sign in again and retry.');
  }
  if (message.includes('429'))
    throw new Error('Rate limit reached. Please wait a moment and try again.');
  if (message.includes('quota'))
    throw new Error('Daily quota exceeded. Try again tomorrow.');
  console.error('Gemini Error:', error);
  throw new Error(message || 'AI Provider Failed. See console for details.');
};

// ─── Retry delays ─────────────────────────────────────────────────────────────
const RETRY_DELAYS = [5000, 15000, 45000];

const getValidAccessToken = async (): Promise<string> => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  let session = sessionData.session;
  const expiresSoon =
    !session?.access_token ||
    (typeof session.expires_at === 'number' &&
      session.expires_at * 1000 <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS);

  if (expiresSoon) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      throw refreshError;
    }
    session = refreshData.session;
  }

  if (!session?.access_token) {
    throw new Error('Please sign in again to use AI tools.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(session.access_token);
  if (userError || !userData.user) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) {
      throw new Error('Please sign in again to use AI tools.');
    }
    session = refreshData.session;
  }

  return session.access_token;
};

const callWithRetry = async (
  prompt: string,
  expectJson: boolean,
  retries = 2,
  hasRefreshedSession = false,
): Promise<string> => {
  try {
    const accessToken = await getValidAccessToken();
    const { data, error, response } = await supabase.functions.invoke('gemini-proxy', {
      body: { prompt, expectJson },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      let responseMessage = '';
      if (response) {
        try {
          const payload = await response.clone().json();
          responseMessage = typeof payload?.message === 'string'
            ? payload.message
            : typeof payload?.error === 'string'
              ? payload.error
              : '';
        } catch {
          // Fall through to the generic error message below.
        }
      }
      throw new Error(responseMessage || error.message);
    }
    if (data?.error) throw new Error(data.error);

    let text: string = data?.text ?? '';
    if (expectJson) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return text;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      !hasRefreshedSession &&
      (message.includes('Invalid JWT') || message.includes('invalid JWT') || message.includes('auth token'))
    ) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData.session) {
        return callWithRetry(prompt, expectJson, retries, true);
      }
    }
    if (message.includes('429') && retries > 0) {
      const delay = RETRY_DELAYS[RETRY_DELAYS.length - retries] ?? 15000;
      console.warn(`Rate limited — retrying in ${delay / 1000}s (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, delay));
      return callWithRetry(prompt, expectJson, retries - 1, hasRefreshedSession);
    }
    return handleError(error);
  }
};

// ─── Concurrency guard + cache layer ─────────────────────────────────────────
let activeRequests = 0;
const MAX_CONCURRENT = 2;

const callGemini = async (
  prompt: string,
  cacheKey: string,
  expectJson = false,
): Promise<string> => {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildAtsResumeContext = (resumeData: ResumeData): string => {
  const { personalInfo, summary, experience, education, skills } = resumeData;
  let activeSkills: string[] = [];
  try { activeSkills = getActiveSkillItems(skills); } catch { activeSkills = []; }
  return `
Name: ${personalInfo?.fullName || 'N/A'}
Title: ${personalInfo?.jobTitle || 'N/A'}
Summary: ${summary || 'None'}
Skills: ${activeSkills.join(', ') || 'None'}
Experience: ${
    experience?.slice(0, 4).map(
      (e) => `[ID: ${e.id}] ${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description?.slice(0, 800) || ''}`,
    ).join('\n') || 'None'
  }
Education: ${
    education?.slice(0, 2).map((e) => `[ID: ${e.id}] ${e.degree} at ${e.school}`).join(', ') || 'None'
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

const extractTopAchievement = (resumeData: ResumeData): string => {
  const allBullets: string[] = [];
  resumeData.experience?.forEach((e) => {
    if (!e.description) return;
    allBullets.push(...splitBullets(e.description));
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

type TailoredSummaryResult = {
  jobTitleAfter: string;
  summary?: { current: string; better: string };
  skills?: {
    current: string;
    better: string;
    groups?: { label: string; items: string[] }[];
  };
  experienceImprovements: { id: string; current: string; better: string }[];
  experienceAdditions: { id: string; better: string }[];
  contactFix?: { current: string; better: string };
  keywordAlignment: { matched: string[]; injected: string[]; stillMissing: string[] };
};

const buildSkillsContext = (resumeData: ResumeData): string => {
  if (resumeData.skills.mode === 'grouped' && resumeData.skills.groups.length > 0) {
    return resumeData.skills.groups
      .filter((group) => group.items.length > 0)
      .map((group) => `${group.label}: ${group.items.join(', ')}`)
      .join('\n');
  }

  let activeSkills: string[] = [];
  try { activeSkills = getActiveSkillItems(resumeData.skills); } catch { activeSkills = []; }
  return activeSkills.join(', ');
};

const sanitizeTailoredSummaryResult = (
  parsed: Partial<TailoredSummaryResult>,
  experienceDescriptions: Map<string, string>,
): TailoredSummaryResult => ({
  jobTitleAfter: sanitizeAiPlainText(parsed.jobTitleAfter),
  summary: parsed.summary
    ? {
        current: parsed.summary.current,
        better: sanitizeAiPlainText(parsed.summary.better),
      }
    : undefined,
  skills: parsed.skills
    ? {
        current: parsed.skills.current,
        better: sanitizeAiPlainText(parsed.skills.better),
        groups: parseAiGroupedSkills(parsed.skills.groups),
      }
    : undefined,
  experienceImprovements: (parsed.experienceImprovements || []).reduce<
    TailoredSummaryResult['experienceImprovements']
  >((result, item) => {
    const matchedCurrent = findMatchingDescriptionBullet(
      experienceDescriptions.get(item.id) || '',
      item.current,
    );

    if (!matchedCurrent) return result;

    result.push({
      ...item,
      current: matchedCurrent,
      better: sanitizeAiPlainText(item.better),
    });
    return result;
  }, []),
  experienceAdditions: (parsed.experienceAdditions || []).map((item) => ({
    ...item,
    better: sanitizeAiPlainText(item.better),
  })),
  contactFix: parsed.contactFix
    ? {
        current: parsed.contactFix.current,
        better: sanitizeAiPlainText(parsed.contactFix.better),
      }
    : undefined,
  keywordAlignment: {
    matched: sanitizeAiKeywordList(parsed.keywordAlignment?.matched),
    injected: sanitizeAiKeywordList(parsed.keywordAlignment?.injected),
    stillMissing: sanitizeAiKeywordList(parsed.keywordAlignment?.stillMissing),
  },
});

// ─── Exported functions ───────────────────────────────────────────────────────
export const generateTailoredSummary = async (
  resumeData: ResumeData,
  role: string,
  company: string,
  jobDescription: string,
): Promise<TailoredSummaryResult> => {
  const trimmedJD = jobDescription.trim().slice(0, 2500);
  try { getActiveSkillItems(resumeData.skills); } catch { /* ignore */ }
  const skillsContext = buildSkillsContext(resumeData);

  const experienceContext = resumeData.experience.map((e) => {
    return { id: e.id, role: e.role, company: e.company, description: e.description };
  });

  const experienceText = experienceContext.map(
    (e) => `[ID: ${e.id}] ${e.role} at ${e.company}:\n${e.description}`
  ).join('\n\n');

  const prompt = `You are a senior technical resume writer and ATS optimization expert.
Your goal: Transform this resume into an Elite, high-ranking version for the role of "${role}" at "${company}".

STRATEGY:
Instead of a bulk rewrite, provide a "Strategy Board" of specific, granular fixes. 
Each fix must be surgical—replacing a specific weak phrasal or section with a "Better for ATS" version.

═══════════════════════════════
JOB DESCRIPTION:
${trimmedJD}
═══════════════════════════════
CURRENT RESUME:
Title: ${resumeData.personalInfo?.jobTitle || ''}
Summary: ${resumeData.summary || ''}
Skills:
${skillsContext || 'None'}
Experience:
${experienceText}
═══════════════════════════════

Return ONLY valid JSON with this exact structure:
{
  "jobTitleAfter": "Exact Match Title",
  "summary": {
    "current": "Current summary text...",
    "better": "Optimized summary focusing on ${role} keywords like DOM, async, etc."
  },
  "skills": {
    "current": "Current skills string...",
    "better": "A refined, premium skills section that mirrors the JD categories exactly.",
    "groups": [
      { "label": "Best matching skill group", "items": ["Skill A", "Skill B"] }
    ]
  },
  "experienceImprovements": [
    {
      "id": "match existing ID",
      "current": "exact full bullet line to replace",
      "better": "Optimized bullet integrating JD keywords + metrics."
    }
  ],
  "experienceAdditions": [
    {
      "id": "job ID to add to",
      "better": "Brand new high-impact bullet to add to this job."
    }
  ],
  "contactFix": {
    "current": "Current Portfolio/LinkedIn block",
    "better": "ATS-friendly structured version (e.g. Portfolio: [link])"
  },
  "keywordAlignment": {
    "matched": ["keywords already present"],
    "injected": ["keywords you added in 'better' versions"],
    "stillMissing": ["important keywords you couldn't fit"]
  }
}

RULES:
1. 'current' MUST be a VERBATIM SUBSTRING from the context. For experience, it must be the EXACT full bullet or line you are improving. Never return partial phrases.
2. 'id' must follow the [ID: ...] exactly for the job/unit.
3. Max 2 experienceImprovements per job. 1 experienceAddition max.
4. If a section is already perfect, you can omit 'summary', 'skills', or 'contactFix' by making them null.
5. Focus on HARD SKILLS and QUANTIFIABLE IMPACT.
6. For 'skills.better', return a comma-separated list of the most critical 10-15 skills aligned with the job.
7. If the current skills section is grouped, 'skills.groups' must assign each suggested skill to the best existing group when it clearly fits. Create a concise new group only for suggestions that do not fit any current group.
8. If the current skills section is not grouped, 'skills.groups' can be an empty array.
9. For experience improvements and additions, 'better' must be a single bullet line with no bullet symbol and no newline.
10. Always return valid JSON. Do not include markdown formatting outside the JSON block.
11. Never use Markdown or rich-text markers inside string values. Do not use **bold**, *italics*, underscores, or backticks.`;

  const cacheKey = `tailor-v4-${role}-${hashString(trimmedJD)}-${hashString(
    `${skillsContext}\n${experienceText}`,
  )}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return JSON.parse(cached.value);
  }

  try {
    const resultText = await callGemini(prompt, cacheKey, true);
    const parsed = JSON.parse(resultText) as Partial<TailoredSummaryResult>;
    const experienceDescriptions = new Map(
      resumeData.experience.map((item) => [item.id, item.description]),
    );
    const sanitized = sanitizeTailoredSummaryResult({
      ...parsed,
      experienceImprovements: parsed.experienceImprovements || [],
      experienceAdditions: parsed.experienceAdditions || [],
    }, experienceDescriptions);

    responseCache.set(cacheKey, { value: JSON.stringify(sanitized), timestamp: Date.now() });
    return sanitized;
  } catch (error: unknown) {
    console.error('Tailor Error:', error);
    throw error;
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
  try { activeSkills = getActiveSkillItems(resumeData.skills); } catch { activeSkills = []; }

  const topAchievement = extractTopAchievement(resumeData);
  const candidateName = resumeData.personalInfo?.fullName || '';

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
Key Achievement: ${topAchievement || 'None provided'}
${jobDescription ? `\n═══════════════════════════════\nJOB DESCRIPTION:\n${jobDescription.trim().slice(0, 800)}` : ''}
═══════════════════════════════

STRUCTURE:
Paragraph 1: Specific hook — named achievement or direct statement of fit. NEVER open with "I am writing to apply" or "I am excited".
Paragraph 2: 1-2 specific achievements with real metrics. Connect to JD requirements.
Paragraph 3: One specific reason this role appeals. Clear call to action.

RULES:
- 270-320 words total
- No fabricated metrics
- End with: "Best regards," on its own line
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
  const resumeContext = buildAtsResumeContext(resumeData);
  const cacheKey = `ats-v2-${role}-${hashString(trimmedJD)}-${hashString(resumeContext)}`;

  const prompt = `
You are an Elite Recruiting Analyst and ATS Optimization Engineer. Your goal is to provide a "Big-Tech level" audit (FAANG/Tier-1) for this candidate.

═══════════════════════════════
ROLE: ${role}
JOB DESCRIPTION:
${trimmedJD}
RESUME:
${resumeContext}
═══════════════════════════════

YOUR AUDIT REQUIREMENTS:

1. MATCH SCORE: Detailed strict scoring across 5 dimensions (total 100).

2. KEYWORD DENSITY ANALYSIS:
   - Identify the TOP 6 most important HARD SKILL keywords from the JD.
   - For each, provide the 'keyword', its 'count' in the resume, and 'importance' (1-10) based on JD frequency.

3. REPLACEMENTS / IMPROVEMENTS (Strategic "Current vs Better"):
   - Identify up to 2 experience bullets that match JD themes but are phrased poorly for ATS.
   - For each, provide 'id' (MUST match the [ID: ...] from the resume context), 'current' text, and a 'better' version.
   - The 'current' text MUST be a verbatim substring from the resume context to allow for precise injection.
   - For skills, if suggesting a replacement for a group or specific item, use the corresponding 'id'.
   - Identify 1 skills list item that needs better phrasing (e.g., adding parentheticals like "Jest (Unit Testing)").

4. CRITICAL MISTAKE IDENTIFICATION:
   - Highlight ONE major strategic or formatting flaw (e.g., "Contact info in footer", "Missing quantifiable metrics in latest role", "Vague summary").
   - Provide 'title', 'description', and the 'fix'.

5. KEYWORD FILTERING: Hard technical skills only. No soft skills.

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
  "matchedKeywords": [string],
  "missingKeywords": [string],
  "keywordDensity": [{ "keyword": string, "count": number, "importance": number }],
  "improvements": [
    { "id": "match existing ID", "type": "bullet", "current": "verbatim substring", "better": "optimized bullet" },
    { "type": "skill", "current": "skill name", "better": "optimized skill" }
  ],
  "criticalMistake": { "title": string, "description": string, "fix": string },
  "suggestions": [string]
}

RULES for improvements:
1. For 'bullet', 'current' MUST be the exact full bullet from the context. Never return partial phrases.
2. For 'skill', 'current' must be the exact skill name from the resume.
3. Max 3 improvements total.`.trim();

  const resultText = await callGemini(prompt, cacheKey, true);
  try {
    const parsed = JSON.parse(resultText);
    return {
      score: parsed.score || 0,
      keywordCoverage: parsed.keywordCoverage || 0,
      matchedCount: parsed.matchedCount || 0,
      keywordCount: parsed.keywordCount || 0,
      quantifiedBulletCount: parsed.quantifiedBulletCount || 0,
      breakdown: parsed.breakdown || [],
      matchedKeywords: parsed.matchedKeywords || [],
      missingKeywords: parsed.missingKeywords || [],
      keywordDensity: parsed.keywordDensity || [],
      improvements: ((parsed.improvements || []) as AtsAuditImprovement[]).map((imp) => ({
        id: imp.id || undefined,
        type: imp.type,
        current: imp.current,
        better: imp.better
      })),
      criticalMistake: parsed.criticalMistake || undefined,
      suggestions: parsed.suggestions || [],
    };
  } catch (e) {
    console.error('JSON Parse Error', e);
    return {
      score: 0, keywordCoverage: 0, matchedCount: 0, keywordCount: 0,
      quantifiedBulletCount: 0, breakdown: [], matchedKeywords: [],
      missingKeywords: [], suggestions: ['AI Error: Could not parse analysis.'],
      keywordDensity: [], improvements: [], criticalMistake: undefined
    };
  }
};
