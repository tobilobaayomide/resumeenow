import type { ComponentType, ReactElement, ReactNode } from 'react';
import type {
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLinkItem,
  ResumePersonalInfo,
  ResumeProjectItem,
} from '../resume';

export type EditorSectionTabId =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'volunteering'
  | 'projects'
  | 'skills'
  | 'languages'
  | 'achievements'
  | 'certifications';

export type EditorCountField =
  | 'experience'
  | 'education'
  | 'volunteering'
  | 'projects'
  | 'skills'
  | 'languages'
  | 'achievements'
  | 'certifications';

export interface BuilderEditorSectionTab {
  id: EditorSectionTabId;
  label: string;
  icon: ComponentType<{ size?: number }>;
  countField?: EditorCountField;
}

export type BuilderPersonalInfoField = Exclude<keyof ResumePersonalInfo, 'links'>;

export interface EditorPanelProps {
  data: ResumeData;
  onPersonalInfoChange: (field: BuilderPersonalInfoField, value: string) => void;
  onLinksChange: (links: ResumeLinkItem[]) => void;
  onSummaryChange: (summary: string) => void;
  onExperienceChange: (experience: ResumeExperienceItem[]) => void;
  onEducationChange: (education: ResumeEducationItem[]) => void;
  onVolunteeringChange: (volunteering: ResumeExperienceItem[]) => void;
  onProjectsChange: (projects: ResumeProjectItem[]) => void;
  onCertificationsChange: (certifications: string[]) => void;
  onSkillsChange: (skills: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
  onAchievementsChange: (achievements: string[]) => void;
}

export interface EditorInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  name?: string;
  id?: string;
}

export interface EditorTextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  name?: string;
  id?: string;
}

export interface EditorDateRowProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

export interface EditorSectionProps {
  sectionId: string;
  icon: ReactElement<{ size?: number }>;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  count?: number;
}

export interface EditorAddButtonProps {
  label: string;
  onClick: () => void;
}

export interface EditorItemSwitcherItem {
  id: string;
  label: string;
}

export interface EditorItemSwitcherProps {
  title: string;
  items: EditorItemSwitcherItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export interface EditorCardProps {
  label: string;
  index: number;
  onRemove: () => void;
  children: ReactNode;
}
