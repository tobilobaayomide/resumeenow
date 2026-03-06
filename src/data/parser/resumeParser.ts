import type { ResumeParserSectionKey } from '../../types/parser';

export const RESUME_PARSER_MONTH_PATTERN =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';

export const RESUME_PARSER_DATE_TOKEN =
  `(?:${RESUME_PARSER_MONTH_PATTERN}\\s+\\d{4}|\\d{4}|present|current|now)`;

export const RESUME_PARSER_DATE_RANGE_REGEX = new RegExp(
  `(${RESUME_PARSER_DATE_TOKEN})\\s*(?:-|–|—|to)\\s*(${RESUME_PARSER_DATE_TOKEN})`,
  'i',
);

export const RESUME_PARSER_LOOSE_DATE_RANGE_REGEX = new RegExp(
  `(${RESUME_PARSER_DATE_TOKEN})\\s*(?:-|–|—|to|\\.|,|\\s)?\\s*(${RESUME_PARSER_DATE_TOKEN})`,
  'i',
);

export const RESUME_PARSER_EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export const RESUME_PARSER_PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;

export const RESUME_PARSER_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[\w./?%&=-]*)?/;

export const RESUME_PARSER_NOISE_PATTERNS = [
  /skia\/pdf/i,
  /google docs renderer/i,
  /adobe identity/i,
  /cidinit/i,
  /begincmap/i,
  /endcmap/i,
  /endobj/i,
  /endstream/i,
  /startxref/i,
  /FlateDecode/i,
] as const;

export const RESUME_PARSER_SECTION_LABELS: Record<ResumeParserSectionKey, string[]> = {
  summary: [
    'summary',
    'career summary',
    'professional summary',
    'professional profile',
    'profile',
    'personal profile',
    'personal statement',
    'objective',
    'career objective',
    'about me',
    'bio',
    'introduction',
    'highlights',
    'overview',
    'executive summary',
    'professional overview',
    'who i am',
  ],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment history',
    'employment',
    'industrial experience',
    'work history',
    'career history',
    'relevant experience',
    'relevant work experience',
    'internship experience',
    'internships',
    'positions held',
    'job history',
    'work background',
  ],
  education: [
    'education',
    'academic background',
    'academic history',
    'educational background',
    'educational history',
    'qualifications',
    'academic qualifications',
    'schooling',
    'training',
    'education and training',
  ],
  skills: [
    'skills',
    'technical skills',
    'core skills',
    'competencies',
    'skills and technologies',
    'skills & technologies',
    'technology stack',
    'key skills',
    'tools',
    'technologies',
    'expertise',
    'areas of expertise',
    'programming languages',
    'software',
    'tools and technologies',
    'tools & technologies',
    'tech stack',
    'technical expertise',
    'core competencies',
    'professional skills',
  ],
  languages: ['languages', 'language proficiency', 'spoken languages'],
  projects: [
    'projects',
    'project experience',
    'selected projects',
    'personal projects',
    'side projects',
    'open source',
    'portfolio',
    'key projects',
    'notable projects',
  ],
  certifications: [
    'certification',
    'certifications',
    'licenses',
    'licenses and certifications',
    'licenses & certifications',
    'certification/volunteer experience',
    'certification / volunteer experience',
    'professional certifications',
    'courses',
    'training and certifications',
    'accreditations',
  ],
  volunteering: [
    'volunteering',
    'volunteer',
    'volunteer experience',
    'activities',
    'leadership',
    'community involvement',
    'community service',
    'extracurricular',
    'extracurricular activities',
    'civic engagement',
  ],
  awards: [
    'awards',
    'awards and honours',
    'awards & honours',
    'honours',
    'achievements',
    'accomplishments',
    'recognition',
    'honors',
    'awards and honors',
    'awards & honors',
  ],
};

// FIX: patterns allow optional trailing colon/punctuation and optional leading number/bullet
// so "3. Work Experience", "● Skills & Tools", "Work Experience:" all match
export const RESUME_PARSER_SECTION_PATTERNS: Record<ResumeParserSectionKey, RegExp[]> = {
  summary: RESUME_PARSER_SECTION_LABELS.summary.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  experience: RESUME_PARSER_SECTION_LABELS.experience.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  education: RESUME_PARSER_SECTION_LABELS.education.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  skills: RESUME_PARSER_SECTION_LABELS.skills.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  languages: RESUME_PARSER_SECTION_LABELS.languages.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  projects: RESUME_PARSER_SECTION_LABELS.projects.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  certifications: RESUME_PARSER_SECTION_LABELS.certifications.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  volunteering: RESUME_PARSER_SECTION_LABELS.volunteering.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
  awards: RESUME_PARSER_SECTION_LABELS.awards.map(
    (label) => new RegExp(`^(?:[\\d.\\s•●*\\-–—]+)?${label}[:\\s]*$`, 'i'),
  ),
};

export const RESUME_PARSER_LINK_TECH_TOKEN_BLACKLIST = new Set([
  'react.js',
  'next.js',
  'node.js',
  'vue.js',
  'nuxt.js',
  'solid.js',
  'express.js',
]);

export const RESUME_PARSER_LINK_INVALID_TLDS = new Set([
  'js',
  'ts',
  'jsx',
  'tsx',
  'css',
  'scss',
  'sass',
  'ui',
]);