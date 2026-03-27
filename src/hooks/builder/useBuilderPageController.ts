import { useEffect, useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { usePlan } from '../../context/usePlan';
import { reportRuntimeValidationIssue } from '../../lib/observability/runtimeValidation';
import { parseBuilderLocationState } from '../../schemas/builder/locationState';
import type { BuilderPageMobileView, UseBuilderPageControllerResult } from '../../types/builder';
import type { TemplateId } from '../../types/resume';
import { useBuilderAiFlows } from './useBuilderAiFlows';
import { useBuilderPersistence } from './useBuilderPersistence';
import { useBuilderProfileImport } from './useBuilderProfileImport';
import { useBuilderStore } from '../../store/builderStore';

export const useBuilderPageController = (): UseBuilderPageControllerResult => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro, dailyCreditLimit, planStatus, usedCredits } = usePlan();

  const templateId = useBuilderStore((store) => store.templateId);
  const title = useBuilderStore((store) => store.title);
  const setResumeData = useBuilderStore((store) => store.setResumeData);
  const setTemplateId = useBuilderStore((store) => store.setTemplateId);
  const setTitle = useBuilderStore((store) => store.setTitle);

  const setTemplateIdDispatch: Dispatch<SetStateAction<TemplateId>> = useMemo(
    () => (value) => {
      setTemplateId(value);
    },
    [setTemplateId],
  );

  const setTitleDispatch: Dispatch<SetStateAction<string>> = useMemo(
    () => (value) => {
      setTitle(value);
    },
    [setTitle],
  );
  const [zoom, setZoom] = useState(1);
  const [mobileView, setMobileView] = useState<BuilderPageMobileView>('editor');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  const locationState = useMemo(
    () => parseBuilderLocationState(location.state),
    [location.state],
  );

  useEffect(() => {
    if (
      location.state === undefined ||
      location.state === null ||
      locationState !== null
    ) {
      return;
    }

    reportRuntimeValidationIssue({
      key: `builder.location.invalid-state:${location.pathname}`,
      source: 'builder.location',
      action: 'Ignored invalid builder route state.',
      details: {
        pathname: location.pathname,
      },
    });
  }, [location.pathname, location.state, locationState]);

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

  const headerProps = useMemo(() => ({
    title,
    saveStatusLabel,
    templateId,
    mobileView,
    isEditorCollapsed,
    isPro,
    planStatus,
    isImporting,
    isSaving,
    isAutosaving,
    dailyCreditLimit,
    usedCredits,
    onBackToDashboard: handleBackToDashboard,
    onTitleChange: setTitleDispatch,
    onTemplateChange: setTemplateIdDispatch,
    onMobileViewChange: setMobileView,
    onProAction: handleProAction,
    onToggleEditorCollapse: () => setIsEditorCollapsed((prev) => !prev),
    onImportProfile: handleImportProfile,
    onDownload: handleDownload,
    onSave: () => {
      void saveResume();
    },
  }), [
    title,
    saveStatusLabel,
    templateId,
    mobileView,
    isEditorCollapsed,
    isPro,
    planStatus,
    isImporting,
    isSaving,
    isAutosaving,
    dailyCreditLimit,
    usedCredits,
    handleBackToDashboard,
    setTitleDispatch,
    setTemplateIdDispatch,
    setMobileView,
    handleProAction,
    handleImportProfile,
    handleDownload,
    saveResume
  ]);

  const workspaceProps = useMemo(() => ({
    mobileView,
    isEditorCollapsed,
    zoom,
    onZoomOut: () => setZoom((value) => Math.max(0.2, value - 0.1)),
    onZoomIn: () => setZoom((value) => Math.min(2, value + 0.1)),
  }), [mobileView, isEditorCollapsed, zoom]);

  return {
    headerProps,
    workspaceProps,
    aiModalProps,
  };
};
