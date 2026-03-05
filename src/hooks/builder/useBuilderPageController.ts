import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { usePlan } from '../../context/usePlan';
import type { BuilderPageMobileView, UseBuilderPageControllerResult } from '../../types/builder';
import type { TemplateId } from '../../types/resume';
import { useBuilderAiFlows } from './useBuilderAiFlows';
import { useBuilderPersistence } from './useBuilderPersistence';
import { useBuilderProfileImport } from './useBuilderProfileImport';
import { useBuilderStore } from '../../store/builderStore';

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
  const { isPro, openUpgrade } = usePlan();

  const templateId = useBuilderStore((store) => store.templateId);
  const title = useBuilderStore((store) => store.title);
  const setResumeData = useBuilderStore((store) => store.setResumeData);
  const setTemplateId = useBuilderStore((store) => store.setTemplateId);
  const setTitle = useBuilderStore((store) => store.setTitle);

  const setTemplateIdDispatch: Dispatch<SetStateAction<TemplateId>> = (value) => {
    const next =
      typeof value === 'function' ? (value as (prev: TemplateId) => TemplateId)(templateId) : value;
    setTemplateId(next);
  };

  const setTitleDispatch: Dispatch<SetStateAction<string>> = (value) => {
    const next = typeof value === 'function' ? (value as (prev: string) => string)(title) : value;
    setTitle(next);
  };
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
  });

  const { handleProAction, aiModalProps } = useBuilderAiFlows();

  const { isImporting, handleImportProfile } = useBuilderProfileImport({
    user,
    setResumeData,
    setMobileView,
  });
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
      onTitleChange: setTitleDispatch,
      onTemplateChange: setTemplateIdDispatch,
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
      zoom,
      onZoomOut: () => setZoom((value) => Math.max(0.2, value - 0.1)),
      onZoomIn: () => setZoom((value) => Math.min(2, value + 0.1)),
    },
    aiModalProps,
  };
};
