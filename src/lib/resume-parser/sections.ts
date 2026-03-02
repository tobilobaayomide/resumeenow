import {
  RESUME_PARSER_EMAIL_REGEX as EMAIL_REGEX,
  RESUME_PARSER_PHONE_REGEX as PHONE_REGEX,
  RESUME_PARSER_SECTION_LABELS as SECTION_LABELS,
  RESUME_PARSER_SECTION_PATTERNS as SECTION_PATTERNS,
} from '../../data/parser';
import type { ResumeParserSectionKey as SectionKey } from '../../types/parser';
import { cleanLine, splitLines } from './text';

export interface CollectedResumeSections {
  preamble: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  projects: string;
  certifications: string;
  volunteering: string;
  awards: string;
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractInlineSectionHeading = (
  line: string,
): { section: SectionKey; remainder: string } | null => {
  const normalizedLine = cleanLine(line);
  if (!normalizedLine) return null;

  for (const [section, labels] of Object.entries(SECTION_LABELS) as [SectionKey, string[]][]) {
    for (const label of labels) {
      const exactPattern = new RegExp(`^${escapeRegex(label)}$`, 'i');
      if (exactPattern.test(normalizedLine)) {
        return { section, remainder: '' };
      }

      const inlinePattern = new RegExp(
        `^${escapeRegex(label)}\\s*(?::|\\||[–—-]|[•●*])\\s*(.+)$`,
        'i',
      );
      const match = normalizedLine.match(inlinePattern);
      if (!match) {
        continue;
      }

      return {
        section,
        remainder: cleanLine(match[1] ?? ''),
      };
    }
  }

  return null;
};

export const detectSectionHeading = (line: string): SectionKey | null => {
  const normalized = line
    .toLowerCase()
    .replace(/[^a-z0-9\s&/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized || normalized.length > 64) return null;

  for (const [section, patterns] of Object.entries(SECTION_PATTERNS) as [SectionKey, RegExp[]][]) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return section;
    }
  }

  return null;
};

export const collectSections = (lines: string[]): CollectedResumeSections => {
  const map: Record<SectionKey | 'preamble', string[]> = {
    preamble: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    certifications: [],
    volunteering: [],
    awards: [],
  };

  let current: SectionKey | 'preamble' = 'preamble';

  for (const line of lines) {
    const inlineMatch = extractInlineSectionHeading(line);
    if (inlineMatch) {
      current = inlineMatch.section;
      if (inlineMatch.remainder) {
        map[current].push(inlineMatch.remainder);
      }
      continue;
    }

    const section = detectSectionHeading(line);
    if (section) {
      current = section;
      continue;
    }

    map[current].push(line);
  }

  return {
    preamble: map.preamble.join('\n').trim(),
    summary: map.summary.join('\n').trim(),
    experience: map.experience.join('\n').trim(),
    education: map.education.join('\n').trim(),
    skills: map.skills.join('\n').trim(),
    languages: map.languages.join('\n').trim(),
    projects: map.projects.join('\n').trim(),
    certifications: map.certifications.join('\n').trim(),
    volunteering: map.volunteering.join('\n').trim(),
    awards: map.awards.join('\n').trim(),
  };
};

export const extractSkillsFromPreamble = (preambleText: string): string => {
  const preambleLines = splitLines(preambleText);
  const startIndex = preambleLines.findIndex((line) => /^(technical skills|skills)\s*[:-]/i.test(line));
  if (startIndex < 0) return '';

  const collected: string[] = [preambleLines[startIndex]];

  for (let index = startIndex + 1; index < preambleLines.length; index += 1) {
    const line = preambleLines[index];
    if (detectSectionHeading(line)) break;

    // Keep wrapped continuation lines, stop at likely profile/contact style lines.
    if (line.includes('|') || EMAIL_REGEX.test(line) || PHONE_REGEX.test(line)) break;
    collected.push(line);
  }

  return collected.join(' ');
};
