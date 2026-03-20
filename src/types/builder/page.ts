import type {
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLinkItem,
  ResumePersonalInfo,
  ResumeProjectItem,
  TemplateId,
} from '../resume';
import type { AiFlowFeature } from '../../domain/workflows';
import type { ProFeature } from '../context';

export type BuilderPageMobileView = 'editor' | 'preview';

export type CoverLetterTone = 'professional' | 'confident' | 'friendly';

export type BuilderPagePersonalInfoField = Exclude<keyof ResumePersonalInfo, 'links'>;

export interface AtsAuditBreakdownItem {
  label: string;
  score: number;
  max: number;
}

export interface AtsAuditImprovement {
  id?: string;
  type: 'bullet' | 'skill';
  current: string;
  better: string;
}

export interface AtsAuditResult {
  score: number;
  keywordCoverage: number;
  matchedCount: number;
  keywordCount: number;
  quantifiedBulletCount: number;
  breakdown: AtsAuditBreakdownItem[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  weakBullets?: { id: string; originalText: string; suggestion: string }[];
  keywordDensity?: { keyword: string; count: number; importance: number }[];
  improvements?: AtsAuditImprovement[];
  criticalMistake?: { title: string; description: string; fix: string };
}

export interface BuilderDraftPayload {
  title: string;
  template_id: string;
  content: ResumeData;
}

export interface BuilderHeaderProps {
  title: string;
  saveStatusLabel: string;
  templateId: TemplateId;
  mobileView: BuilderPageMobileView;
  isEditorCollapsed: boolean;
  isPro: boolean;
  isImporting: boolean;
  isSaving: boolean;
  isAutosaving: boolean;
  monthlyCredits: number;
  usedCredits: number;
  onBackToDashboard: () => void;
  onTitleChange: (value: string) => void;
  onTemplateChange: (templateId: TemplateId) => void;
  onMobileViewChange: (view: BuilderPageMobileView) => void;
  onProAction: (feature: ProFeature, label: string) => void;
  onToggleEditorCollapse: () => void;
  onUpgrade: () => void;
  onImportProfile: () => void;
  onDownload: () => void;
  onSave: () => void;
}

export interface BuilderWorkspaceProps {
  mobileView: BuilderPageMobileView;
  isEditorCollapsed: boolean;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
}

export interface UseBuilderDraftMutationsResult {
  onPersonalInfoChange: (field: BuilderPagePersonalInfoField, value: string) => void;
  onLinksChange: (links: ResumeLinkItem[]) => void;
  onSummaryChange: (summary: string) => void;
  onExperienceChange: (experience: ResumeExperienceItem[]) => void;
  onEducationChange: (education: ResumeEducationItem[]) => void;
  onVolunteeringChange: (volunteering: ResumeExperienceItem[]) => void;
  onProjectsChange: (projects: ResumeProjectItem[]) => void;
  onCertificationsChange: (certifications: string[]) => void;
  onSkillsChange: (skills: ResumeData['skills']) => void;
  onLanguagesChange: (languages: string[]) => void;
  onAchievementsChange: (achievements: string[]) => void;
}

export interface BuilderAiWorkflowModalProps {
  isGenerating: boolean;
  activeAiFlow: AiFlowFeature | null;
  tailorRole: string;
  tailorCompany: string;
  tailorJobDescription: string;
  atsRole: string;
  atsJobDescription: string;
  atsResult: AtsAuditResult | null;
  coverRole: string;
  coverCompany: string;
  coverHiringManager: string;
  coverTone: CoverLetterTone;
  coverLetterDraft: string;
  onClose: () => void;
  onTailorRoleChange: (value: string) => void;
  onTailorCompanyChange: (value: string) => void;
  onTailorJobDescriptionChange: (value: string) => void;
  onAtsRoleChange: (value: string) => void;
  onAtsJobDescriptionChange: (value: string) => void;
  onCoverRoleChange: (value: string) => void;
  onCoverCompanyChange: (value: string) => void;
  onCoverHiringManagerChange: (value: string) => void;
  onCoverToneChange: (value: CoverLetterTone) => void;
  onApplyTailor: () => void;
  onConfirmTailor: () => void;
  onDiscardTailor: () => void;
  onApplyTailorFix: (type: 'summary' | 'skills' | 'experience' | 'addition' | 'contact', id?: string, current?: string) => void;
  tailorPreview: {
    jobTitleAfter: string;
    summary?: { current: string; better: string };
    skills?: { current: string; better: string };
    experienceImprovements: { id: string; current: string; better: string }[];
    experienceAdditions: { id: string; better: string }[];
    contactFix?: { current: string; better: string };
    keywordAlignment: { matched: string[]; injected: string[]; stillMissing: string[] };
  } | null;
  onRunAtsAudit: () => void;
  onApplyAtsKeywordHints: () => void;
  onApplyAtsImprovements: () => void;
  onApplyAtsImprovement: (improvement: AtsAuditImprovement) => void;
  onGenerateCoverLetter: () => void;
  onCopyCoverLetter: () => void;
}

export interface UseBuilderPageControllerResult {
  headerProps: BuilderHeaderProps;
  workspaceProps: BuilderWorkspaceProps;
  aiModalProps: BuilderAiWorkflowModalProps;
}
