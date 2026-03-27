import type { User } from '@supabase/supabase-js';
import type { ResumeEducationItem, ResumeExperienceItem } from '../resume.js';
import type { KeyboardEvent } from 'react';

export interface CareerProfileState {
  full_name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  bio: string;
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  skills: string[];
}

export type CareerProfileCompletionKey =
  | 'full_name'
  | 'headline'
  | 'location'
  | 'phone'
  | 'website'
  | 'bio'
  | 'experience'
  | 'education'
  | 'skills';

export interface CareerProfileCompletionItem {
  key: CareerProfileCompletionKey;
  label: string;
}

export interface CareerProfileCompletionStatus {
  label: string;
  done: boolean;
}

export interface CareerProfileHeroProps {
  isEditing: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  fullName: string;
  headline: string;
  onStartEditing: () => void;
  onDiscard: () => void;
  onSave: () => void;
  onFullNameChange: (value: string) => void;
  onHeadlineChange: (value: string) => void;
}

export interface CareerProfileSidebarProps {
  isEditing: boolean;
  email: string;
  profile: CareerProfileState;
  completionPercent: number;
  missingItems: CareerProfileCompletionStatus[];
  newSkill: string;
  sectionCardClasses: string;
  cardTopAccent: string;
  onChangeField: <K extends keyof CareerProfileState>(field: K, value: CareerProfileState[K]) => void;
  onNewSkillChange: (value: string) => void;
  onAddSkill: (event: KeyboardEvent<HTMLInputElement>) => void;
  onDeleteSkill: (skill: string) => void;
}

export interface CareerProfileMainContentProps {
  isEditing: boolean;
  profile: CareerProfileState;
  sectionCardClasses: string;
  cardTopAccent: string;
  onChangeField: <K extends keyof CareerProfileState>(field: K, value: CareerProfileState[K]) => void;
  onOpenExperienceModal: () => void;
  onOpenEducationModal: () => void;
  onDeleteExperience: (id: string) => void;
  onDeleteEducation: (id: string) => void;
}

export interface CareerProfileMobileActionsProps {
  saving: boolean;
  hasUnsavedChanges: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export interface CareerProfileExperienceModalProps {
  open: boolean;
  value: ResumeExperienceItem;
  onClose: () => void;
  onChange: (value: ResumeExperienceItem) => void;
  onAdd: () => void;
}

export interface CareerProfileEducationModalProps {
  open: boolean;
  value: ResumeEducationItem;
  onClose: () => void;
  onChange: (value: ResumeEducationItem) => void;
  onAdd: () => void;
}

export interface UseCareerProfileControllerArgs {
  user: User | null;
}

export interface UseCareerProfileControllerResult {
  loading: boolean;
  saving: boolean;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  profile: CareerProfileState;
  newExp: ResumeExperienceItem;
  newEdu: ResumeEducationItem;
  newSkill: string;
  activeModal: 'experience' | 'education' | null;
  completionPercent: number;
  missingItems: CareerProfileCompletionStatus[];
  setNewExp: (value: ResumeExperienceItem) => void;
  setNewEdu: (value: ResumeEducationItem) => void;
  setNewSkill: (value: string) => void;
  startEditing: () => void;
  discardChanges: () => void;
  saveProfile: () => void;
  changeField: <K extends keyof CareerProfileState>(field: K, value: CareerProfileState[K]) => void;
  openExperienceModal: () => void;
  openEducationModal: () => void;
  closeModal: () => void;
  addExperience: () => void;
  deleteExperience: (id: string) => void;
  addEducation: () => void;
  deleteEducation: (id: string) => void;
  addSkill: (event: KeyboardEvent<HTMLInputElement>) => void;
  deleteSkill: (skill: string) => void;
}
