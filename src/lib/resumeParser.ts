import {
  INITIAL_RESUME_DATA,
  type ResumeData,
} from '../types/resume';
import {
  RESUME_PARSER_EMAIL_REGEX as EMAIL_REGEX,
  RESUME_PARSER_PHONE_REGEX as PHONE_REGEX,
} from '../data/parser';
import type { ParsedResumeResult } from '../types/parser';
import {
  extractLinks,
  extractLocation,
  inferNameAndJobTitle,
  parseCertificationsText,
  parseEducationSection,
  parseExperienceSection,
  parseListAsExperience,
  parseProjectSection,
  parseSkillsSection,
  parseSkillsText,
  toSuggestedTitle,
} from './resume-parser/entities';
import { extractRawText } from './resume-parser/file';
import {
  collectSections,
  extractSummaryFromPreamble,
  extractSkillsFromPreamble,
  detectSectionHeading,
} from './resume-parser/sections';
import {
  cleanLine,
  dedupeRepeatedHalves,
  isReadableDocumentText,
  splitLines,
} from './resume-parser/text';

export const parseResumeFile = async (file: File): Promise<ParsedResumeResult> => {
  try {
    const rawText = await extractRawText(file);
    if (!rawText || !rawText.trim()) {
      throw new Error('This file appears to be empty or unreadable.');
    }

    if (!isReadableDocumentText(rawText)) {
      throw new Error(
        'Could not extract reliable text. This often happens with image-based PDFs without OCR. Please use a text-based PDF or DOCX file.',
      );
    }

    const lines = dedupeRepeatedHalves(splitLines(rawText));
    const sections = collectSections(lines);

    const sanitizeSummaryText = (value: string): string =>
      value
        .split('\n')
        .map((line) => cleanLine(line))
        .filter(Boolean)
        .filter((line) => !EMAIL_REGEX.test(line))
        .filter((line) => !PHONE_REGEX.test(line))
        .filter((line) => !/linkedin|github|portfolio|behance|dribbble/i.test(line))
        .filter((line) => !detectSectionHeading(line))
        .join('\n') // Preserve line breaks for summary formatting
        .trim();

    const summaryText = sanitizeSummaryText(
      sections.summary || extractSummaryFromPreamble(sections.preamble),
    );
    const experienceText = sections.experience;
    const projectsText = sections.projects;
    const educationText = sections.education;
    const certificationsText = sections.certifications;
    const skillsText = sections.skills || extractSkillsFromPreamble(sections.preamble) || '';
    const languagesText = sections.languages;

    const email = rawText.match(EMAIL_REGEX)?.[0] ?? '';
    const phone = rawText.match(PHONE_REGEX)?.[0] ?? '';
    const links = extractLinks(lines, email);
    const website = links[0]?.url ?? '';
    const location = extractLocation(lines, email, phone, links);

    const { fullName, jobTitle } = inferNameAndJobTitle(lines);

    const experience = parseExperienceSection(experienceText);
    const volunteering = [
      ...parseListAsExperience(sections.volunteering, 'Volunteering', 'vol'),
    ];
    const projects = parseProjectSection(projectsText);

    const data: ResumeData = {
      ...INITIAL_RESUME_DATA,
      personalInfo: {
        ...INITIAL_RESUME_DATA.personalInfo,
        fullName,
        email,
        phone,
        location,
        website,
        links,
        jobTitle,
      },
      summary: summaryText || '',
      experience,
      volunteering,
      projects,
      education: parseEducationSection(educationText),
      certifications: parseCertificationsText(certificationsText),
      skills: parseSkillsSection(skillsText),
      languages: parseSkillsText(languagesText),
      achievements: parseCertificationsText(sections.awards),
    };

    return {
      data,
      suggestedTitle: toSuggestedTitle(file.name),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown parsing error';
    console.error('[ResumeParser] Critical failure:', error);
    throw new Error(`Resume parsing failed: ${message}. Try a different file format if this persists.`);
  }
};
