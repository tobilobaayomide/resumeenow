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
  parseSkillsText,
  toSuggestedTitle,
} from './resume-parser/entities';
import { extractRawText } from './resume-parser/pdf';
import {
  collectSections,
  extractSkillsFromPreamble,
} from './resume-parser/sections';
import {
  dedupeRepeatedHalves,
  isReadableDocumentText,
  splitLines,
} from './resume-parser/text';

export const parseResumeFile = async (file: File): Promise<ParsedResumeResult> => {
  const rawText = await extractRawText(file);
  if (!rawText.trim() || !isReadableDocumentText(rawText)) {
    throw new Error(
      'Could not extract reliable resume text from this file. Use a cleaner text PDF or DOC/TXT.',
    );
  }

  const lines = dedupeRepeatedHalves(splitLines(rawText));
  const sections = collectSections(lines);

  const summaryText = sections.summary;
  const experienceText = sections.experience;
  const projectsText = sections.projects;
  const educationText = sections.education;
  const certificationsText = sections.certifications;
  const skillsText = sections.skills || extractSkillsFromPreamble(sections.preamble) || '';
  const languagesText = sections.languages;

  const email = rawText.match(EMAIL_REGEX)?.[0] ?? '';
  const phone = rawText.match(PHONE_REGEX)?.[0] ?? '';
  const links = extractLinks(lines, rawText, email);
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
    skills: parseSkillsText(skillsText),
    languages: parseSkillsText(languagesText),
    achievements: parseCertificationsText(sections.awards),
  };

  return {
    data,
    suggestedTitle: toSuggestedTitle(file.name),
  };
};
