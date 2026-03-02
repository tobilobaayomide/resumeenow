import {
  RESUME_PARSER_EMAIL_REGEX as EMAIL_REGEX,
  RESUME_PARSER_LINK_INVALID_TLDS as LINK_INVALID_TLDS,
  RESUME_PARSER_LINK_TECH_TOKEN_BLACKLIST as LINK_TECH_TOKEN_BLACKLIST,
  RESUME_PARSER_URL_REGEX as URL_REGEX,
} from '../../data/parser';
import type {
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLinkItem,
  ResumeProjectItem,
} from '../../types/resume';
import { LOOSE_DATE_RANGE_REGEX, parseLooseDateRange } from './dates';
import { detectSectionHeading } from './sections';
import { cleanLine, isNoiseLine, splitLines } from './text';

const parseRoleAndCompany = (
  firstLine: string,
  secondLine: string,
): { role: string; company: string } => {
  const atPattern = firstLine.match(/^(.*?)\s+(?:at|@)\s+(.*)$/i);
  if (atPattern) {
    return { role: cleanLine(atPattern[1]), company: cleanLine(atPattern[2]) };
  }

  const commaPattern = firstLine.match(/^(.*?),\s*(.*)$/);
  if (commaPattern) {
    return { role: cleanLine(commaPattern[1]), company: cleanLine(commaPattern[2]) };
  }

  const dashPattern = firstLine.match(/^(.*?)\s*[|•-]\s*(.*)$/);
  if (dashPattern) {
    return { role: cleanLine(dashPattern[1]), company: cleanLine(dashPattern[2]) };
  }

  return {
    role: cleanLine(firstLine),
    company: cleanLine(secondLine),
  };
};

const isExperienceEntryStart = (line: string): boolean => {
  if (/^[•●*-]\s+/.test(line)) return true;
  if (/^[A-Z].*:\s/.test(line) && parseLooseDateRange(line).startDate) return true;
  return false;
};

const splitFirst = (value: string, delimiter: string): [string, string] => {
  const index = value.indexOf(delimiter);
  if (index < 0) return [value, ''];
  return [value.slice(0, index), value.slice(index + delimiter.length)];
};

export const parseExperienceSection = (sectionText: string): ResumeExperienceItem[] => {
  if (!sectionText.trim()) return [];

  const lines = splitLines(sectionText);
  const dateAnchors = lines
    .map((line, index) => ({ index, dates: parseLooseDateRange(line), line }))
    .filter(({ dates }) => Boolean(dates.startDate));

  const isLikelyCompanyLine = (line: string): boolean => {
    const text = cleanLine(line);
    if (!text) return false;
    if (parseLooseDateRange(text).startDate) return false;
    if (/^[o•●*-]\s+/.test(text)) return false;
    if (text.length > 90) return false;
    if (text.split(/\s+/).length > 12) return false;
    if (/[.!?]$/.test(text) && !text.includes('|')) return false;
    if (text.includes('|') || text.includes(',')) return true;
    return /^[A-Z0-9][A-Za-z0-9&'()./-]+(?:\s+[A-Z0-9][A-Za-z0-9&'()./-]+){1,6}$/.test(text);
  };

  if (dateAnchors.length > 0) {
    const entries: ResumeExperienceItem[] = [];

    for (let anchorIndex = 0; anchorIndex < dateAnchors.length; anchorIndex += 1) {
      const currentAnchor = dateAnchors[anchorIndex];
      const nextAnchor = dateAnchors[anchorIndex + 1];

      const roleLine = cleanLine(currentAnchor.line.replace(/^[•●*-]\s*/, ''));
      const { startDate, endDate } = currentAnchor.dates;
      const roleWithoutDates = cleanLine(
        roleLine.replace(LOOSE_DATE_RANGE_REGEX, '').replace(/\s{2,}/g, ' '),
      );

      const companyLine = currentAnchor.index > 0 && isLikelyCompanyLine(lines[currentAnchor.index - 1])
        ? cleanLine(lines[currentAnchor.index - 1])
        : '';

      const parsed = parseRoleAndCompany(roleWithoutDates, '');
      const role = companyLine ? roleWithoutDates : parsed.role;
      const company = companyLine || parsed.company;

      const descriptionStart = currentAnchor.index + 1;
      let descriptionEnd = nextAnchor ? nextAnchor.index - 1 : lines.length - 1;

      if (nextAnchor && descriptionEnd >= descriptionStart && isLikelyCompanyLine(lines[descriptionEnd])) {
        descriptionEnd -= 1;
      }

      const description = lines
        .slice(descriptionStart, descriptionEnd + 1)
        .map((line) => cleanLine(line.replace(/^[o•●*-]\s*/, '')))
        .filter(Boolean)
        .join(' ');

      entries.push({
        id: `exp-${anchorIndex + 1}`,
        role: cleanLine(role),
        company: cleanLine(company),
        startDate,
        endDate,
        description,
      });
    }

    return entries.filter((item) => item.role || item.company || item.description);
  }

  const entries: ResumeExperienceItem[] = [];
  let current: ResumeExperienceItem | null = null;
  let index = 1;

  const commitCurrent = () => {
    if (!current) return;

    if (current.role || current.company || current.description) {
      entries.push(current);
    }

    current = null;
  };

  for (const line of lines) {
    if (isExperienceEntryStart(line)) {
      commitCurrent();

      const header = cleanLine(line.replace(/^[•●*-]\s*/, ''));
      const { startDate, endDate } = parseLooseDateRange(header);
      const headerWithoutDates = cleanLine(
        header
          .replace(LOOSE_DATE_RANGE_REGEX, '')
          .replace(/\s{2,}/g, ' '),
      );

      let role = '';
      let company = '';

      if (headerWithoutDates.includes(':')) {
        const [left, right] = splitFirst(headerWithoutDates, ':');
        role = cleanLine(left);
        company = cleanLine(right);
      } else {
        const parsed = parseRoleAndCompany(headerWithoutDates, '');
        role = parsed.role;
        company = parsed.company;
      }

      current = {
        id: `exp-${index++}`,
        role,
        company,
        startDate,
        endDate,
        description: '',
      };

      continue;
    }

    const detail = cleanLine(line.replace(/^[o•●*-]\s*/, ''));
    if (!detail) continue;

    if (!current) {
      current = {
        id: `exp-${index++}`,
        role: detail,
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      };
      continue;
    }

    current.description = current.description
      ? `${current.description} ${detail}`
      : detail;
  }

  commitCurrent();
  return entries;
};

