import type {
  CareerProfileCompletionItem,
  CareerProfileState,
} from '../../types/dashboard';

export const EMPTY_CAREER_PROFILE: CareerProfileState = {
  full_name: '',
  headline: '',
  location: '',
  email: '',
  phone: '',
  website: '',
  bio: '',
  experience: [],
  education: [],
  skills: [],
};

export const CAREER_PROFILE_COMPLETION_ITEMS: CareerProfileCompletionItem[] = [
  { key: 'full_name', label: 'Full name' },
  { key: 'headline', label: 'Professional headline' },
  { key: 'location', label: 'Location' },
  { key: 'phone', label: 'Phone number' },
  { key: 'website', label: 'Website' },
  { key: 'bio', label: 'About summary' },
  { key: 'experience', label: 'At least one role' },
  { key: 'education', label: 'At least one education item' },
  { key: 'skills', label: 'At least three skills' },
];
