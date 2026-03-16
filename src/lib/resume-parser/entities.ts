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
  ResumeSkillGroup,
  ResumeSkillsSection,
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

const ROLE_HINT_REGEX =
  /\b(manager|intern|writer|developer|engineer|analyst|specialist|coordinator|assistant|director|lead|officer|consultant|designer|teacher|lecturer|representative|executive|associate|editor)\b/i;

const COMPANY_HINT_REGEX =
  /\b(inc|llc|ltd|limited|plc|group|company|school|university|college|hospital|radio|fm|agency|foundation|ministry|technologies|technology|tech|corp|corporation)\b/i;
const COMPANY_LOCATION_SPLIT_REGEX = /\s*(?:\||\/|\\|·|•)\s*|\s+[–—-]\s+/;
const COMPANY_LOCATION_NORMALIZE_REGEX = /\s*(?:\||\/|\\|·|•)\s*|\s+[–—-]\s+/g;
const ROLE_ENDING_TOKENS = new Set([
  'engineer',
  'developer',
  'manager',
  'intern',
  'writer',
  'analyst',
  'specialist',
  'coordinator',
  'assistant',
  'director',
  'lead',
  'officer',
  'consultant',
  'designer',
  'architect',
  'administrator',
  'editor',
  'representative',
  'executive',
  'associate',
]);

const parseCompanyAndLocationFromLine = (
  line: string,
): { company: string; location: string } | null => {
  const text = cleanLine(line);
  if (!text) return null;

  const parts = text
    .split(COMPANY_LOCATION_SPLIT_REGEX)
    .map((part) => cleanLine(part))
    .filter(Boolean);
  if (parts.length < 2) return null;

  const company = parts[0];
  const location = cleanLine(parts.slice(1).join(', '));
  if (!company || !location) return null;
  if (ROLE_HINT_REGEX.test(company) && !COMPANY_HINT_REGEX.test(company)) return null;

  const locationLooksValid =
    /,/.test(location) ||
    /(state|nigeria|india|usa|uk|canada|remote|lagos|abuja|ilorin|oyo)/i.test(location);
  if (!locationLooksValid) return null;

  return { company, location };
};