export const parseEducationSection = (sectionText: string): ResumeEducationItem[] => {
  if (!sectionText.trim()) return [];

  const blocks = sectionText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = splitLines(block);
    const school = lines[0] ?? '';
    const degree = lines[1] ?? '';
    const dateLine = lines.find((line) => parseLooseDateRange(line).startDate) ?? '';
    const { startDate, endDate } = parseLooseDateRange(dateLine || `${school} ${degree}`);
    const description = lines
      .filter((line) => line !== school && line !== degree && line !== dateLine)
      .join(' ')
      .trim();

    return {
      id: `edu-${index + 1}`,
      school: cleanLine(school),
      degree: cleanLine(degree),
      startDate,
      endDate,
      description,
    };
  });
};

export const parseSkillsText = (sectionText: string): string[] => {
  if (!sectionText.trim()) return [];

  return Array.from(
    new Set(
      sectionText
        .replace(/\n/g, ',')
        .replace(/^technical skills\s*[:-]?\s*/i, '')
        .split(/[,•·|]/)
        .map((skill) => cleanLine(skill))
        .filter((skill) => skill.length > 1 && skill.length <= 40 && !isNoiseLine(skill)),
    ),
  );
};

export const parseCertificationsText = (sectionText: string): string[] => {
  if (!sectionText.trim()) return [];

  return Array.from(
    new Set(
      splitLines(sectionText)
        .join('\n')
        .split(/\n|[,•·|]/)
        .map((item) => cleanLine(item))
        .filter((item) => item.length > 2 && item.length <= 120 && !isNoiseLine(item)),
    ),
  );
};

