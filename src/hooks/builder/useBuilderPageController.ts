import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { usePlan } from '../../context/usePlan';
import type { BuilderPageMobileView, UseBuilderPageControllerResult } from '../../types/builder';
import { INITIAL_RESUME_DATA, normalizeTemplateId, type ResumeData, type TemplateId } from '../../types/resume';
import { useBuilderAiFlows } from './useBuilderAiFlows';
import { useBuilderDraftMutations } from './useBuilderDraftMutations';
import { useBuilderPersistence } from './useBuilderPersistence';
import { useBuilderProfileImport } from './useBuilderProfileImport';

interface BuilderLocationState {
  importedResumeData?: unknown;
  importedTitle?: string;
}

export const useBuilderPageController = (): UseBuilderPageControllerResult => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro, requestAccess, openUpgrade } = usePlan();

  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [templateId, setTemplateId] = useState<TemplateId>(
    normalizeTemplateId(searchParams.get('template')),
  );
  const [title, setTitle] = useState(searchParams.get('title') || 'Untitled Resume');
  const [zoom, setZoom] = useState(1);
  const [mobileView, setMobileView] = useState<BuilderPageMobileView>('editor');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  const locationState = location.state as BuilderLocationState | null;

  const {
    isSaving,
    isAutosaving,
    saveStatusLabel,
    saveResume,
    handleBackToDashboard,
    handleDownload,
  } = useBuilderPersistence({
    id,
    searchParams,
    locationState,
    user,
    navigate,
    title,
    templateId,
    resumeData,
    setResumeData,
    setTemplateId,
    setTitle,
  });

  const { handleProAction, aiModalProps } = useBuilderAiFlows({
    searchParams,
    requestAccess,
    resumeData,
    setResumeData,
  });

  const { isImporting, handleImportProfile } = useBuilderProfileImport({
    user,
    setResumeData,
    setMobileView,
  });
  const draftMutations = useBuilderDraftMutations({ setResumeData });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        const targetZoom = window.innerWidth / 794;
        setZoom(Math.min(Math.max(targetZoom, 0.2), 1));
      } else {
        setZoom(0.9);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    headerProps: {
      title,
      saveStatusLabel,
      templateId,
      mobileView,
      isEditorCollapsed,
      isPro,
      isImporting,
      isSaving,
      isAutosaving,
      onBackToDashboard: handleBackToDashboard,
      onTitleChange: setTitle,
      onTemplateChange: setTemplateId,
      onMobileViewChange: setMobileView,
      onProAction: handleProAction,
      onToggleEditorCollapse: () => setIsEditorCollapsed((prev) => !prev),
      onUpgrade: openUpgrade,
      onImportProfile: handleImportProfile,
      onDownload: handleDownload,
      onSave: () => {
        void saveResume();
      },
    },
    workspaceProps: {
      mobileView,
      isEditorCollapsed,
      resumeData,
      templateId,
      zoom,
      onZoomOut: () => setZoom((value) => Math.max(0.2, value - 0.1)),
      onZoomIn: () => setZoom((value) => Math.min(2, value + 0.1)),
      ...draftMutations,
    },
    aiModalProps,
  };
};
