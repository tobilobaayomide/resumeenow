import { z } from 'zod';
import type { ResumeData } from '../../domain/resume/types.js';
import {
  parseResumeData,
  ResumeDataSchema,
} from '../domain/resume.js';

export type BuilderLocationState = {
  importedResumeData?: ResumeData;
  importedTitle?: string;
};

export const BuilderLocationStateSchema = z.object({
  importedResumeData: ResumeDataSchema.optional(),
  importedTitle: z.string().optional(),
});

const BuilderLocationStateInputSchema = z.object({
  importedResumeData: z
    .unknown()
    .optional()
    .transform((value) => (value === undefined ? undefined : parseResumeData(value))),
  importedTitle: z.preprocess(
    (value) => (typeof value === 'string' ? value : undefined),
    z.string().optional(),
  ),
});

export const parseBuilderLocationState = (
  value: unknown,
): BuilderLocationState | null => {
  const result = BuilderLocationStateInputSchema.safeParse(value);
  return result.success ? result.data : null;
};
