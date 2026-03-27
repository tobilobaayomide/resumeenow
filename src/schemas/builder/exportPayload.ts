import { z } from 'zod';
import type { ResumeData } from '../../domain/resume/types.js';
import type { TemplateId } from '../../domain/templates/types.js';
import {
  ResumeDataSchema,
  TemplateIdSchema,
} from '../domain/resume.js';

export type ExportPayload = {
  data: ResumeData;
  templateId: TemplateId;
  fileName?: string;
};

export const ExportPayloadSchema = z.object({
  data: ResumeDataSchema,
  templateId: TemplateIdSchema,
  fileName: z.string().optional(),
});

const requiredExportPayloadField = (fieldName: string) =>
  z.unknown().refine(
    (value) => value !== undefined && value !== null,
    `${fieldName} is required.`,
  );

const ExportPayloadInputSchema = z.object({
  data: requiredExportPayloadField('data').pipe(ResumeDataSchema),
  templateId: requiredExportPayloadField('templateId').pipe(TemplateIdSchema),
  fileName: z.string().optional(),
});

export const parseExportPayload = (value: unknown): ExportPayload => {
  const result = ExportPayloadInputSchema.safeParse(value);
  if (!result.success) {
    throw new Error('Invalid export payload.');
  }

  return result.data;
};
