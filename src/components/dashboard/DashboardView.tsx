import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TEMPLATE_PICKER_ITEMS } from '../../domain/templates';
import { usePlan } from '../../context/usePlan';
import {
  useDashboardActions,
  useDashboardExportStatus,
  useDashboardResumeSearch,
} from '../../hooks/dashboard';
import {
  getDashboardDateLabel,
  getDashboardGreeting,
  getDashboardResumeStatus,
} from '../../lib/dashboard/view';
import type { DashboardNavigateFn, DashboardViewProps } from '../../types/dashboard';
import type { ResumeRecord } from '../../types/resume';
import Sidebar from './Sidebar';
import {
  AiWorkflowModal,
  AiWorkspaceSection,
  DashboardHeader,
  OnboardingPanel,
  ResumeGridSection,
  TemplatePickerModal,
  WorkspaceSnapshot,
} from './view';

const DashboardView: React.FC<DashboardViewProps> = ({
  resumes,
  isLoading,
  onCreateResume,
  onDeleteResume,
  onUploadResume,
  username,
}) => {
  const navigate = useNavigate();
  const { tier, isPro, monthlyCredits, usedCredits, requestAccess, openUpgrade } = usePlan();

  const { searchQuery, setSearchQuery, filteredResumes, latestResume } = useDashboardResumeSearch(resumes);
  const { hasExportedPdf, lastExportResumeId } = useDashboardExportStatus();

  const navigateTo: DashboardNavigateFn = (to, options) => {
    navigate(to, options ? { state: options.state } : undefined);
  };

  const {
    showTemplateModal,
    pendingUploadFile,
    activeAiFlow,
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
  } = useDashboardActions({
    latestResume,
    onCreateResume,
    onUploadResume,
    requestAccess,
    navigateTo,
  });

  const greeting = getDashboardGreeting();
  const dateLabel = getDashboardDateLabel();
  const documentCountLabel = isLoading ? '...' : String(resumes.length);

  const handleNotificationsClick = () => {
    toast.info('Notifications center is coming soon.');
  };

  const handleSettingsClick = () => {
    navigate('/dashboard/settings');
  };

  const getResumeStatus = (resume: ResumeRecord) =>
    getDashboardResumeStatus(resume, lastExportResumeId);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        <DashboardHeader
          dateLabel={dateLabel}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onNotificationsClick={handleNotificationsClick}
          onSettingsClick={handleSettingsClick}
          username={username}
        />

        <main className="flex-1 px-4 md:px-8 lg:px-12 pb-24 md:pb-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto pt-3 md:pt-4">
            <WorkspaceSnapshot
              greeting={greeting}
              username={username}
              documentCountLabel={documentCountLabel}
              tier={tier}
              usedCredits={usedCredits}
              monthlyCredits={monthlyCredits}
              resumeCount={resumes.length}
              isPro={isPro}
              hasLatestResume={Boolean(latestResume)}
              onUpgrade={() => openUpgrade()}
              onOpenTemplatePicker={openTemplatePickerForCreate}
              onExportLatest={handleExportLatest}
              onUploadSelection={handleUploadSelection}
            />

            <AiWorkspaceSection
              isPro={isPro}
              onUnlockPro={() => openUpgrade()}
              onProAction={handleProAction}
            />

            <div className="grid grid-cols-12 gap-8 lg:gap-12">
              <div className="col-span-12 lg:col-span-8">
                <ResumeGridSection
                  isLoading={isLoading}
                  resumes={resumes}
                  filteredResumes={filteredResumes}
                  searchQuery={searchQuery}
                  getResumeStatus={getResumeStatus}
                  onClearSearch={() => setSearchQuery('')}
                  onOpenTemplatePicker={openTemplatePickerForCreate}
                  onUploadSelection={handleUploadSelection}
                  onOpenResume={handleOpenResume}
                  onDeleteResume={onDeleteResume}
                  onDuplicateResume={handleDuplicateResume}
                />
              </div>

              <div className="hidden lg:block lg:col-span-4 space-y-8 pl-8 border-l border-gray-100/50">
                <OnboardingPanel resumeCount={resumes.length} hasExportedPdf={hasExportedPdf} />
              </div>
            </div>
          </div>
        </main>

        <AiWorkflowModal
          open={Boolean(activeAiFlow)}
          activeAiFlow={activeAiFlow}
          latestResumeAvailable={Boolean(latestResume)}
          onClose={closeAiWorkflow}
          onUseLatestResume={handleUseLatestResumeForAi}
          onCreateNewResume={handleCreateNewResumeForAi}
        />

        <TemplatePickerModal
          open={showTemplateModal}
          pendingUploadFile={pendingUploadFile}
          templates={TEMPLATE_PICKER_ITEMS}
          onClose={closeTemplatePicker}
          onSelectTemplate={handleTemplateSelect}
        />
      </div>
    </div>
  );
};

export default DashboardView;
