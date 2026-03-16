import type { User } from '@supabase/supabase-js';
import { CAREER_PROFILE_COMPLETION_ITEMS, EMPTY_CAREER_PROFILE } from '../../data/dashboard';
import type { CareerProfileCompletionStatus, CareerProfileState } from '../../types/dashboard';
import {
  normalizeEducationList,
  normalizeExperienceList,
  type ResumeEducationItem,
  type ResumeExperienceItem,
} from '../../types/resume';

type CareerProfileRecord = Partial<CareerProfileState> & {
  experience?: unknown;
  education?: unknown;
  skills?: unknown;
};

export const createEmptyExperienceItem = (): ResumeExperienceItem => ({
  id: '',
  role: '',
  company: '',
  startDate: '',
  endDate: '',
  description: '',
});

export const createEmptyEducationItem = (): ResumeEducationItem => ({
  id: '',
  school: '',
  degree: '',
  startDate: '',
  endDate: '',
  description: '',
});

export const getHydratedCareerProfile = (
  data: CareerProfileRecord,
  user: User,
): CareerProfileState => ({
  ...EMPTY_CAREER_PROFILE,
  ...data,
  full_name: data.full_name || '',
  headline: data.headline || '',
  location: data.location || '',
  phone: data.phone || '',
  website: data.website || '',
  bio: data.bio || '',
  email: user.email || '',
  experience: normalizeExperienceList(data.experience),
  education: normalizeEducationList(data.education),
  skills: Array.isArray(data.skills)
    ? data.skills.filter((skill: unknown): skill is string => typeof skill === 'string')
    : [],
});

export const getFallbackCareerProfile = (user: User): CareerProfileState => ({
  ...EMPTY_CAREER_PROFILE,
  full_name: user.user_metadata?.full_name || '',
  email: user.email || '',
});

const isCompletionItemDone = (
  key: (typeof CAREER_PROFILE_COMPLETION_ITEMS)[number]['key'],
  profile: CareerProfileState,
): boolean => {
  switch (key) {
    case 'full_name':
      return Boolean(profile.full_name?.trim());
    case 'headline':
      return Boolean(profile.headline?.trim());
    case 'location':
      return Boolean(profile.location?.trim());
    case 'phone':
      return Boolean(profile.phone?.trim());
    case 'website':
      return Boolean(profile.website?.trim());
    case 'bio':
      return Boolean(profile.bio?.trim());
    case 'experience':
      return profile.experience.length > 0;
    case 'education':
      return profile.education.length > 0;
    case 'skills':
      return profile.skills.length >= 3;
    default:
      return false;
  }
};

export const getCareerProfileCompletionItems = (
  profile: CareerProfileState,
): CareerProfileCompletionStatus[] =>
  CAREER_PROFILE_COMPLETION_ITEMS.map((item) => ({
    label: item.label,
    done: isCompletionItemDone(item.key, profile),
  }));
