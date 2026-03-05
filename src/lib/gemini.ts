import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveSkillItems, type ResumeData } from '../types/resume';
import type { AtsAuditResult } from '../types/builder';

const responseCache = new Map<string, string>();

const callGemini = async (prompt: string, expectJson = false) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is missing.');

  const cacheKey = prompt.trim().slice(0, 300);
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey)!;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    if (expectJson) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    responseCache.set(cacheKey, text);
    return text;
  } catch (error: any) {
    if (error?.message?.includes('429')) throw new Error('Rate limit reached. Please wait 1 minute and try again.');
    if (error?.message?.includes('quota')) throw new Error('Daily quota exceeded. Try again tomorrow or upgrade your plan.');
    console.error('Google SDK Error:', error);
    throw new Error('AI Provider Failed. See console for details.');
  }
};

const buildResumeContext = (resumeData: ResumeData): string => {
  const { personalInfo, summary, experience, education, skills } = resumeData;
  const activeSkills = getActiveSkillItems(skills);

  return `
Name: ${personalInfo?.fullName || 'N/A'}
Title: ${personalInfo?.jobTitle || 'N/A'}
Summary: ${summary || 'None'}
Skills: ${activeSkills.join(', ') || 'None'}
Experience: ${
    experience
      ?.slice(0, 3)
      .map(
        (e: any) =>
          `[${e.id}] ${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${
            typeof e.description === 'string'
              ? e.description.slice(0, 150)
              : Array.isArray(e.description)
                ? e.description.slice(0, 3).join('. ')
                : ''
          }`,
      )
      .join('\n') || 'None'
  }
Education: ${
    education
      ?.slice(0, 2)
      .map((e: any) => `${e.degree} at ${e.school}`)
      .join(', ') || 'None'
  }`.trim();
};

export const generateTailoredSummary = async (
  resumeData: ResumeData,
  role: string,
  company: string,
  jobDescription: string,
): Promise<string> => {
  const trimmedJD = jobDescription.trim().slice(0, 500);
  const resumeContext = buildResumeContext(resumeData);

  const prompt = `
You are a resume writer. Rewrite the summary below to target the role of ${role} at ${company}.
Write max 3 sentences, concise, keyword-rich, truthful.

Resume:
${resumeContext}

Job Description (truncated):
${trimmedJD}

Return ONLY the new summary text.
`.trim();

  return callGemini(prompt);
};

export const generateCoverLetterText = async (
  resumeData: ResumeData,
  role: string,
  company: string,
  manager: string,
  tone: string,
): Promise<string> => {
  const resumeContext = buildResumeContext(resumeData);

  const prompt = `
Write a ${tone} cover letter for ${role} at ${company}.
Address it to ${manager || 'Hiring Manager'}.
Keep to 3 short paragraphs. No fluff. Return ONLY the letter text.

Applicant Info:
${resumeContext}
`.trim();

  return callGemini(prompt);
};

export const analyzeAtsCompleteness = async (
  resumeData: ResumeData,
  role: string,
  jobDescription: string,
): Promise<AtsAuditResult> => {
  const trimmedJD = jobDescription.trim().slice(0, 800);
  const resumeContext = buildResumeContext(resumeData);

  const prompt = `
ATS analysis for role: ${role}.
Return ONLY valid JSON, no markdown, matching exactly:
{
  "score": number,
  "keywordCoverage": number,
  "matchedCount": number,
  "keywordCount": number,
  "quantifiedBulletCount": number,
  "breakdown": [ { "label": string, "score": number, "max": number } ],
  "matchedKeywords": [ string ],
  "missingKeywords": [ string ],
  "suggestions": [ string ]
}

Resume:
${resumeContext}

Job Description:
${trimmedJD}
`.trim();

  const resultText = await callGemini(prompt, true);
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
