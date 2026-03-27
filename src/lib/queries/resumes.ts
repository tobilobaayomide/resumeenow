import { reportRuntimeValidationIssue } from '../observability/runtimeValidation';
import { supabase } from '../supabase';
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
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return parseResumeRows(data, userId);
};

export const createResumeRecord = async (
  userId: string,
  title: string,
  templateId: TemplateId = DEFAULT_TEMPLATE_ID,
): Promise<ResumeRecord> => {
  const payload = {
    user_id: userId,
    title: title.trim() || 'Untitled Resume',
    template_id: normalizeTemplateId(templateId),
    content: INITIAL_RESUME_DATA,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('resumes')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw error;
  }

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

export const deleteResumeRecord = async (userId: string, id: string): Promise<void> => {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
};
