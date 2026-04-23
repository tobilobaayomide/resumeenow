import { findMatchingDescriptionBullet } from './descriptionBullets';
import { stripInlineFormattingText } from './inlineFormatting';
import {
  parseAtsAuditResult,
  parseTailoredSummaryResult,
  type TailoredSummaryResult,
} from '../schemas/integrations/ai';
import { reportRuntimeValidationIssue } from './observability/runtimeValidation';
import { sanitizeAiKeywordList, sanitizeAiPlainText } from './aiText';
import {
  formatAtsAuditReferenceDate,
  sanitizeAtsAuditResult,
} from './ai/atsAudit';
import {
  GeminiProxyError,
  type GeminiProxyErrorPayload,
  getGeminiRetryDelayMs,
  shouldRetryGeminiError,
} from './ai/geminiRetry';
import { createPersistentTimedLruCache } from './ai/persistentCache';
import { supabaseAnonKey, supabaseUrl } from './supabase';
import { getValidAccessToken } from './auth/accessToken';
import { getActiveSkillItems } from '../types/resume';
import { parseAiGroupedSkills } from './aiResumeApply';
import { createRequestScheduler, createTimedLruCache } from './ai/requestControl';
import type { ResumeData } from '../types/resume';
import type { AtsAuditResult } from '../types/builder';

// ─── Cache ────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const MAX_CONCURRENT = 2;
const AI_REQUEST_TIMEOUT_MS = 75_000;
const PERSISTENT_CACHE_NAMESPACE = 'resumeenow:ai-cache:v1';
const GEMINI_PROXY_ENDPOINT = `${supabaseUrl}/functions/v1/gemini-proxy`;

export interface AiRequestProgress {
  phase:
    | 'preparing'
    | 'authenticating'
    | 'checking_limits'
    | 'generating'
    | 'finalizing'
    | 'cached';
  label: string;
}

type AiProgressListener = (progress: AiRequestProgress) => void;

interface GeminiProxySuccessPayload {
  text: string;
}

const AI_PROGRESS_LABELS: Record<AiRequestProgress['phase'], string> = {
  preparing: 'Preparing request…',
  authenticating: 'Authenticating…',
  checking_limits: 'Checking plan limits…',
  generating: 'Generating response…',
  finalizing: 'Finalizing result…',
  cached: 'Using cached result…',
};

const responseCache = createTimedLruCache<string>({
  ttlMs: CACHE_TTL_MS,
  maxEntries: MAX_CACHE_ENTRIES,
});
const persistentResponseCache = createPersistentTimedLruCache<string>({
  namespace: PERSISTENT_CACHE_NAMESPACE,
  ttlMs: CACHE_TTL_MS,
  maxEntries: MAX_CACHE_ENTRIES,
});
const requestScheduler = createRequestScheduler(MAX_CONCURRENT);
const inFlightRequests = new Map<string, Promise<string>>();

const emitAiProgress = (
  listener: AiProgressListener | undefined,
  phase: AiRequestProgress['phase'],
  label = AI_PROGRESS_LABELS[phase],
) => {
  listener?.({ phase, label });
};

const getCachedResponse = (cacheKey: string): string | undefined => {
  const memoryCached = responseCache.get(cacheKey);
  if (memoryCached) return memoryCached;

  const persistentCached = persistentResponseCache.get(cacheKey);
  if (persistentCached) {
    responseCache.set(cacheKey, persistentCached);
  }
  return persistentCached;
};

const setCachedResponse = (cacheKey: string, value: string) => {
  responseCache.set(cacheKey, value);
  persistentResponseCache.set(cacheKey, value);
};

const deleteCachedResponse = (cacheKey: string) => {
  responseCache.delete(cacheKey);
  persistentResponseCache.delete(cacheKey);
};

export const clearAiResponseCaches = () => {
  responseCache.clear();
  persistentResponseCache.clear();
  inFlightRequests.clear();
};

const normalizeErrorMessage = (message: string): string =>
  message.replace(/^(Error:\s*)+/i, '').trim();

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error
      ? error.name === 'AbortError'
      : false;

