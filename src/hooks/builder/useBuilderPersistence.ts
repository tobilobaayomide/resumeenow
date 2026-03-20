import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { AUTOSAVE_DELAY_MS, clampSummary, serializeDraft } from '../../lib/builder/page';
import { getErrorMessage } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import {
  INITIAL_RESUME_DATA,
  normalizeResumeData,
  normalizeResumeRecord,
  normalizeTemplateId,
  type ResumeData,
  type TemplateId,
} from '../../types/resume';
import { downloadResumeAsPdf } from '../../lib/builder/export';
import { recordPdfExport } from '../../lib/dashboard/exportStatus';
import { useBuilderStore } from '../../store/builderStore';

interface BuilderLocationState {
  importedResumeData?: ResumeData;
  importedTitle?: string;
}

interface UseBuilderPersistenceArgs {
  id: string | undefined;
  searchParams: URLSearchParams;
  locationState: BuilderLocationState | null;
  user: User | null;
  navigate: NavigateFunction;
}

interface UseBuilderPersistenceResult {
  isNew: boolean;
  isSaving: boolean;
  isAutosaving: boolean;
  isDirty: boolean;
  saveStatusLabel: string;
  saveResume: (options?: { silent?: boolean }) => Promise<void>;
  handleBackToDashboard: () => void;
  handleDownload: () => void;
}

