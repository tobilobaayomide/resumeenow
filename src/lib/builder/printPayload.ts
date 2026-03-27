import { parseExportPayload } from '../../schemas/builder/exportPayload.js';
import type { ResumeData, TemplateId } from '../../types/resume.js';

export interface ResumePrintPayload {
  data: ResumeData;
  templateId: TemplateId;
  fileName: string;
}

export interface ResumePrintPayloadResult {
  payload: ResumePrintPayload | null;
  error: string;
}

export const resolveResumePrintPayload = (
  rawPayload: unknown,
): ResumePrintPayloadResult => {
  if (rawPayload == null) {
    return { payload: null, error: 'Missing export payload.' };
  }

  try {
    const decoded = parseExportPayload(rawPayload);
    return {
      payload: {
        data: decoded.data,
        templateId: decoded.templateId,
        fileName:
          typeof decoded.fileName === 'string' && decoded.fileName.trim()
            ? decoded.fileName.trim()
            : 'Resume',
      },
      error: '',
    };
  } catch {
    return { payload: null, error: 'Could not load resume export.' };
  }
};
