import { z } from 'zod';
import type { ParsedResumeResult } from '../../types/parser/resumeParser.js';
import { parseResumeData, ResumeDataSchema } from '../domain/resume.js';

export const ParsedResumeResultSchema = z.object({
  data: ResumeDataSchema,
  suggestedTitle: z.string(),
});

export const ParseResumeApiResponseSchema = z.object({
  data: ResumeDataSchema,
  suggestedTitle: z.string().optional(),
  error: z.string().optional(),
});

const ParseResumeApiResponseInputSchema = z.object({
  data: z.unknown().transform((value) => parseResumeData(value)),
  suggestedTitle: z.string().optional(),
  error: z.string().optional(),
});

export const parseResumeApiResponse = (
  value: unknown,
  fallbackTitle: string,
): ParsedResumeResult => {
  const result = ParseResumeApiResponseInputSchema.safeParse(value);
  if (!result.success) {
    throw new Error('Server returned an invalid resume parse response.');
  }

  return {
    data: result.data.data,
    suggestedTitle:
      typeof result.data.suggestedTitle === 'string' &&
      result.data.suggestedTitle.trim()
        ? result.data.suggestedTitle
        : fallbackTitle,
  };
};