const normalizeCompanyTextForCompare = (value: string): string =>
  cleanLine(
    value
      .toLowerCase()
      .replace(COMPANY_LOCATION_NORMALIZE_REGEX, ', ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s+/g, ' '),
  );

const isLikelyRoleLine = (line: string): boolean => {
  const text = cleanLine(line);
  if (!text) return false;
  if (detectSectionHeading(text)) return false;
  if (parseLooseDateRange(text).startDate) return false;
  if (isLikelyLocationLine(text)) return false;
  if (/^[o•●*-]\s+/.test(text)) return false;
  if (text.length > 80) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 8) return false;
  if (/[.!?]$/.test(text)) return false;
  if (COMPANY_HINT_REGEX.test(text) && !ROLE_HINT_REGEX.test(text)) return false;
  if (ROLE_HINT_REGEX.test(text)) return true;

  const titleCaseWords = words.filter((word) => /^[A-Z][A-Za-z0-9&'()./-]*$/.test(word)).length;
  return titleCaseWords / words.length >= 0.6;
};

const parseRoleAndCompanyFromCombinedLine = (
  line: string,
): { role: string; company: string } | null => {
  const text = cleanLine(line);
  if (!text) return null;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return null;

  let roleEndIndex = -1;
  for (let index = 0; index < Math.min(words.length - 1, 6); index += 1) {
    const normalizedWord = words[index].toLowerCase().replace(/[^a-z]/g, '');
    if (ROLE_ENDING_TOKENS.has(normalizedWord)) {
      roleEndIndex = index;
    }
  }

  if (roleEndIndex < 1) return null;

  const role = cleanLine(words.slice(0, roleEndIndex + 1).join(' '));
  const company = cleanLine(words.slice(roleEndIndex + 1).join(' '));

  if (!role || !company) return null;
  if (!ROLE_HINT_REGEX.test(role)) return null;
  if (detectSectionHeading(company)) return null;
  if (parseLooseDateRange(company).startDate) return null;

  return { role, company };
};

const isLikelyLocationLine = (line: string): boolean => {
  const text = cleanLine(line);
  if (!text) return false;
  if (parseLooseDateRange(text).startDate) return false;
  if (parseCompanyAndLocationFromLine(text)) return false;
  if (text.length > 80) return false;
  if (/^[A-Za-z .'-]+,\s*[A-Za-z .'-]+$/.test(text)) return true;
  if (/(state|country|nigeria|india|usa|uk|canada|remote)$/i.test(text)) return true;
  return false;
};

const isDateOnlyLine = (line: string): boolean => {
  const text = cleanLine(line);
  const dates = parseLooseDateRange(text);
  if (!dates.startDate) return false;
  const withoutDates = cleanLine(
    text.replace(LOOSE_DATE_RANGE_REGEX, '').replace(/[()|,–—-]/g, ' '),
  );
  return !withoutDates;
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
    if (isLikelyLocationLine(text)) return false;
    if (/^[o•●*-]\s+/.test(text)) return false;
    if (text.length > 90) return false;
    if (text.split(/\s+/).length > 12) return false;
    if (/[.!?]$/.test(text) && !text.includes('|')) return false;
    if (ROLE_HINT_REGEX.test(text) && !COMPANY_HINT_REGEX.test(text)) return false;
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

      const previousLine =
        currentAnchor.index > 0 ? cleanLine(lines[currentAnchor.index - 1]) : '';
      const twoLinesBack =
        currentAnchor.index > 1 ? cleanLine(lines[currentAnchor.index - 2]) : '';
      const previousLineIsCompany = previousLine ? isLikelyCompanyLine(previousLine) : false;
      const twoLinesBackIsCompany = twoLinesBack ? isLikelyCompanyLine(twoLinesBack) : false;

      const companyLine = previousLineIsCompany
        ? previousLine
        : twoLinesBackIsCompany
          ? twoLinesBack
          : '';
      let companyLocation =
        !previousLineIsCompany &&
        twoLinesBackIsCompany &&
        previousLine &&
        isLikelyLocationLine(previousLine)
          ? previousLine
          : '';

      const parsed = parseRoleAndCompany(roleWithoutDates, '');
      let role = companyLine ? roleWithoutDates : parsed.role;
      let company = companyLine || parsed.company;

      let descriptionStart = currentAnchor.index + 1;

      const nextLine = cleanLine(
        (lines[currentAnchor.index + 1] ?? '').replace(/^[o•●*-]\s*/, ''),
      );
      const nextLineCompanyLocation = parseCompanyAndLocationFromLine(nextLine);
      const nextLineIsCompany = nextLine ? isLikelyCompanyLine(nextLine) : false;

      if (isDateOnlyLine(roleLine)) {
        const roleFromTwoLinesBack = cleanLine(twoLinesBack.replace(/^[•●*-]\s*/, ''));
        if (
          !role &&
          roleFromTwoLinesBack &&
          !twoLinesBackIsCompany &&
          isLikelyRoleLine(roleFromTwoLinesBack)
        ) {
          role = roleFromTwoLinesBack;
        }

        if (!role && companyLine) {
          const combined = parseRoleAndCompanyFromCombinedLine(companyLine);
          if (combined) {
            role = combined.role;
            company = combined.company;
          }
        }

        if (!role && previousLine && !previousLineIsCompany && isLikelyRoleLine(previousLine)) {
          role = previousLine;
        }

        if (
          !role &&
          twoLinesBack &&
          !twoLinesBackIsCompany &&
          isLikelyRoleLine(twoLinesBack)
        ) {
          role = twoLinesBack;
        }

        if (!company && nextLineCompanyLocation) {
          company = `${nextLineCompanyLocation.company}, ${nextLineCompanyLocation.location}`;
          descriptionStart = currentAnchor.index + 2;
        } else if (!company && nextLineIsCompany) {
          company = nextLine;
          descriptionStart = currentAnchor.index + 2;
        }
      }

      if (
        (isDateOnlyLine(roleLine) || !role) &&
        nextLine &&
        !detectSectionHeading(nextLine) &&
        !nextLineIsCompany &&
        !nextLineCompanyLocation &&
        !isLikelyLocationLine(nextLine) &&
        isLikelyRoleLine(nextLine)
      ) {
        role = nextLine;
        descriptionStart = currentAnchor.index + 2;
      }

      if ((!role || role === company) && previousLine && isLikelyRoleLine(previousLine)) {
        role = previousLine;
        if (!company && twoLinesBack) {
          company = twoLinesBack;
        }
      }

      const potentialLocationLine = cleanLine(
        (lines[descriptionStart] ?? '').replace(/^[o•●*-]\s*/, ''),
      );
      if (!company && nextLineCompanyLocation) {
        company = `${nextLineCompanyLocation.company}, ${nextLineCompanyLocation.location}`;
        descriptionStart = currentAnchor.index + 2;
        companyLocation = '';
      }

      if (potentialLocationLine && isLikelyLocationLine(potentialLocationLine)) {
        companyLocation = companyLocation || potentialLocationLine;
        descriptionStart += 1;
      }

      if (
        companyLocation &&
        company &&
        !normalizeCompanyTextForCompare(company).includes(
          normalizeCompanyTextForCompare(companyLocation),
        )
      ) {
        company = `${company}, ${companyLocation}`;
      }

      if (company) {
        company = cleanLine(
          company
            .replace(COMPANY_LOCATION_NORMALIZE_REGEX, ', ')
            .replace(/\s*,\s*/g, ', '),
        );
      }

      let descriptionEnd = nextAnchor ? nextAnchor.index - 1 : lines.length - 1;

      if (
        nextAnchor &&
        descriptionEnd >= descriptionStart &&
        isLikelyCompanyLine(lines[descriptionEnd])
      ) {
        descriptionEnd -= 1;
      }

      // FIX: join with \n not space — preserves bullet structure for splitBullets in gemini.ts
      // joining with space collapses "Led team\nBuilt API" into "Led team Built API"
      // which sentence-boundary splitting cannot reliably recover
      const description = lines
        .slice(descriptionStart, descriptionEnd + 1)
        .map((line) => cleanLine(line.replace(/^[o•●*-]\s*/, '')))
        .filter(Boolean)
        .join('\n');

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
        header.replace(LOOSE_DATE_RANGE_REGEX, '').replace(/\s{2,}/g, ' '),
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

    // FIX: join with \n not space — preserves bullet structure
    current.description = current.description
      ? `${current.description}\n${detail}`
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

  const trimSkillsAfterIrrelevantMarkers = (value: string): string => {
    const markerMatches = [
      value.search(/\binterests?\b/i),
      value.search(/\breference(?:s)?\b/i),
    ].filter((index) => index >= 0);

    if (markerMatches.length === 0) return value;
    const cutIndex = Math.min(...markerMatches);
    return value.slice(0, cutIndex).trim();
  };

  const trimmedSectionText = trimSkillsAfterIrrelevantMarkers(sectionText);

  return Array.from(
    new Set(
      trimmedSectionText
        .replace(/\n/g, ',')
        .replace(/^technical skills\s*[:-]?\s*/i, '')
        .split(/[,•·|]/)
        .map((skill) => cleanLine(skill))
        .filter((skill) => skill.length > 1 && skill.length <= 40 && !isNoiseLine(skill)),
    ),
  );
};

const toSkillItems = (value: string): string[] =>
  value
    .split(/[,•·|]/)
    .map((item) => cleanLine(item))
    .filter((item) => item.length > 1 && item.length <= 40 && !isNoiseLine(item));

const GROUPED_SKILL_LINE_REGEX = /^([A-Za-z][A-Za-z0-9 &/+.()-]{1,40})\s*[:\-–—]\s*(.+)$/;

export const parseSkillsSection = (sectionText: string): ResumeSkillsSection => {
  if (!sectionText.trim()) {
    return {
      mode: 'list',
      list: [],
      groups: [],
    };
  }

  const cleaned = sectionText
    .replace(/^technical skills\s*[:-]?\s*/i, '')
    .replace(/\binterests?\b[\s\S]*$/i, '')
    .replace(/\breference(?:s)?\b[\s\S]*$/i, '')
    .trim();
  const lines = splitLines(cleaned);
  const groups: ResumeSkillGroup[] = [];
  let groupedLineCount = 0;
  let activeGroup: ResumeSkillGroup | null = null;

  lines.forEach((line, index) => {
    const normalizedLine = cleanLine(line);
    if (!normalizedLine) return;

    const bulletStripped = normalizedLine.replace(/^[•●*-]\s*/, '');
    const groupedMatch = bulletStripped.match(GROUPED_SKILL_LINE_REGEX);
    if (groupedMatch) {
      const label = cleanLine(groupedMatch[1]);
      const items = toSkillItems(groupedMatch[2]);
      if (label && items.length > 0) {
        activeGroup = {
          id: `skills-group-${groups.length + 1}`,
          label,
          items: Array.from(new Set(items)),
        };
        groups.push(activeGroup);
        groupedLineCount += 1;
      }
      return;
    }

    if (activeGroup) {
      const continuationItems = toSkillItems(bulletStripped);
      if (continuationItems.length > 0) {
        activeGroup.items = Array.from(new Set([...activeGroup.items, ...continuationItems]));
        return;
      }
    }

    if (index > 0 && detectSectionHeading(normalizedLine)) {
      activeGroup = null;
    }
  });

  if (groups.length > 0 && groupedLineCount > 0) {
    const list = Array.from(new Set(groups.flatMap((group) => group.items)));
    return {
      mode: 'grouped',
      list,
      groups,
    };
  }

  return {
    mode: 'list',
    list: parseSkillsText(cleaned),
    groups: [],
  };
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

  const projectBulletPattern = /^(?:[•●*-]|\d+\.)\s+/;
  const isLikelyProjectHeader = (line: string): boolean => {
    const text = cleanLine(line);
    if (!text) return false;

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const endsLikeSentence = /[.!?]$/.test(text);
    const hasDate = Boolean(parseLooseDateRange(text).startDate);
    const hasUrl = Boolean(text.match(URL_REGEX)?.[0]);
    const hasPipe = text.includes('|');
    const hasDashDivider = /\s[-–—]\s/.test(text);
    const isShort = wordCount <= 16 && text.length <= 120;

    if ((hasDate || hasUrl || hasPipe || hasDashDivider) && isShort && !endsLikeSentence) {
      return true;
    }

    const titleLikeWordCount = wordCount > 0 && wordCount <= 8;
    const titleLikeRatio =
      words.filter((word) => /^[A-Z0-9][A-Za-z0-9+/#&().-]*$/.test(word)).length /
      Math.max(wordCount, 1);
    return titleLikeWordCount && titleLikeRatio >= 0.7 && !endsLikeSentence;
  };

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
    const currentHasBody = Boolean(
      current && (current.description || current.link || current.startDate || current.endDate),
    );
    const isBulletEntry = projectBulletPattern.test(line);
    const headerCandidate = isLikelyProjectHeader(line);
    const isNewEntry =
      isBulletEntry || (!isBulletEntry && headerCandidate && (!current || currentHasBody));

    if (isNewEntry) {
      commitCurrent();

      const header = cleanLine(line.replace(projectBulletPattern, ''));
      const { startDate, endDate } = parseLooseDateRange(header);
      const headerWithoutDates = cleanLine(
        header.replace(LOOSE_DATE_RANGE_REGEX, '').replace(/\s{2,}/g, ' '),
      );
      const link = headerWithoutDates.match(URL_REGEX)?.[0] ?? '';
      const name = cleanLine(
        headerWithoutDates.replace(link, '').replace(/^project\s*[:-]\s*/i, ''),
      );

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

    if (current?.link && /^\.?app$/i.test(detail)) {
      current.link = `${current.link}.app`;
      continue;
    }

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

    if (!current.startDate && parseLooseDateRange(detail).startDate) {
      const { startDate, endDate } = parseLooseDateRange(detail);
      current.startDate = startDate;
      current.endDate = endDate;
      continue;
    }

    const urlMatch = detail.match(URL_REGEX)?.[0];
    const isUrlOnly = urlMatch && cleanLine(detail) === urlMatch;

    if (!current.link && urlMatch) {
      current.link = urlMatch;
      const descRemainder = cleanLine(detail.replace(urlMatch, ''));
      if (descRemainder) {
        current.description = current.description
          ? `${current.description} ${descRemainder}`
          : descRemainder;
      } else if (isUrlOnly) {
        continue;
      }
    } else if (isUrlOnly) {
      continue;
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
  const lines = splitLines(sectionText).map((line) =>
    cleanLine(line.replace(/^[•●*-]\s*/, '')),
  );

  return lines
    .filter(Boolean)
    .map((line, index) => {
      const { startDate, endDate } = parseLooseDateRange(line);
      const role = cleanLine(
        line.replace(LOOSE_DATE_RANGE_REGEX, '').replace(/\s{2,}/g, ' '),
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

// FIX: normalise to mixed case before pattern match
// so "JOHN SMITH", "Dr. Jane Doe", "John B. Smith" all parse correctly
const guessName = (lines: string[]): string => {
  for (const line of lines.slice(0, 12)) {
    if (isNoiseLine(line)) continue;

    // Normalise ALL CAPS lines to mixed case so "JOHN SMITH" → "John Smith"
    const normalized = line
      .split(/\s+/)
      .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
      .join(' ');

    const words = normalized.split(' ').filter(Boolean);
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 5 &&
      words.every(
        (word) =>
          // standard name word: "John", "Smith", "Mary-Jane"
          /^[\p{L}][\p{L}'-]+$/u.test(word) ||
          // single initial with dot: "B."
          /^[\p{L}]\.$/u.test(word) ||
          // honorific: "Dr.", "Mr.", "Ms.", "Prof."
          /^(?:Dr|Mr|Mrs|Ms|Prof|Rev|Sir)\.$/.test(word),
      );

    if (looksLikeName) return normalized;
  }

  return '';
};

export const inferNameAndJobTitle = (lines: string[]): { fullName: string; jobTitle: string } => {
  const firstLine = lines[0] ?? '';
  const firstLineMatch = firstLine.match(
    /^([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3})\s*[,|-]\s*(.{2,80})$/,
  );

  if (firstLineMatch) {
    const candidateTitle = cleanLine(firstLineMatch[2]);
    const titleLooksLikeHeading =
      Boolean(detectSectionHeading(candidateTitle)) ||
      /^(career\s+summary|professional\s+summary|summary|profile|objective)$/i.test(
        candidateTitle,
      );

    return {
      fullName: cleanLine(firstLineMatch[1]),
      jobTitle: titleLooksLikeHeading ? '' : candidateTitle,
    };
  }

  const fullName = guessName(lines);
  if (!fullName) return { fullName: '', jobTitle: '' };

  const jobTitle =
    lines.find(
      (line) =>
        line !== fullName &&
        !EMAIL_REGEX.test(line) &&
        !URL_REGEX.test(line) &&
        !line.includes('|') &&
        !detectSectionHeading(line),
    ) ?? '';

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
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('www.') ||
    lower.includes('linkedin.com') ||
    lower.includes('github.com') ||
    lower.includes('gitlab.com') ||
    lower.includes('behance.net') ||
    lower.includes('dribbble.com')
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

export const extractLinks = (lines: string[], email: string): ResumeLinkItem[] => {
  const emailDomain = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
  const preSectionLines: string[] = [];
  for (const line of lines.slice(0, 60)) {
    if (detectSectionHeading(line)) break;
    preSectionLines.push(line);
  }

  const candidates: string[] = [];

  for (const line of preSectionLines) {
    const tokens = line.split(/[\s|╴•·]+/);
    for (const token of tokens) {
      const cleaned = cleanLine(token.replace(/[),.;]+$/g, ''));
      if (!cleaned || EMAIL_REGEX.test(cleaned)) continue;
      if (URL_REGEX.test(cleaned)) {
        candidates.push(cleaned);
      }
    }
  }

  const topRawMatches =
    preSectionLines
      .join(' ')
      .match(
        /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[\w./?%&=-]*)?/g,
      ) ?? [];
  candidates.push(...topRawMatches);

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

export const extractLocation = (
  lines: string[],
  email: string,
  phone: string,
  links: ResumeLinkItem[],
): string => {
  const preSectionLines: string[] = [];
  for (const line of lines.slice(0, 40)) {
    if (detectSectionHeading(line)) break;
    preSectionLines.push(line);
  }

  if (preSectionLines.length === 0) return '';

  const sanitizeContactLine = (value: string): string => {
    let next = value;
    if (email) next = next.replace(email, ' ');
    if (phone) next = next.replace(phone, ' ');
    for (const link of links) {
      next = next.replace(link.url, ' ');
      next = next.replace(link.label, ' ');
    }

    next = next
      .replace(/https?:\/\/\S+/gi, ' ')
      .replace(/\b(?:linkedin|github|portfolio|behance|dribbble)\b/gi, ' ')
      .replace(/[|╴•·]/g, ' ');

    return cleanLine(next.replace(/\s{2,}/g, ' '));
  };

  const looksLikeLocation = (value: string): boolean => {
    const text = cleanLine(value);
    if (!text) return false;
    if (EMAIL_REGEX.test(text) || parseLooseDateRange(text).startDate) return false;
    if (
      /\b(frontend|developer|engineer|manager|intern|writer|specialist|analyst)\b/i.test(text)
    ) {
      return false;
    }
    if (/,/.test(text) && text.length <= 80) return true;
    if (/\b(?:state|nigeria|india|usa|uk|canada|remote)\b/i.test(text)) return true;
    return false;
  };

  const separatorLine = preSectionLines.find((line) => /[|╴•·]/.test(line));
  if (separatorLine) {
    const candidate = sanitizeContactLine(separatorLine);
    if (looksLikeLocation(candidate)) return candidate;
  }

  const standaloneLocation = preSectionLines.find((line) => looksLikeLocation(line));
  return standaloneLocation ? cleanLine(standaloneLocation) : '';
};

export const toSuggestedTitle = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const cleaned = withoutExtension.replace(/[_-]+/g, ' ').trim();
  return cleaned || 'Imported Resume';
};