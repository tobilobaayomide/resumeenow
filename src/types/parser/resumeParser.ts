import type { ResumeData } from '../resume.js';

export type ResumeParserSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'projects'
  | 'certifications'
  | 'volunteering'
  | 'awards';

export interface ParsedResumeResult {
  data: ResumeData;
  suggestedTitle: string;
}

export interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  hasEOL?: boolean;
}
