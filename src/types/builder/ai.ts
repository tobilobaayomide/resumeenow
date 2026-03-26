import type { EditorSectionTabId } from './editor';

export type BuilderAiHighlightSection = Extract<
  EditorSectionTabId,
  'summary' | 'skills' | 'experience'
>;

export interface BuilderAiHighlights {
  summary: boolean;
  skills: string[];
  experience: Record<string, string[]>;
}

export interface BuilderAiHighlightFocusTarget {
  section: BuilderAiHighlightSection;
  skill?: string;
  experienceId?: string;
}
