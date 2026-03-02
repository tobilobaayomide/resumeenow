import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_TEMPLATE_ID,
  INITIAL_RESUME_DATA,
  normalizeResumeRecord,
  normalizeTemplateId,
  type ResumeRecord,
  type TemplateId,
} from '../types/resume';
import type { UseResumesResult } from '../types/hooks';

export const useResumes = (userId: string | undefined): UseResumesResult => {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    if (!userId) {
      setResumes([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      throw fetchError;
    }

    const normalized = (Array.isArray(data) ? data : [])
      .map(normalizeResumeRecord)
      .filter((resume): resume is ResumeRecord => resume !== null);

    setResumes(normalized);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchResumes().catch(() => {
        // error state is set inside fetchResumes
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchResumes]);

  const createResume = async (
    title: string,
    templateId: TemplateId = DEFAULT_TEMPLATE_ID,
  ): Promise<ResumeRecord> => {
    if (!userId) {
      throw new Error('Login required.');
    }

    const payload = {
      user_id: userId,
      title: title.trim() || 'Untitled Resume',
      template_id: normalizeTemplateId(templateId),
      content: INITIAL_RESUME_DATA,
      updated_at: new Date().toISOString(),
    };

    const { data, error: insertError } = await supabase
      .from('resumes')
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const normalized = normalizeResumeRecord(data);
    if (!normalized) {
      throw new Error('Failed to parse created resume.');
    }

    setResumes((prev) => [normalized, ...prev]);
    return normalized;
  };

  const deleteResume = async (id: string): Promise<void> => {
    if (!userId) {
      throw new Error('Login required.');
    }

    const { error: deleteError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    setResumes((prev) => prev.filter((resume) => resume.id !== id));
  };

  return {
    resumes,
    loading,
    error,
    createResume,
    deleteResume,
    refreshResumes: fetchResumes,
  };
};