export const parseProjectSection = (sectionText: string): ResumeProjectItem[] => {
  if (!sectionText.trim()) return [];

  const lines = splitLines(sectionText);
  const entries: ResumeProjectItem[] = [];
  let current: ResumeProjectItem | null = null;
  let index = 1;

  const commitCurrent = () => {
    if (!current) return;
    if (current.name || current.description || current.link) {
      entries.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    const isNewEntry = /^[•●*-]\s+/.test(line) || /^\d+\.\s+/.test(line);
    if (isNewEntry) {
      commitCurrent();

      const header = cleanLine(line.replace(/^(?:[•●*-]|\d+\.)\s*/, ''));
      const { startDate, endDate } = parseLooseDateRange(header);
      const headerWithoutDates = cleanLine(
        header
          .replace(LOOSE_DATE_RANGE_REGEX, '')
          .replace(/\s{2,}/g, ' '),
      );
      const link = headerWithoutDates.match(URL_REGEX)?.[0] ?? '';
      const name = cleanLine(headerWithoutDates.replace(link, '').replace(/^project\s*[:-]\s*/i, ''));

      current = {
        id: `proj-${index++}`,
        name,
        link,
        startDate,
        endDate,
        description: '',
      };
      continue;
    }

    const detail = cleanLine(line.replace(/^[o•●*-]\s*/, ''));
    if (!detail) continue;

    if (!current) {
      const link = detail.match(URL_REGEX)?.[0] ?? '';
      current = {
        id: `proj-${index++}`,
        name: cleanLine(detail.replace(link, '')),
        link,
        startDate: '',
        endDate: '',
        description: '',
      };
      continue;
    }

    if (!current.link) {
      const link = detail.match(URL_REGEX)?.[0] ?? '';
      if (link) {
        current.link = link;
      }
    }

    current.description = current.description
      ? `${current.description} ${detail}`
      : detail;
  }

  commitCurrent();
  return entries;
};

export const parseListAsExperience = (
  sectionText: string,
  categoryLabel: string,
  prefix: string,
): ResumeExperienceItem[] => {
  const lines = splitLines(sectionText).map((line) => cleanLine(line.replace(/^[•●*-]\s*/, '')));

  return lines
    .filter(Boolean)
    .map((line, index) => {
      const { startDate, endDate } = parseLooseDateRange(line);
      const role = cleanLine(
        line
          .replace(LOOSE_DATE_RANGE_REGEX, '')
          .replace(/\s{2,}/g, ' '),
      );

      return {
        id: `${prefix}-${index + 1}`,
        role,
        company: categoryLabel,
        startDate,
        endDate,
        description: '',
      };
    });
};

const guessName = (lines: string[]): string => {
  for (const line of lines.slice(0, 12)) {
    if (isNoiseLine(line)) continue;

    const words = line.split(' ').filter(Boolean);
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 4 &&
      words.every((word) => /^[A-Z][a-zA-Z'-]+$/.test(word));

    if (looksLikeName) return line;
  }

  return '';
};

export const inferNameAndJobTitle = (lines: string[]): { fullName: string; jobTitle: string } => {
  const firstLine = lines[0] ?? '';
  const firstLineMatch = firstLine.match(
    /^([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3})\s*[,|-]\s*(.{2,80})$/,
  );

  if (firstLineMatch) {
    return {
      fullName: cleanLine(firstLineMatch[1]),
      jobTitle: cleanLine(firstLineMatch[2]),
    };
  }

  const fullName = guessName(lines);
  if (!fullName) return { fullName: '', jobTitle: '' };

  const jobTitle = lines.find((line) => (
    line !== fullName
    && !EMAIL_REGEX.test(line)
    && !URL_REGEX.test(line)
    && !line.includes('|')
    && !detectSectionHeading(line)
  )) ?? '';

  return { fullName, jobTitle: cleanLine(jobTitle) };
};

const inferLinkLabel = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.includes('github.com')) return 'GitHub';
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('gitlab.com')) return 'GitLab';
  if (lower.includes('portfolio')) return 'Portfolio';
  if (lower.includes('behance.net')) return 'Behance';
  return 'Link';
};

const isLikelyWebLink = (value: string): boolean => {
  const lower = value.toLowerCase();
  if (!lower || LINK_TECH_TOKEN_BLACKLIST.has(lower)) return false;
  if (EMAIL_REGEX.test(lower)) return false;

  if (
    lower.startsWith('http://')
    || lower.startsWith('https://')
    || lower.startsWith('www.')
    || lower.includes('linkedin.com')
    || lower.includes('github.com')
    || lower.includes('gitlab.com')
    || lower.includes('behance.net')
    || lower.includes('dribbble.com')
  ) {
    return true;
  }

  if (!URL_REGEX.test(lower)) return false;

  const domainPart = lower.split('/')[0].replace(/^www\./, '');
  const segments = domainPart.split('.');
  if (segments.length < 2) return false;

  const tld = segments[segments.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) return false;
  if (LINK_INVALID_TLDS.has(tld)) return false;
  if (segments[0].length < 2) return false;

  return true;
};

export const extractLinks = (lines: string[], rawText: string, email: string): ResumeLinkItem[] => {
  const emailDomain = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
  const candidates: string[] = [];

  for (const line of lines.slice(0, 40)) {
    const tokens = line.split(/[\s|╴•·]+/);
    for (const token of tokens) {
      const cleaned = cleanLine(token.replace(/[),.;]+$/g, ''));
      if (!cleaned || EMAIL_REGEX.test(cleaned)) continue;
      if (URL_REGEX.test(cleaned)) {
        candidates.push(cleaned);
      }
    }
  }

  const rawMatches = rawText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[\w./?%&=-]*)?/g) ?? [];
  candidates.push(...rawMatches);

  const links: ResumeLinkItem[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const normalized = cleanLine(candidate);
    if (!normalized || EMAIL_REGEX.test(normalized)) continue;

    const lower = normalized.toLowerCase();
    if (emailDomain && lower === emailDomain) continue;
    if (!isLikelyWebLink(normalized)) continue;
    if (seen.has(lower)) continue;

    seen.add(lower);
    links.push({
      id: `link-${links.length + 1}`,
      label: inferLinkLabel(normalized),
      url: normalized,
    });
  }

  return links;
};

export const extractLocation = (lines: string[], email: string, phone: string, links: ResumeLinkItem[]): string => {
  const contactLine = lines.find((line) => line.includes('|'));
  if (!contactLine) return '';

  let location = contactLine;
  if (email) location = location.replace(email, ' ');
  if (phone) location = location.replace(phone, ' ');
  for (const link of links) {
    location = location.replace(link.url, ' ');
  }

  location = location.replace(/\|/g, ' ');
  location = cleanLine(location.replace(/\s{2,}/g, ' '));
  return location;
};

export const toSuggestedTitle = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const cleaned = withoutExtension.replace(/[_-]+/g, ' ').trim();
  return cleaned || 'Imported Resume';
};