// ─── Error handler ────────────────────────────────────────────────────────────
const handleError = (error: unknown): never => {
  const message = normalizeErrorMessage(error instanceof Error ? error.message : String(error));
  if (message.includes('Invalid JWT') || message.includes('invalid JWT') || message.includes('auth token')) {
    throw new Error('Your session expired. Please sign in again and retry.');
  }
  if (message.includes('Please sign in again to use AI tools.')) {
    throw new Error('Your session expired. Please sign in again and retry.');
  }
  if (message.includes('AI request timed out.')) {
    throw new Error('AI request timed out. Check the AI server setup and try again.');
  }
  if (message.includes('AI provider model is unavailable right now.')) {
    throw new Error('AI provider is temporarily unavailable. Please try again in a moment.');
  }
  if (message.includes('AI provider is temporarily unavailable.')) {
    throw new Error('AI provider is temporarily unavailable. Please try again shortly.');
  }
  if (message.includes('429'))
    throw new Error('Rate limit reached. Please wait a moment and try again.');
  if (message.includes('quota'))
    throw new Error('Daily quota exceeded. Try again tomorrow.');
  if (message.includes('Daily AI limit reached.')) {
    throw new Error('Daily AI limit reached. Try again after 00:00 UTC.');
  }
  if (message.includes('Another AI request is already running.')) {
    throw new Error('Another AI request is already running. Please wait for it to finish.');
  }
  if (message.includes("You're sending AI requests too quickly.")) {
    throw new Error(message);
  }
  console.error('Gemini Error:', error);
  throw new Error(message || 'AI Provider Failed. See console for details.');
};

const buildGeminiProxyError = (
  payload: GeminiProxyErrorPayload,
  fallback: {
    message?: string;
    status?: number;
  } = {},
): GeminiProxyError => {
  const message =
    (typeof payload.message === 'string' && payload.message.trim()) ||
    fallback.message ||
    (typeof fallback.status === 'number' ? `AI request failed with status ${fallback.status}.` : '') ||
    'AI request failed.';

  return new GeminiProxyError(message, {
    ...payload,
    status: payload.status ?? fallback.status,
  });
};

const readProxyError = async (response: Response): Promise<GeminiProxyError> => {
  try {
    const payload = (await response.clone().json()) as GeminiProxyErrorPayload;
    if (payload && typeof payload === 'object') {
      return buildGeminiProxyError(payload, { status: response.status });
    }
  } catch {
    // Fall through to text parsing below.
  }

  try {
    const text = (await response.clone().text()).trim();
    if (text) {
      return buildGeminiProxyError({}, { message: text, status: response.status });
    }
  } catch {
    // Ignore text parsing failures.
  }

  return buildGeminiProxyError({}, { status: response.status });
};

const parseSseChunk = (rawEvent: string): { event: string; data: string } | null => {
  const lines = rawEvent
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (!lines.length) return null;

  let event = 'message';
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  });

  return {
    event,
    data: dataLines.join('\n'),
  };
};

const consumeGeminiProxyStream = async (
  response: Response,
  onProgress?: AiProgressListener,
): Promise<GeminiProxySuccessPayload> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('AI stream was unavailable. Please try again.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done }).replace(/\r/g, '');

    let delimiterIndex = buffer.indexOf('\n\n');
    while (delimiterIndex >= 0) {
      const rawEvent = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 2);

      const parsedEvent = parseSseChunk(rawEvent);
      if (parsedEvent) {
        if (parsedEvent.event === 'status') {
          try {
            const payload = JSON.parse(parsedEvent.data) as {
              phase?: AiRequestProgress['phase'];
              label?: string;
            };
            const phase = payload.phase;
            if (phase && phase in AI_PROGRESS_LABELS) {
              emitAiProgress(onProgress, phase, payload.label || AI_PROGRESS_LABELS[phase]);
            }
          } catch {
            // Ignore malformed status events and continue reading.
          }
        }

        if (parsedEvent.event === 'result') {
          return JSON.parse(parsedEvent.data) as GeminiProxySuccessPayload;
        }

        if (parsedEvent.event === 'error') {
          try {
            const payload = JSON.parse(parsedEvent.data) as GeminiProxyErrorPayload;
            throw buildGeminiProxyError(payload);
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw buildGeminiProxyError({});
          }
        }
      }

      delimiterIndex = buffer.indexOf('\n\n');
    }

    if (done) {
      break;
    }
  }

  throw new Error('AI request ended before a final result was returned.');
};

