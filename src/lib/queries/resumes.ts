import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';
import { safeParseResumeRecord } from '../../schemas/domain/resume';
import {
  DEFAULT_TEMPLATE_ID,
  INITIAL_RESUME_DATA,
  normalizeTemplateId,
  type ResumeRecord,
  type TemplateId,
} from '../../types/resume';

export const getResumesQueryKey = (userId: string | null | undefined) =>
  ['resumes', userId ?? null] as const;

const RESUMES_ENDPOINT = '/api/resumes';

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      error?: string;
    };

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Fall through to text parsing.
  }

  const text = (await response.text()).trim();
  return text || 'Failed to load resumes.';
};

const parseResumeRows = (data: unknown, userId: string): ResumeRecord[] => {
  const invalidResumeIds: string[] = [];
  const normalizedRows = (Array.isArray(data) ? data : []).flatMap((resume, index) => {
    const parsedResume = safeParseResumeRecord(resume);
    if (parsedResume.success) {
      return [parsedResume.data];
    }

    const resumeId =
      typeof resume === 'object' &&
      resume !== null &&
      typeof (resume as { id?: unknown }).id === 'string'
        ? (resume as { id: string }).id
        : `index:${index}`;
    invalidResumeIds.push(resumeId);
    return [];
  });

  if (invalidResumeIds.length > 0) {
    reportRuntimeValidationIssue({
      key: `resumes.fetch.invalid-rows:${userId}:${invalidResumeIds.join(',')}`,
      source: 'resumes.fetch',
      action: 'Dropped malformed resume rows returned from persistence.',
      details: {
        userId,
        droppedCount: invalidResumeIds.length,
        resumeIds: invalidResumeIds,
      },
    });
  }

  return normalizedRows;
};

export const fetchResumes = async (userId: string): Promise<ResumeRecord[]> => {
  const response = await fetch(RESUMES_ENDPOINT);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { resumes?: unknown };
  const data = payload.resumes;

  return parseResumeRows(data, userId);
};

export const fetchResumeRecord = async (
  userId: string,
  id: string,
): Promise<ResumeRecord> => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`${RESUMES_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { resume?: unknown };
  const parsedResume = safeParseResumeRecord(payload.resume);
  if (!parsedResume.success) {
    reportRuntimeValidationIssue({
      key: `resumes.fetchOne.invalid-row:${userId}:${id}`,
      source: 'resumes.fetchOne',
      action: 'Received an invalid resume row while loading a single resume.',
      details: {
        userId,
        resumeId: id,
      },
    });
    throw new Error('Failed to parse resume.');
  }

  return parsedResume.data;
};

export const createResumeRecord = async (
  userId: string,
  title: string,
  templateId: TemplateId = DEFAULT_TEMPLATE_ID,
  content = INITIAL_RESUME_DATA,
): Promise<ResumeRecord> => {
  const payload = {
    title: title.trim() || 'Untitled Resume',
    template_id: normalizeTemplateId(templateId),
    content,
  };

  const response = await fetch(RESUMES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: payload.title,
      templateId: payload.template_id,
      content: payload.content,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const { resume: data } = (await response.json()) as { resume?: unknown };

  const normalizedResume = safeParseResumeRecord(data);
  if (!normalizedResume.success) {
    reportRuntimeValidationIssue({
      key: `resumes.create.invalid-row:${userId}`,
      source: 'resumes.create',
      action: 'Received an invalid resume row after create.',
      details: {
        userId,
      },
    });
    throw new Error('Failed to parse created resume.');
  }

  return normalizedResume.data;
};

export const updateResumeRecord = async (
  userId: string,
  id: string,
  input: {
    title: string;
    templateId: TemplateId;
    content: ResumeRecord['content'];
  },
): Promise<ResumeRecord> => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`${RESUMES_ENDPOINT}?${params.toString()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: input.title.trim() || 'Untitled Resume',
      templateId: normalizeTemplateId(input.templateId),
      content: input.content,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const { resume: data } = (await response.json()) as { resume?: unknown };
  const normalizedResume = safeParseResumeRecord(data);
  if (!normalizedResume.success) {
    reportRuntimeValidationIssue({
      key: `resumes.update.invalid-row:${userId}:${id}`,
      source: 'resumes.update',
      action: 'Received an invalid resume row after update.',
      details: {
        userId,
        resumeId: id,
      },
    });
    throw new Error('Failed to parse updated resume.');
  }

  return normalizedResume.data;
};

export const deleteResumeRecord = async (_userId: string, id: string): Promise<void> => {
  const params = new URLSearchParams({ id });
  const response = await fetch(`${RESUMES_ENDPOINT}?${params.toString()}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
};
