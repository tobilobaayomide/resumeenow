import type { ResumeData, ResumePersonalInfo } from "./types.js";
import { EMPTY_SKILLS_SECTION } from "./skills.js";

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
  skills: {
    ...EMPTY_SKILLS_SECTION,
    list: [],
    groups: [],
  },
  languages: [],
  achievements: [],
};
