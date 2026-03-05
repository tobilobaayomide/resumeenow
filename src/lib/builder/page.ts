import type { AtsAuditResult } from '../../types/builder';
import { getActiveSkillItems, type ResumeData, type TemplateId } from '../../types/resume';

export const SUMMARY_MAX_LENGTH = 500;
export const AUTOSAVE_DELAY_MS = 2000;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const toString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

export const clampSummary = (value: string): string =>
  value.slice(0, SUMMARY_MAX_LENGTH);

export const serializeDraft = (
  draftTitle: string,
  draftTemplateId: TemplateId,
  draftContent: ResumeData,
) =>
  JSON.stringify({
    title: draftTitle.trim() || 'Untitled Resume',
    template_id: draftTemplateId,
    content: draftContent,
  });

export const extractKeywords = (text: string): string[] => {
  const stopWords = new Set([
    'with',
    'from',
    'that',
    'this',
    'your',
    'have',
    'will',
    'and',
    'for',
    'the',
    'are',
    'you',
    'our',
    'to',
    'in',
    'of',
    'on',
    'a',
    'an',
    'job',
    'role',
    'team',
    'work',
    'using',
    'experience',
    'required',
    'preferred',
    'responsibilities',
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word));

  const unique: string[] = [];
  for (const token of tokens) {
    if (!unique.includes(token)) unique.push(token);
    if (unique.length === 20) break;
  }
  return unique;
};

export const runLocalAtsAudit = (
  data: ResumeData,
  jobDescription: string,
  targetRole: string,
): AtsAuditResult => {
  const activeSkills = getActiveSkillItems(data.skills);
  const keywords = extractKeywords(`${targetRole} ${jobDescription}`);
  const resumeCorpus = [
    data.summary,
    activeSkills.join(' '),
    data.languages.join(' '),
    data.achievements.join(' '),
    ...data.experience.map(
      (item) => `${item.role} ${item.company} ${item.description}`,
    ),
    ...data.projects.map((item) => `${item.name} ${item.description}`),
  ]
    .join(' ')
    .toLowerCase();

  const quantifiedBulletCount = data.experience.reduce((count, item) => {
    const matches = item.description.match(/\b\d+%?|\$?\d+[kKmM]?|x\b/g);
    return count + (matches ? matches.length : 0);
  }, 0);

  const matchedKeywords = keywords.filter((keyword) =>
    resumeCorpus.includes(keyword.toLowerCase()),
  );
  const missingKeywords = keywords.filter(
    (keyword) => !matchedKeywords.includes(keyword),
  );
  const keywordCoverage =
    keywords.length > 0
      ? Math.round((matchedKeywords.length / keywords.length) * 100)
      : 50;
  const summaryScore =
    data.summary.trim().length >= 80 ? 100 : data.summary.trim() ? 60 : 0;
  const skillScore = Math.min(100, activeSkills.length * 10);
  const experienceScore = Math.min(100, data.experience.length * 35);
  const impactScore = Math.min(100, quantifiedBulletCount * 12);

  const breakdown = [
    { label: 'Keywords', score: Math.round(keywordCoverage * 0.5), max: 50 },
    { label: 'Skills Coverage', score: Math.round(skillScore * 0.15), max: 15 },
    {
      label: 'Experience Depth',
      score: Math.round(experienceScore * 0.2),
      max: 20,
    },
    {
      label: 'Quantified Impact',
      score: Math.round(impactScore * 0.1),
      max: 10,
    },
    {
      label: 'Summary Quality',
      score: Math.round(summaryScore * 0.05),
      max: 5,
    },
  ];
  const score = breakdown.reduce((total, item) => total + item.score, 0);

  const suggestions: string[] = [];
  if (missingKeywords.length > 0 && keywords.length > 0) {
    suggestions.push(
      `Add missing keywords: ${missingKeywords.slice(0, 5).join(', ')}.`,
    );
  }
  if (summaryScore < 100) {
    suggestions.push(
      'Tighten your summary to 2-3 lines focused on role fit and outcomes.',
    );
  }
  if (data.experience.length === 0) {
    suggestions.push(
      'Add at least one experience entry with measurable impact.',
    );
  }
  if (activeSkills.length < 8) {
    suggestions.push(
      'Expand your skills list with role-specific tools and frameworks.',
    );
  }
  if (quantifiedBulletCount < 3) {
    suggestions.push(
      'Add more numbers (%, $, scale, time saved) to demonstrate impact.',
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      'Great baseline. Refine bullet points to include outcome metrics.',
    );
  }

  return {
    score,
    keywordCoverage,
    matchedCount: matchedKeywords.length,
    keywordCount: keywords.length,
    quantifiedBulletCount,
    breakdown,
    matchedKeywords,
    missingKeywords,
    suggestions,
  };
};
