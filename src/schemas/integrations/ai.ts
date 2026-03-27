import { z } from 'zod';
import type { AtsAuditResult } from '../../types/builder/index.js';

export type TailoredSummaryResult = {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const normalizeSkillGroups = (
  value: unknown,
): { label: string; items: string[] }[] =>
  Array.isArray(value)
    ? value
        .filter(isRecord)
        .map((item) => ({
          label: toString(item.label),
          items: toStringArray(item.items),
        }))
    : [];

const normalizeTailorTextBlock = (
  value: unknown,
): { current: string; better: string } | undefined =>
  isRecord(value)
    ? {
        current: toString(value.current),
        better: toString(value.better),
      }
    : undefined;

const normalizeTailoredSummaryResult = (
  value: unknown,
): TailoredSummaryResult => {
  const record = isRecord(value) ? value : {};
  const skills = isRecord(record.skills)
    ? {
        current: toString(record.skills.current),
        better: toString(record.skills.better),
        groups: normalizeSkillGroups(record.skills.groups),
      }
    : undefined;

  return {
    jobTitleAfter: toString(record.jobTitleAfter),
    summary: normalizeTailorTextBlock(record.summary),
    skills,
    experienceImprovements: Array.isArray(record.experienceImprovements)
      ? record.experienceImprovements
          .filter(isRecord)
          .map((item) => ({
            id: toString(item.id),
            current: toString(item.current),
            better: toString(item.better),
          }))
      : [],
    experienceAdditions: Array.isArray(record.experienceAdditions)
      ? record.experienceAdditions
          .filter(isRecord)
          .map((item) => ({
            id: toString(item.id),
            better: toString(item.better),
          }))
      : [],
    contactFix: normalizeTailorTextBlock(record.contactFix),
    keywordAlignment: isRecord(record.keywordAlignment)
      ? {
          matched: toStringArray(record.keywordAlignment.matched),
          injected: toStringArray(record.keywordAlignment.injected),
          stillMissing: toStringArray(record.keywordAlignment.stillMissing),
        }
      : {
          matched: [],
          injected: [],
          stillMissing: [],
        },
  };
};

const TailorTextBlockSchema = z.object({
  current: z.string(),
  better: z.string(),
});

const SkillGroupSchema = z.object({
  label: z.string(),
  items: z.array(z.string()),
});

export const TailoredSummaryResultSchema = z.object({
  jobTitleAfter: z.string(),
  summary: TailorTextBlockSchema.optional(),
  skills: z
    .object({
      current: z.string(),
      better: z.string(),
      groups: z.array(SkillGroupSchema).optional(),
    })
    .optional(),
  experienceImprovements: z.array(
    z.object({
      id: z.string(),
      current: z.string(),
      better: z.string(),
    }),
  ),
  experienceAdditions: z.array(
    z.object({
      id: z.string(),
      better: z.string(),
    }),
  ),
  contactFix: TailorTextBlockSchema.optional(),
  keywordAlignment: z.object({
    matched: z.array(z.string()),
    injected: z.array(z.string()),
    stillMissing: z.array(z.string()),
  }),
});

const normalizeAtsAuditResult = (value: unknown): AtsAuditResult => {
  const record = isRecord(value) ? value : {};

  return {
    score: toNumber(record.score),
    keywordCoverage: toNumber(record.keywordCoverage),
    matchedCount: toNumber(record.matchedCount),
    keywordCount: toNumber(record.keywordCount),
    quantifiedBulletCount: toNumber(record.quantifiedBulletCount),
    breakdown: Array.isArray(record.breakdown)
      ? record.breakdown
          .filter(isRecord)
          .map((item) => ({
            label: toString(item.label),
            score: toNumber(item.score),
            max: toNumber(item.max),
          }))
      : [],
    matchedKeywords: toStringArray(record.matchedKeywords),
    missingKeywords: toStringArray(record.missingKeywords),
    suggestions: toStringArray(record.suggestions),
    keywordDensity: Array.isArray(record.keywordDensity)
      ? record.keywordDensity
          .filter(isRecord)
          .map((item) => ({
            keyword: toString(item.keyword),
            count: toNumber(item.count),
            importance: toNumber(item.importance),
          }))
      : [],
    improvements: Array.isArray(record.improvements)
      ? record.improvements
          .filter(isRecord)
          .flatMap((item) => {
            if (item.type !== 'bullet' && item.type !== 'skill') {
              return [];
            }

            return [{
              id: toString(item.id) || undefined,
              type: item.type,
              current: toString(item.current),
              better: toString(item.better),
            }];
          })
      : [],
    criticalMistake: isRecord(record.criticalMistake)
      ? {
          title: toString(record.criticalMistake.title),
          description: toString(record.criticalMistake.description),
          fix: toString(record.criticalMistake.fix),
        }
      : undefined,
  };
};

export const AtsAuditResultSchema = z.object({
  score: z.number(),
  keywordCoverage: z.number(),
  matchedCount: z.number(),
  keywordCount: z.number(),
  quantifiedBulletCount: z.number(),
  breakdown: z.array(
    z.object({
      label: z.string(),
      score: z.number(),
      max: z.number(),
    }),
  ),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  keywordDensity: z
    .array(
      z.object({
        keyword: z.string(),
        count: z.number(),
        importance: z.number(),
      }),
    )
    .optional(),
  improvements: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(['bullet', 'skill']),
        current: z.string(),
        better: z.string(),
      }),
    )
    .optional(),
  criticalMistake: z
    .object({
      title: z.string(),
      description: z.string(),
      fix: z.string(),
    })
    .optional(),
});

export const parseTailoredSummaryResult = (
  value: unknown,
): TailoredSummaryResult =>
  TailoredSummaryResultSchema.parse(
    normalizeTailoredSummaryResult(value),
  ) as TailoredSummaryResult;

export const parseAtsAuditResult = (
  value: unknown,
): AtsAuditResult =>
  AtsAuditResultSchema.parse(
    normalizeAtsAuditResult(value),
  ) as AtsAuditResult;
