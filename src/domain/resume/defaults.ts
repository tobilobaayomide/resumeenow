import type { ResumeData, ResumePersonalInfo } from "./types";

export const EMPTY_PERSONAL_INFO: ResumePersonalInfo = {
  fullName: "",
  email: "",
  phone: "",
  jobTitle: "",
  location: "",
  website: "",
  links: [],
};

export const INITIAL_RESUME_DATA: ResumeData = {
  personalInfo: EMPTY_PERSONAL_INFO,
  summary: "",
  experience: [],
  volunteering: [],
  projects: [],
  education: [],
  certifications: [],
  skills: [],
  languages: [],
  achievements: [],
};