export const useBuilderPersistence = ({
  id,
  searchParams,
  locationState,
  user,
  navigate,
}: UseBuilderPersistenceArgs): UseBuilderPersistenceResult => {
  const resumeData = useBuilderStore((store) => store.resumeData);
  const templateId = useBuilderStore((store) => store.templateId);
  const title = useBuilderStore((store) => store.title);
  const setResumeData = useBuilderStore((store) => store.setResumeData);
  const setTemplateId = useBuilderStore((store) => store.setTemplateId);
  const setTitle = useBuilderStore((store) => store.setTitle);

  const [isSaving, setIsSaving] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [hasHandledAutoDownload, setHasHandledAutoDownload] = useState(false);
  const hasHydratedInitialState = useRef(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeDraft(
      searchParams.get('title') || 'Untitled Resume',
      normalizeTemplateId(searchParams.get('template')),
      INITIAL_RESUME_DATA,
    ),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const isNew = id === 'new';
  const currentSnapshot = useMemo(
    () => serializeDraft(title, templateId, resumeData),
    [title, templateId, resumeData],
  );
  const saveStatusLabel = useMemo(() => {
    if (isSaving) return 'Saving...';
    if (isAutosaving) return 'Autosaving...';
    if (isDirty) return 'Unsaved changes';
    if (!lastSavedAt) return 'All changes saved';
    return `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [isAutosaving, isDirty, isSaving, lastSavedAt]);

  const setLoadedResumeState = useCallback((
    nextData: ResumeData,
    nextTemplateId: TemplateId,
    nextTitle: string,
    savedAt: string | null = null,
  ) => {
    const resolvedTitle = nextTitle.trim() || 'Untitled Resume';
    setResumeData(nextData);
    setTemplateId(nextTemplateId);
    setTitle(resolvedTitle);
    setSavedSnapshot(serializeDraft(resolvedTitle, nextTemplateId, nextData));
    setIsDirty(false);
    setLastSavedAt(savedAt);
  }, [setResumeData, setTemplateId, setTitle]);

  useEffect(() => {
    if (!isNew || hasHydratedInitialState.current) return;

    const nextTemplateId = normalizeTemplateId(searchParams.get('template'));
    const queryTitle = searchParams.get('title');
    const importedTitle = locationState?.importedTitle;
    const nextTitle = queryTitle || importedTitle || 'Untitled Resume';
    const nextData = locationState?.importedResumeData
      ? normalizeResumeData(locationState.importedResumeData)
      : INITIAL_RESUME_DATA;

    setLoadedResumeState(
      {
        ...nextData,
        summary: clampSummary(nextData.summary),
      },
      nextTemplateId,
      nextTitle,
    );
    hasHydratedInitialState.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, locationState]);

  useEffect(() => {
    if (!isNew && id && user && !hasHydratedInitialState.current) {
      const fetchResume = async () => {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          toast.error("Couldn't open that resume.");
          navigate('/dashboard');
          return;
        }

        const resume = normalizeResumeRecord(data);
        if (!resume) {
          toast.error("Couldn't parse that resume.");
          navigate('/dashboard');
          return;
        }

        setLoadedResumeState(
          {
            ...resume.content,
            summary: clampSummary(resume.content.summary),
          },
          resume.template_id,
          resume.title || 'Untitled Resume',
          resume.updated_at,
        );
        hasHydratedInitialState.current = true;
      };

      void fetchResume();
    }
  }, [id, isNew, navigate, setLoadedResumeState, user]);

  useEffect(() => {
    setIsDirty(currentSnapshot !== savedSnapshot);
  }, [currentSnapshot, savedSnapshot]);

  const handleDownload = useCallback(async () => {
    const fileName = title || resumeData.personalInfo.fullName || 'Resume';
    await downloadResumeAsPdf(fileName, resumeData, templateId);

    try {
      recordPdfExport(user?.id, id && id !== 'new' ? id : null);
    } catch {
      // Ignore localStorage failures
    }
  }, [id, resumeData, templateId, title, user?.id]);

  const handleBackToDashboard = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave builder anyway?')) {
      return;
    }
    navigate('/dashboard');
  };

  useEffect(() => {
    if (hasHandledAutoDownload) return;

    if (searchParams.get('autoDownload') !== '1') {
      setHasHandledAutoDownload(true);
      return;
    }

    setHasHandledAutoDownload(true);
    toast.success('Preparing PDF export...');

    const timer = window.setTimeout(() => {
      handleDownload();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [handleDownload, hasHandledAutoDownload, searchParams]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const saveResume = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!user) {
        if (!silent) toast.error('Login required.');
        return;
      }

      if (silent) {
        setIsAutosaving(true);
      } else {
        setIsSaving(true);
      }

      try {
        const payload = {
          user_id: user.id,
          title: title.trim() || 'Untitled Resume',
          template_id: templateId,
          content: resumeData,
          updated_at: new Date().toISOString(),
        };

        if (isNew) {
          const { data, error } = await supabase
            .from('resumes')
            .insert([payload])
            .select()
            .single();

          if (error) throw error;

          const createdResume = normalizeResumeRecord(data);
          if (!createdResume) throw new Error('Failed to parse created resume.');

          setSavedSnapshot(
            serializeDraft(payload.title, payload.template_id, payload.content),
          );
          setLastSavedAt(createdResume.updated_at || payload.updated_at);
          setIsDirty(false);
          if (!silent) toast.success('Resume created successfully!');
          navigate(`/builder/${createdResume.id}?template=${createdResume.template_id}`, {
            replace: true,
          });
          return;
        }

        const { error } = await supabase
          .from('resumes')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setSavedSnapshot(serializeDraft(payload.title, payload.template_id, payload.content));
        setLastSavedAt(payload.updated_at);
        setIsDirty(false);
        if (!silent) toast.success('Resume saved successfully!');
      } catch (error: unknown) {
        toast.error(
          silent
            ? getErrorMessage(error, 'Autosave failed. Please save manually.')
            : getErrorMessage(error, 'Failed to save resume.'),
        );
      } finally {
        if (silent) {
          setIsAutosaving(false);
        } else {
          setIsSaving(false);
        }
      }
    },
    [id, isNew, navigate, resumeData, templateId, title, user],
  );

  useEffect(() => {
    if (isNew || !user || !isDirty || isSaving || isAutosaving) return;

    const timer = window.setTimeout(() => {
      void saveResume({ silent: true });
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isAutosaving, isDirty, isNew, isSaving, saveResume, user]);

  return {
    isNew,
    isSaving,
    isAutosaving,
    isDirty,
    saveStatusLabel,
    saveResume,
    handleBackToDashboard,
    handleDownload,
  };
};
