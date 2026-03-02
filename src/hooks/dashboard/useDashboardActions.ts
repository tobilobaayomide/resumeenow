import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { isAiFlowFeature } from '../../domain/workflows';
import type { AiFlowFeature } from '../../domain/workflows';
import type { TemplateId } from '../../types/resume';
import type { UseDashboardActionsArgs, UseDashboardActionsResult } from '../../types/dashboard';

export const useDashboardActions = ({
  latestResume,
  onCreateResume,
  onUploadResume,
  requestAccess,
  navigateTo,
}: UseDashboardActionsArgs): UseDashboardActionsResult => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [activeAiFlow, setActiveAiFlow] = useState<AiFlowFeature | null>(null);
  const [pendingAiForNewResume, setPendingAiForNewResume] = useState<AiFlowFeature | null>(null);

  const openTemplatePickerForCreate = () => {
    setPendingAiForNewResume(null);
    setPendingUploadFile(null);
    setShowTemplateModal(true);
  };

  const closeTemplatePicker = () => {
    setShowTemplateModal(false);
    setPendingUploadFile(null);
    setPendingAiForNewResume(null);
  };

  const closeAiWorkflow = () => {
    setActiveAiFlow(null);
  };

  const handleUploadSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPendingAiForNewResume(null);
    setPendingUploadFile(file);
    setShowTemplateModal(true);
  };

  const handleProAction = (feature: Parameters<typeof requestAccess>[0], label: string) => {
    const allowed = requestAccess(feature);
    if (!allowed) return;

    if (isAiFlowFeature(feature)) {
      setActiveAiFlow(feature);
      return;
    }

    toast.info(`${label} flow will be wired next.`);
  };

  const handleExportLatest = () => {
    if (!latestResume) {
      toast.error('Create a resume first to export a PDF.');
      return;
    }

    navigateTo(
      `/builder/${latestResume.id}?template=${latestResume.template_id || 'executive'}&autoDownload=1`,
    );
  };

  const handleOpenResume = (resume: { id: string; template_id?: string }) => {
    navigateTo(`/builder/${resume.id}?template=${resume.template_id || 'executive'}`);
  };

  const handleDuplicateResume = (resume: {
    title?: string;
    template_id?: string;
    content: unknown;
  }) => {
    const duplicateTitle = `${resume.title || 'Untitled'} (Copy)`;
    navigateTo(
      `/builder/new?template=${resume.template_id || 'executive'}&title=${encodeURIComponent(duplicateTitle)}`,
      {
        state: {
          importedResumeData: resume.content,
          importedTitle: duplicateTitle,
        },
      },
    );
    toast.success('Duplicate opened in builder.');
  };

  const handleUseLatestResumeForAi = () => {
    if (!activeAiFlow) return;
    if (!latestResume) {
      toast.error('Create a resume first to run this workflow.');
      return;
    }

    navigateTo(
      `/builder/${latestResume.id}?template=${latestResume.template_id || 'executive'}&ai=${activeAiFlow}`,
    );
  };

  const handleCreateNewResumeForAi = () => {
    if (!activeAiFlow) return;
    setPendingAiForNewResume(activeAiFlow);
    setActiveAiFlow(null);
    setPendingUploadFile(null);
    setShowTemplateModal(true);
  };

  const handleTemplateSelect = (templateId: TemplateId) => {
    if (pendingUploadFile) {
      void onUploadResume(pendingUploadFile, templateId);
      setPendingUploadFile(null);
      setPendingAiForNewResume(null);
      setShowTemplateModal(false);
      return;
    }

    if (pendingAiForNewResume) {
      navigateTo(`/builder/new?template=${templateId}&ai=${pendingAiForNewResume}`);
      setPendingAiForNewResume(null);
      setShowTemplateModal(false);
      return;
    }

    onCreateResume(templateId);
    setShowTemplateModal(false);
  };

  return {
    showTemplateModal,
    pendingUploadFile,
    activeAiFlow,
    pendingAiForNewResume,
    openTemplatePickerForCreate,
    closeTemplatePicker,
    closeAiWorkflow,
    handleUploadSelection,
    handleProAction,
    handleExportLatest,
    handleOpenResume,
    handleDuplicateResume,
    handleUseLatestResumeForAi,
    handleCreateNewResumeForAi,
    handleTemplateSelect,
  };
};
