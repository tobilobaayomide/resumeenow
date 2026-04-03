import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_PICKER_ITEMS } from '../../domain/templates';
import { usePlan } from '../../context/usePlan';
import {
  useDashboardActions,
  useDashboardExportStatus,
  useDashboardNotifications,
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
  DashboardNotificationsPanel,
  OnboardingPanel,
  ResumeGridSection,
  TemplatePickerModal,
  WorkspaceSnapshot,
} from './view';

const DashboardView: React.FC<DashboardViewProps> = ({
  resumes,
  isLoading,
  resumeError,
  onCreateResume,
  onDeleteResume,
  onRetryResumes,
  onUploadResume,
  username,
}) => {
  const navigate = useNavigate();
  const {
    tier,
    planStatus,
    isPro,
    isProWaitlistJoined,
    dailyCreditLimit,
    usedCredits,
    requestAccess,
    openUpgrade,
    retryPlan,
  } = usePlan();

  const { searchQuery, setSearchQuery, filteredResumes, latestResume } = useDashboardResumeSearch(resumes);
  const { hasExportedPdf, lastExportResumeId } = useDashboardExportStatus();
  const {
    isOpen: notificationsOpen,
    loading: notificationsLoading,
    items: notificationItems,
    unreadCount,
    toggleNotifications,
    closeNotifications,
  } = useDashboardNotifications();

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
  const documentCountLabel = isLoading ? '...' : resumeError ? '—' : String(resumes.length);

  const handleSettingsClick = () => {
    closeNotifications();
    navigate('/dashboard/settings');
  };

  const getResumeStatus = (resume: ResumeRecord) =>
    getDashboardResumeStatus(resume, lastExportResumeId);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        <DashboardHeader
          dateLabel={dateLabel}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onNotificationsClick={toggleNotifications}
          onNotificationsDismiss={closeNotifications}
          onSettingsClick={handleSettingsClick}
          unreadNotificationsCount={unreadCount}
          notificationsPanel={
            notificationsOpen ? (
              <DashboardNotificationsPanel
                items={notificationItems}
                loading={notificationsLoading}
              />
            ) : undefined
          }
          username={username}
        />

        <main className="flex-1 px-4 md:px-8 lg:px-12 pb-24 md:pb-12 overflow-y-auto">
          <div className="w-full mx-auto pt-3 md:pt-4">
            <WorkspaceSnapshot
              greeting={greeting}
              username={username}
              documentCountLabel={documentCountLabel}
              tier={tier}
              planStatus={planStatus}
              usedCredits={usedCredits}
              dailyCreditLimit={dailyCreditLimit}
              resumeCount={resumes.length}
              isPro={isPro}
              isProWaitlistJoined={isProWaitlistJoined}
              hasLatestResume={Boolean(latestResume)}
              onUpgrade={() => openUpgrade()}
              onRetryPlan={() => {
                void retryPlan();
              }}
              onOpenTemplatePicker={openTemplatePickerForCreate}
              onExportLatest={handleExportLatest}
              onUploadSelection={handleUploadSelection}
            />

            <AiWorkspaceSection
              isPro={isPro}
              planStatus={planStatus}
              onUnlockPro={() => openUpgrade()}
              onProAction={handleProAction}
            />

            <div className="grid grid-cols-12 gap-8 lg:gap-12">
              <div className="col-span-12 lg:col-span-8">
                <ResumeGridSection
                  isLoading={isLoading}
                  resumeError={resumeError}
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
                  onRetryResumes={onRetryResumes}
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
