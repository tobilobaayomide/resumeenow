import { z } from 'zod';
import type { ResumeData } from '../../domain/resume/types.js';
import type { TemplateId } from '../../domain/templates/types.js';
import {
  parseTemplateId,
  ResumeDataSchema,
  TemplateIdSchema,
} from '../domain/resume.js';

export type BuilderPersistedState = {
  resumeData: ResumeData;
  templateId: TemplateId;
  title: string;
};

export const BuilderPersistedStateSchema = z.object({
  resumeData: ResumeDataSchema,
  templateId: TemplateIdSchema,
  title: z.string(),
});

const requiredPersistedField = (fieldName: string) =>
  z.unknown().refine(
    (value) => value !== undefined && value !== null,
    `${fieldName} is required.`,
  );

const BuilderPersistedStateInputSchema = z.object({
  resumeData: requiredPersistedField('resumeData').pipe(ResumeDataSchema),
  templateId: requiredPersistedField('templateId').transform((value) =>
    parseTemplateId(value),
  ),
  title: z.preprocess(
    (value) => (typeof value === 'string' ? value : 'Untitled Resume'),
    z.string(),
  ),
});

export const parseBuilderPersistedState = (
  value: unknown,
): BuilderPersistedState | null => {
  const result = BuilderPersistedStateInputSchema.safeParse(value);
  return result.success ? result.data : null;
};
