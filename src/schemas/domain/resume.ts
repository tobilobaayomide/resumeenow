import { z } from 'zod';
import {
  normalizeResumeData,
  normalizeResumeRecord,
  normalizeTemplateId,
} from '../../domain/resume/index.js';
import type {
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLinkItem,
  ResumePersonalInfo,
  ResumeProjectItem,
  ResumeRecord,
  ResumeSkillGroup,
  ResumeSkillsSection,
} from '../../domain/resume/types.js';
import { TEMPLATE_IDS } from '../../domain/templates/index.js';
import type { TemplateId } from '../../domain/templates/types.js';

export const TemplateIdSchema = z.enum(TEMPLATE_IDS);

export const ResumeLinkItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
});

export const ResumePersonalInfoSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  jobTitle: z.string(),
  location: z.string(),
  website: z.string(),
  links: z.array(ResumeLinkItemSchema),
});

export const ResumeExperienceItemSchema = z.object({
  id: z.string(),
  role: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

export const ResumeEducationItemSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

export const ResumeProjectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  link: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

export const ResumeSkillGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  items: z.array(z.string()),
});

export const ResumeSkillsSectionSchema = z.object({
  mode: z.enum(['list', 'grouped']),
  list: z.array(z.string()),
  groups: z.array(ResumeSkillGroupSchema),
});

export const ResumeDataSchema = z.object({
  personalInfo: ResumePersonalInfoSchema,
  summary: z.string(),
  experience: z.array(ResumeExperienceItemSchema),
  volunteering: z.array(ResumeExperienceItemSchema),
  projects: z.array(ResumeProjectItemSchema),
  education: z.array(ResumeEducationItemSchema),
  certifications: z.array(z.string()),
  skills: ResumeSkillsSectionSchema,
  languages: z.array(z.string()),
  achievements: z.array(z.string()),
});

export const ResumeRecordSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  template_id: TemplateIdSchema,
  content: ResumeDataSchema,
  updated_at: z.string(),
  created_at: z.string().optional(),
});

const ResumeDataInputSchema = z.preprocess(
  (value) => normalizeResumeData(value),
  ResumeDataSchema,
);

const ResumeRecordInputSchema = z.preprocess(
  (value) => normalizeResumeRecord(value),
  ResumeRecordSchema,
);

const TemplateIdInputSchema = z.preprocess(
  (value) => normalizeTemplateId(value),
  TemplateIdSchema,
);

export const parseResumeData = (value: unknown): ResumeData =>
  ResumeDataInputSchema.parse(value) as ResumeData;

export const parseStrictResumeData = (value: unknown): ResumeData =>
  ResumeDataSchema.parse(value) as ResumeData;

export const safeParseResumeData = (
  value: unknown,
): { success: true; data: ResumeData } | { success: false } => {
  const result = ResumeDataInputSchema.safeParse(value);
  if (!result.success) {
    return { success: false };
  }

  return { success: true, data: result.data as ResumeData };
};

export const parseResumeRecord = (value: unknown): ResumeRecord =>
  ResumeRecordInputSchema.parse(value) as ResumeRecord;

export const safeParseResumeRecord = (
  value: unknown,
): { success: true; data: ResumeRecord } | { success: false } => {
  const result = ResumeRecordInputSchema.safeParse(value);
  if (!result.success) {
    return { success: false };
  }

  return { success: true, data: result.data as ResumeRecord };
};

export const parseTemplateId = (value: unknown): TemplateId =>
  TemplateIdInputSchema.parse(value) as TemplateId;

export const parseStrictTemplateId = (value: unknown): TemplateId =>
  TemplateIdSchema.parse(value) as TemplateId;

export type ResumeLinkItemShape = ResumeLinkItem;
export type ResumePersonalInfoShape = ResumePersonalInfo;
export type ResumeExperienceItemShape = ResumeExperienceItem;
export type ResumeEducationItemShape = ResumeEducationItem;
export type ResumeProjectItemShape = ResumeProjectItem;
export type ResumeSkillGroupShape = ResumeSkillGroup;
export type ResumeSkillsSectionShape = ResumeSkillsSection;
export type ResumeDataShape = ResumeData;
export type ResumeRecordShape = ResumeRecord;
