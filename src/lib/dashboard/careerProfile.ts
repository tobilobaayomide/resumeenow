import type { User } from '@supabase/supabase-js';
import { CAREER_PROFILE_COMPLETION_ITEMS, EMPTY_CAREER_PROFILE } from '../../data/dashboard/careerProfile.js';
import { reportRuntimeValidationIssue } from '../observability/runtimeValidation.js';
import { safeParseCareerProfileState } from '../../schemas/integrations/profile.js';
import type { CareerProfileCompletionStatus, CareerProfileState } from '../../types/dashboard/careerProfile.js';
import { type ResumeEducationItem, type ResumeExperienceItem } from '../../types/resume.js';

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
  data: unknown,
  user: User,
): CareerProfileState => {
  const parsedProfile = safeParseCareerProfileState(data, user.email ?? '');

  if (parsedProfile.success) {
    return parsedProfile.data;
  }

  reportRuntimeValidationIssue({
    key: `career-profile.hydrate.invalid:${user.id}`,
    source: 'career-profile.hydrate',
    action: 'Fell back to an empty career profile after invalid persisted profile data.',
    details: {
      userId: user.id,
    },
  });

  return {
    ...EMPTY_CAREER_PROFILE,
    email: user.email ?? '',
  };
};

export const getFallbackCareerProfile = (user: User): CareerProfileState => ({
  ...EMPTY_CAREER_PROFILE,
  full_name: user.user_metadata?.full_name ?? '',
  email: user.email ?? '',
});

const areExperienceItemsEqual = (
  left: ResumeExperienceItem,
  right: ResumeExperienceItem,
): boolean =>
  left.id === right.id &&
  left.role === right.role &&
  left.company === right.company &&
  left.startDate === right.startDate &&
  left.endDate === right.endDate &&
  left.description === right.description;

const areEducationItemsEqual = (
  left: ResumeEducationItem,
  right: ResumeEducationItem,
): boolean =>
  left.id === right.id &&
  left.school === right.school &&
  left.degree === right.degree &&
  left.startDate === right.startDate &&
  left.endDate === right.endDate &&
  left.description === right.description;

const areStringArraysEqual = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const areExperienceArraysEqual = (
  left: ResumeExperienceItem[],
  right: ResumeExperienceItem[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => areExperienceItemsEqual(value, right[index] as ResumeExperienceItem));

const areEducationArraysEqual = (
  left: ResumeEducationItem[],
  right: ResumeEducationItem[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => areEducationItemsEqual(value, right[index] as ResumeEducationItem));

export const areCareerProfilesEqual = (
  left: CareerProfileState,
  right: CareerProfileState,
): boolean =>
  left.full_name === right.full_name &&
  left.headline === right.headline &&
  left.location === right.location &&
  left.email === right.email &&
  left.phone === right.phone &&
  left.website === right.website &&
  left.bio === right.bio &&
  areExperienceArraysEqual(left.experience, right.experience) &&
  areEducationArraysEqual(left.education, right.education) &&
  areStringArraysEqual(left.skills, right.skills);

const isCompletionItemDone = (
  key: (typeof CAREER_PROFILE_COMPLETION_ITEMS)[number]['key'],
  profile: CareerProfileState,
): boolean => {
  switch (key) {
    case 'full_name':
      return Boolean(profile.full_name != null && profile.full_name.trim());
    case 'headline':
      return Boolean(profile.headline != null && profile.headline.trim());
    case 'location':
      return Boolean(profile.location != null && profile.location.trim());
    case 'phone':
      return Boolean(profile.phone != null && profile.phone.trim());
    case 'website':
      return Boolean(profile.website != null && profile.website.trim());
    case 'bio':
      return Boolean(profile.bio != null && profile.bio.trim());
    case 'experience':
      return Array.isArray(profile.experience) && profile.experience.length > 0;
    case 'education':
      return Array.isArray(profile.education) && profile.education.length > 0;
    case 'skills':
      return Array.isArray(profile.skills) && profile.skills.length >= 3;
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
