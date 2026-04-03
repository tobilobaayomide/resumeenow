import type { ChangeEvent, ComponentType, ReactNode } from 'react';
import type { TemplatePickerItem } from '../../domain/templates';
import type { AiFlowFeature } from '../../domain/workflows';
import type { ProFeature, PlanStatus, PlanTier } from '../context';
import type { ResumeRecord, TemplateId } from '../resume';

export interface ProActionCard {
  feature: AiFlowFeature;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface ResumeCardPreviewProps {
  resume: ResumeRecord;
}

export interface TemplateModalPreviewProps {
  templateId: TemplateId;
  mode?: 'modal' | 'card';
}

export interface DashboardViewProps {
  resumes: ResumeRecord[];
  isLoading: boolean;
  resumeError: string | null;
  onCreateResume: (templateId: TemplateId) => void;
  onDeleteResume: (id: string) => void;
  onRetryResumes: () => void;
  onUploadResume: (file: File, templateId: TemplateId) => Promise<void> | void;
  username?: string;
}

export interface DashboardResumeStatus {
  label: 'Exported' | 'Tailored' | 'Draft';
  tone: string;
}

export interface DashboardHeaderProps {
  dateLabel: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onNotificationsClick: () => void;
  onNotificationsDismiss: () => void;
  onSettingsClick: () => void;
  unreadNotificationsCount: number;
  notificationsPanel?: ReactNode;
  username?: string;
}

export interface DashboardNotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  isUnread: boolean;
}

export interface DashboardNotificationsPanelProps {
  items: DashboardNotificationItem[];
  loading: boolean;
}

export interface UseDashboardNotificationsResult {
  isOpen: boolean;
  loading: boolean;
  items: DashboardNotificationItem[];
  unreadCount: number;
  toggleNotifications: () => void;
  closeNotifications: () => void;
}

export interface WorkspaceSnapshotProps {
  greeting: string;
  username?: string;
  documentCountLabel: string;
  tier: PlanTier;
  planStatus: PlanStatus;
  usedCredits: number;
  dailyCreditLimit: number;
  resumeCount: number;
  isPro: boolean;
  isProWaitlistJoined: boolean;
  hasLatestResume: boolean;
  onUpgrade: () => void;
  onRetryPlan: () => void;
  onOpenTemplatePicker: () => void;
  onExportLatest: () => void;
  onUploadSelection: (event: ChangeEvent<HTMLInputElement>) => void;
}

export interface AiWorkspaceSectionProps {
  isPro: boolean;
  planStatus: PlanStatus;
  onUnlockPro: () => void;
  onProAction: (feature: ProFeature, label: string) => void;
}

export interface AiWorkflowModalProps {
  open: boolean;
  activeAiFlow: AiFlowFeature | null;
  latestResumeAvailable: boolean;
  onClose: () => void;
  onUseLatestResume: () => void;
  onCreateNewResume: () => void;
}

export interface TemplatePickerModalProps {
  open: boolean;
  pendingUploadFile: File | null;
  templates: TemplatePickerItem[];
  onClose: () => void;
  onSelectTemplate: (templateId: TemplateId) => void;
}

export interface ResumeGridSectionProps {
  isLoading: boolean;
  resumeError: string | null;
  resumes: ResumeRecord[];
  filteredResumes: ResumeRecord[];
  searchQuery: string;
  getResumeStatus: (resume: ResumeRecord) => DashboardResumeStatus;
  onClearSearch: () => void;
  onOpenTemplatePicker: () => void;
  onUploadSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenResume: (resume: ResumeRecord) => void;
  onDeleteResume: (id: string) => void;
  onDuplicateResume: (resume: ResumeRecord) => void;
  onRetryResumes: () => void;
}

export interface OnboardingPanelProps {
  resumeCount: number;
  hasExportedPdf: boolean;
}

export interface UseDashboardExportStatusResult {
  hasExportedPdf: boolean;
  lastExportResumeId: string | null;
}

export interface UseDashboardResumeSearchResult {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredResumes: ResumeRecord[];
  latestResume: ResumeRecord | null;
}

export interface DashboardNavigateFn {
  (to: string, options?: { state?: unknown }): void;
}

export interface UseDashboardActionsArgs {
  latestResume: ResumeRecord | null;
  onCreateResume: (templateId: TemplateId) => void;
  onUploadResume: (file: File, templateId: TemplateId) => Promise<void> | void;
  requestAccess: (feature: ProFeature) => boolean;
  navigateTo: DashboardNavigateFn;
}

export interface UseDashboardActionsResult {
  showTemplateModal: boolean;
  pendingUploadFile: File | null;
  activeAiFlow: AiFlowFeature | null;
  pendingAiForNewResume: AiFlowFeature | null;
  openTemplatePickerForCreate: () => void;
  closeTemplatePicker: () => void;
  closeAiWorkflow: () => void;
  handleUploadSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  handleProAction: (feature: ProFeature, label: string) => void;
  handleExportLatest: () => void;
  handleOpenResume: (resume: ResumeRecord) => void;
  handleDuplicateResume: (resume: ResumeRecord) => void;
  handleUseLatestResumeForAi: () => void;
  handleCreateNewResumeForAi: () => void;
  handleTemplateSelect: (templateId: TemplateId) => void;
}
