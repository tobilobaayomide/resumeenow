import type { TemplateId } from "../templates";

export interface ResumePersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  location: string;
  website: string;
  links: ResumeLinkItem[];
}

export interface ResumeLinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ResumeExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeEducationItem {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeProjectItem {
  id: string;
  name: string;
  link: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeData {
  personalInfo: ResumePersonalInfo;
  summary: string;
  experience: ResumeExperienceItem[];
  volunteering: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  education: ResumeEducationItem[];
  certifications: string[];
  skills: string[];
  languages: string[];
  achievements: string[];
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  template_id: TemplateId;
  content: ResumeData;
  updated_at: string;
  created_at?: string;
}
