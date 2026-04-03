import { z } from 'zod';
import {
  INITIAL_RESUME_DATA,
  normalizeEducationList,
  normalizeExperienceList,
  normalizeLinkList,
  normalizeProjectList,
  normalizeSkillsSection,
} from '../../domain/resume/index.js';
import type { ResumeData } from '../../domain/resume/types.js';
import type { SettingsFormState } from '../../types/dashboard/settings.js';
import type { CareerProfileState } from '../../types/dashboard/careerProfile.js';
import {
  ResumeDataSchema,
  ResumeEducationItemSchema,
  ResumeExperienceItemSchema,
} from '../domain/resume.js';
import type { ProfileRole } from '../../types/profile.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const toCareerProfileSkills = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const toNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const normalizeProfileResumeImport = (
  value: unknown,
  userEmail: string,
): ResumeData => {
  const record = isRecord(value) ? value : {};
  const profileWebsite = toString(record.website);
  const parsedLinks = normalizeLinkList(record.links);
  const links =
    parsedLinks.length > 0
      ? parsedLinks
      : profileWebsite
        ? [{ id: 'link-1', label: 'Website', url: profileWebsite }]
        : [];

  return {
    personalInfo: {
      ...INITIAL_RESUME_DATA.personalInfo,
      fullName: toString(record.full_name),
      email: userEmail,
      phone: toString(record.phone),
      jobTitle: toString(record.headline),
      location: toString(record.location),
      website: profileWebsite,
      links,
    },
    summary: toString(record.bio),
    experience: normalizeExperienceList(record.experience),
    volunteering: normalizeExperienceList(record.volunteering),
    projects: normalizeProjectList(record.projects),
    education: normalizeEducationList(record.education),
    certifications: toStringArray(record.certifications),
    skills: normalizeSkillsSection(record.skills),
    languages: toStringArray(record.languages),
    achievements: toStringArray(record.achievements ?? record.awards),
  };
};

const normalizeCareerProfileState = (
  value: unknown,
  userEmail: string,
): CareerProfileState => {
  const record = isRecord(value) ? value : {};

  return {
    full_name: toString(record.full_name),
    headline: toString(record.headline),
    location: toString(record.location),
    email: userEmail,
    phone: toString(record.phone),
    website: toString(record.website),
    bio: toString(record.bio),
    experience: normalizeExperienceList(record.experience),
    education: normalizeEducationList(record.education),
    skills: toCareerProfileSkills(record.skills),
  };
};

export const CareerProfileStateSchema = z.object({
  full_name: z.string(),
  headline: z.string(),
  location: z.string(),
  email: z.string(),
  phone: z.string(),
  website: z.string(),
  bio: z.string(),
  experience: z.array(ResumeExperienceItemSchema),
  education: z.array(ResumeEducationItemSchema),
  skills: z.array(z.string()),
});

export const SettingsFormStateSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
});

export const SettingsProfileUpdateSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  bio: z.string(),
  avatar_url: z.string().nullable(),
  updated_at: z.string(),
});

export const ProfileRoleSchema = z.enum(['user', 'admin']);

export const AvatarProfileUpdateSchema = z.object({
  id: z.string(),
  avatar_url: z.string(),
  updated_at: z.string(),
});

export const CareerProfileUpdateSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  headline: z.string(),
  location: z.string(),
  phone: z.string(),
  website: z.string(),
  bio: z.string(),
  experience: z.array(ResumeExperienceItemSchema),
  education: z.array(ResumeEducationItemSchema),
  skills: z.array(z.string()),
  updated_at: z.string(),
});

export const parseProfileResumeImport = (
  value: unknown,
  userEmail = '',
): ResumeData =>
  ResumeDataSchema.parse(
    normalizeProfileResumeImport(value, userEmail),
  ) as ResumeData;

export const safeParseCareerProfileState = (
  value: unknown,
  userEmail = '',
): { success: true; data: CareerProfileState } | { success: false } => {
  const result = CareerProfileStateSchema.safeParse(
    normalizeCareerProfileState(value, userEmail),
  );

  if (!result.success) {
    return { success: false };
  }

  return { success: true, data: result.data as CareerProfileState };
};

export const parseCareerProfileState = (
  value: unknown,
  userEmail = '',
): CareerProfileState =>
  CareerProfileStateSchema.parse(
    normalizeCareerProfileState(value, userEmail),
  ) as CareerProfileState;

export const parseSettingsFormState = (
  value: unknown,
  fallbackAvatarUrl: string | null = null,
): SettingsFormState => {
  const record = isRecord(value) ? value : {};
  const fullName = toString(record.full_name);
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return SettingsFormStateSchema.parse({
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    bio: toString(record.bio),
    avatarUrl: toNullableString(record.avatar_url) ?? fallbackAvatarUrl,
  }) as SettingsFormState;
};

export const parseSettingsProfileUpdate = (value: unknown) =>
  SettingsProfileUpdateSchema.parse(value);

export const parseProfileRole = (value: unknown): ProfileRole => {
  const record = isRecord(value) ? value : {};
  const result = ProfileRoleSchema.safeParse(record.role);

  return result.success ? result.data : 'user';
};

export const parseAvatarProfileUpdate = (value: unknown) =>
  AvatarProfileUpdateSchema.parse(value);

export const parseCareerProfileUpdate = (value: unknown) =>
  CareerProfileUpdateSchema.parse(value);
