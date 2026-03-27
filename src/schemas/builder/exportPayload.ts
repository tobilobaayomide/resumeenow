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

export const parseExportPayload = (value: unknown): ExportPayload => {
  const result = ExportPayloadSchema.safeParse(value);
  if (!result.success) {
    throw new Error('Invalid export payload.');
  }

  return result.data;
};