const invokeGeminiProxy = async (
  prompt: string,
  expectJson: boolean,
  accessToken: string,
  onProgress?: AiProgressListener,
): Promise<GeminiProxySuccessPayload> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_PROXY_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
        Accept: onProgress ? 'text/event-stream' : 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        expectJson,
        stream: Boolean(onProgress),
      }),
    });

    if (!response.ok) {
      throw await readProxyError(response);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return await consumeGeminiProxyStream(response, onProgress);
    }

    const payload = (await response.json()) as GeminiProxySuccessPayload & { error?: string };
    if (payload.error) {
      throw new Error(payload.error);
    }

    emitAiProgress(onProgress, 'finalizing');
    return payload;
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error('AI request timed out.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const callWithRetry = async (
  prompt: string,
  expectJson: boolean,
  retries = 2,
  hasRefreshedSession = false,
  onProgress?: AiProgressListener,
): Promise<string> => {
  try {
    emitAiProgress(onProgress, 'authenticating');
    const accessToken = await getValidAccessToken('Please sign in again to use AI tools.');
    const data = await invokeGeminiProxy(prompt, expectJson, accessToken, onProgress);

    let text: string = data.text ?? '';
    if (expectJson) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return text;
  } catch (error: unknown) {
    const message = normalizeErrorMessage(error instanceof Error ? error.message : String(error));
    if (
      !hasRefreshedSession &&
      (message.includes('Invalid JWT') ||
        message.includes('invalid JWT') ||
        message.includes('auth token'))
    ) {
      try {
        await getValidAccessToken('Please sign in again to use AI tools.');
        return callWithRetry(prompt, expectJson, retries, true, onProgress);
      } catch {
        // Fall through to the shared error handling below.
      }
    }
    if (retries > 0 && (message.includes('429') || shouldRetryGeminiError(error))) {
      const delay = getGeminiRetryDelayMs(error, retries);
      console.warn(`AI request retry scheduled in ${delay / 1000}s (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, delay));
      emitAiProgress(onProgress, 'preparing', `Retrying in ${delay / 1000}s…`);
      return callWithRetry(prompt, expectJson, retries - 1, hasRefreshedSession, onProgress);
    }
    return handleError(error);
  }
};

const callGemini = async (
  prompt: string,
  cacheKey: string,
  expectJson = false,
  onProgress?: AiProgressListener,
): Promise<string> => {
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    emitAiProgress(onProgress, 'cached');
    return cached;
  }

  const inFlightRequest = inFlightRequests.get(cacheKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = requestScheduler.run(async () => {
    const queuedCached = getCachedResponse(cacheKey);
    if (queuedCached) {
      emitAiProgress(onProgress, 'cached');
      return queuedCached;
    }

    emitAiProgress(onProgress, 'preparing');
    const text = await callWithRetry(prompt, expectJson, 2, false, onProgress);
    setCachedResponse(cacheKey, text);
    return text;
  });

  inFlightRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    if (inFlightRequests.get(cacheKey) === request) {
      inFlightRequests.delete(cacheKey);
    }
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
Summary: ${stripInlineFormattingText(summary || '') || 'None'}
Skills: ${activeSkills.join(', ') || 'None'}
Experience: ${
    experience?.slice(0, 4).map(
      (e) =>
        `[ID: ${e.id}] ${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${
          stripInlineFormattingText(e.description || '').slice(0, 800) || ''
        }`,
    ).join('\n') || 'None'
  }
Education: ${
    education?.slice(0, 2).map((e) => `[ID: ${e.id}] ${e.degree} at ${e.school}`).join(', ') || 'None'
  }`.trim();
};

const splitBullets = (description: string): string[] => {
  const plainDescription = stripInlineFormattingText(description);
  if (!plainDescription) return [];
  const byNewline = plainDescription.split('\n').map((b) => b.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  const bySentence = plainDescription
    .split(/(?<=[.!?])\s+(?=[A-Z][a-z])/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (bySentence.length > 1) return bySentence;
  return [plainDescription.trim()];
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
  onProgress?: AiProgressListener,
): Promise<TailoredSummaryResult> => {
  const trimmedJD = jobDescription.trim().slice(0, 2500);
  try { getActiveSkillItems(resumeData.skills); } catch { /* ignore */ }
  const skillsContext = buildSkillsContext(resumeData);

  const experienceContext = resumeData.experience.map((e) => {
    return {
      id: e.id,
      role: e.role,
      company: e.company,
      description: stripInlineFormattingText(e.description),
    };
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
Summary: ${stripInlineFormattingText(resumeData.summary || '')}
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
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    emitAiProgress(onProgress, 'cached');
    try {
      return parseTailoredSummaryResult(JSON.parse(cached));
    } catch (error) {
      reportRuntimeValidationIssue({
        key: `gemini.tailor.invalid-cache:${cacheKey}`,
        source: 'gemini.tailor.cache',
        action: 'Discarded an invalid cached tailor response.',
        details: {
          cacheKey,
        },
        error,
      });
      deleteCachedResponse(cacheKey);
    }
  }

  const requestCacheKey = `${cacheKey}:raw`;

  try {
    const resultText = await callGemini(prompt, requestCacheKey, true, onProgress);
    const parsed = parseTailoredSummaryResult(JSON.parse(resultText));
    const experienceDescriptions = new Map(
      resumeData.experience.map((item) => [item.id, item.description]),
    );
    const sanitized = sanitizeTailoredSummaryResult({
      ...parsed,
      experienceImprovements: parsed.experienceImprovements || [],
      experienceAdditions: parsed.experienceAdditions || [],
    }, experienceDescriptions);

    deleteCachedResponse(requestCacheKey);
    setCachedResponse(cacheKey, JSON.stringify(sanitized));
    return sanitized;
  } catch (error: unknown) {
    deleteCachedResponse(requestCacheKey);
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
  onProgress?: AiProgressListener,
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
Summary: ${stripInlineFormattingText(resumeData.summary || '').slice(0, 200) || ''}
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

  return callGemini(prompt, cacheKey, false, onProgress);
};

export const analyzeAtsCompleteness = async (
  resumeData: ResumeData,
  role: string,
  jobDescription: string,
  onProgress?: AiProgressListener,
): Promise<AtsAuditResult> => {
  const trimmedJD = jobDescription.trim().slice(0, 1500);
  const resumeContext = buildAtsResumeContext(resumeData);
  const auditReferenceDate = formatAtsAuditReferenceDate();
  const cacheKey = `ats-v3-${role}-${hashString(trimmedJD)}-${hashString(resumeContext)}`;

  const prompt = `
You are an Elite Recruiting Analyst and ATS Optimization Engineer. Your goal is to provide a "Big-Tech level" audit (FAANG/Tier-1) for this candidate.

═══════════════════════════════
ROLE: ${role}
TODAY (UTC): ${auditReferenceDate}
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
   - Highlight ONE major strategic or formatting flaw only if there is clear evidence in the resume.
   - If there is no major mistake, return "criticalMistake": null.
   - Never invent a red flag just to fill the field.
   - Never label an employment date as future employment unless the start date or end date is chronologically after TODAY.
   - Example: if TODAY is ${auditReferenceDate}, then "FEB 2025 - DEC 2025" is NOT future employment.
   - Provide 'title', 'description', and the 'fix' only when a real issue exists.

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
  "criticalMistake": { "title": string, "description": string, "fix": string } | null,
  "suggestions": [string]
}

RULES for improvements:
1. For 'bullet', 'current' MUST be the exact full bullet from the context. Never return partial phrases.
2. For 'skill', 'current' must be the exact skill name from the resume.
3. Max 3 improvements total.`.trim();

  const resultText = await callGemini(prompt, cacheKey, true, onProgress);
  try {
    return sanitizeAtsAuditResult(
      parseAtsAuditResult(JSON.parse(resultText)),
      resumeData,
    );
  } catch (e) {
    console.error('JSON Parse Error', e);
    deleteCachedResponse(cacheKey);
    return {
      score: 0, keywordCoverage: 0, matchedCount: 0, keywordCount: 0,
      quantifiedBulletCount: 0, breakdown: [], matchedKeywords: [],
      missingKeywords: [], suggestions: ['AI Error: Could not parse analysis.'],
      keywordDensity: [], improvements: [], criticalMistake: undefined
    };
  }
};
