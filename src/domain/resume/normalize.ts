import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_IDS,
  type TemplateId,
} from "../templates/index.js";
import { EMPTY_PERSONAL_INFO, INITIAL_RESUME_DATA } from "./defaults.js";
import { normalizeSkillsSection } from "./skills.js";
import type {
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLinkItem,
  ResumePersonalInfo,
  ResumeProjectItem,
  ResumeRecord,
} from "./types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toString = (value: unknown): string => (typeof value === "string" ? value : "");

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const uniqueStringArray = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const normalizePersonalInfo = (value: unknown): ResumePersonalInfo => {
  if (!isRecord(value)) return EMPTY_PERSONAL_INFO;

  return {
    fullName: toString(value.fullName),
    email: toString(value.email),
    phone: toString(value.phone),
    jobTitle: toString(value.jobTitle),
    location: toString(value.location),
    website: toString(value.website),
    links: normalizeLinkList(value.links),
  };
};

const normalizeLinkItem = (value: unknown, index: number): ResumeLinkItem => {
  if (!isRecord(value)) {
    return {
      id: `link-${index}`,
      label: "",
      url: "",
    };
  }

  return {
    id: toString(value.id) || `link-${index}`,
    label: toString(value.label) || toString(value.title),
    url: toString(value.url) || toString(value.href),
  };
};

const normalizeExperienceItem = (value: unknown, index: number): ResumeExperienceItem => {
  if (!isRecord(value)) {
    return {
      id: `exp-${index}`,
      role: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    };
  }

  const fallbackDate = toString(value.date);

  return {
    id: toString(value.id) || `exp-${index}`,
    role: toString(value.role),
    company: toString(value.company),
    startDate: toString(value.startDate) || toString(value.start_date) || fallbackDate,
    endDate: toString(value.endDate) || toString(value.end_date),
    description: toString(value.description),
  };
};

const normalizeEducationItem = (value: unknown, index: number): ResumeEducationItem => {
  if (!isRecord(value)) {
    return {
      id: `edu-${index}`,
      school: "",
      degree: "",
      startDate: "",
      endDate: "",
      description: "",
    };
  }

  const fallbackDate = toString(value.date);

  return {
    id: toString(value.id) || `edu-${index}`,
    school: toString(value.school),
    degree: toString(value.degree),
    startDate: toString(value.startDate) || toString(value.start_date) || fallbackDate,
    endDate: toString(value.endDate) || toString(value.end_date),
    description: toString(value.description),
  };
};

const normalizeProjectItem = (value: unknown, index: number): ResumeProjectItem => {
  if (!isRecord(value)) {
    return {
      id: `proj-${index}`,
      name: "",
      link: "",
      startDate: "",
      endDate: "",
      description: "",
    };
  }

  const fallbackDate = toString(value.date);

  return {
    id: toString(value.id) || `proj-${index}`,
    name: toString(value.name) || toString(value.title),
    link: toString(value.link) || toString(value.url),
    startDate: toString(value.startDate) || toString(value.start_date) || fallbackDate,
    endDate: toString(value.endDate) || toString(value.end_date),
    description: toString(value.description),
  };
};

export const normalizeExperienceList = (value: unknown): ResumeExperienceItem[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeExperienceItem);
};

export const normalizeEducationList = (value: unknown): ResumeEducationItem[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeEducationItem);
};

export const normalizeProjectList = (value: unknown): ResumeProjectItem[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeProjectItem);
};

export const normalizeLinkList = (value: unknown): ResumeLinkItem[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: ResumeLinkItem[] = [];

  value.forEach((item, index) => {
    const normalized = normalizeLinkItem(item, index);
    const key = normalized.url.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    items.push(normalized);
  });

  return items;
};

export const normalizeTemplateId = (templateId: unknown): TemplateId => {
  if (typeof templateId !== "string") return DEFAULT_TEMPLATE_ID;
  return TEMPLATE_IDS.includes(templateId as TemplateId)
    ? (templateId as TemplateId)
    : DEFAULT_TEMPLATE_ID;
};

export const normalizeResumeData = (value: unknown): ResumeData => {
  if (!isRecord(value)) return INITIAL_RESUME_DATA;

  const parsedExperience = normalizeExperienceList(value.experience);
  const parsedVolunteering = normalizeExperienceList(value.volunteering);
  const parsedVolunteeringOnly = parsedVolunteering.filter(
    (item) => item.company !== "Awards & Honours",
  );
  const parsedAwardsFromVolunteering = parsedVolunteering.filter(
    (item) => item.company === "Awards & Honours",
  );
  const legacyVolunteering = parsedExperience.filter((item) => item.company === "Volunteering");
  const hasExplicitVolunteering = parsedVolunteeringOnly.length > 0;

  const parsedAchievements = toStringArray(value.achievements);
  const legacyAwards = uniqueStringArray([
    ...toStringArray(value.awards),
    ...parsedExperience
      .filter((item) => item.company === "Awards & Honours")
      .map((item) => item.role || item.description),
    ...parsedAwardsFromVolunteering.map((item) => item.role || item.description),
  ]);

  return {
    personalInfo: normalizePersonalInfo(value.personalInfo),
    summary: toString(value.summary),
    experience: hasExplicitVolunteering
      ? parsedExperience
      : parsedExperience.filter(
          (item) => item.company !== "Volunteering" && item.company !== "Awards & Honours",
        ),
    volunteering: hasExplicitVolunteering ? parsedVolunteeringOnly : legacyVolunteering,
    projects: normalizeProjectList(value.projects),
    education: normalizeEducationList(value.education),
    certifications: toStringArray(value.certifications),
    skills: normalizeSkillsSection(value.skills),
    languages: uniqueStringArray([
      ...toStringArray(value.languages),
      ...toStringArray(value.language),
    ]),
    achievements: parsedAchievements.length > 0 ? parsedAchievements : legacyAwards,
  };
};

export const normalizeResumeRecord = (value: unknown): ResumeRecord | null => {
  if (!isRecord(value)) return null;

  const id = toString(value.id);
  const userId = toString(value.user_id);
  const updatedAt = toString(value.updated_at);

  if (!id || !userId) return null;

  return {
    id,
    user_id: userId,
    title: toString(value.title) || "Untitled Resume",
    template_id: normalizeTemplateId(value.template_id),
    content: normalizeResumeData(value.content),
    updated_at: updatedAt || new Date(0).toISOString(),
    created_at: toString(value.created_at) || undefined,
  };
};
