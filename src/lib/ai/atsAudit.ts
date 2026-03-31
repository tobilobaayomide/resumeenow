import type {
  ResumeData,
  ResumeExperienceItem,
} from '../../domain/resume/types.js';

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const FUTURE_DATE_WARNING_PATTERN =
  /\bfuture(?:[-\s]+dated?|[-\s]+employment)?\b|\bemployment date\b/i;

const normalizeDateToken = (value: string) =>
  value.trim().replace(/\.+$/g, '').replace(/\s+/g, ' ');

const isPresentToken = (value: string) => /^(present|current|now|ongoing)$/i.test(value.trim());

const parseResumeDateToken = (
  value: string,
  boundary: 'start' | 'end',
): Date | null => {
  const normalized = normalizeDateToken(value);
  if (!normalized || isPresentToken(normalized)) {
    return null;
  }

  const yearOnlyMatch = normalized.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const year = Number(yearOnlyMatch[1]);
    return boundary === 'start'
      ? new Date(Date.UTC(year, 0, 1))
      : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  }

  const monthYearMatch = normalized.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!monthYearMatch) {
    return null;
  }

  const month = MONTH_INDEX[monthYearMatch[1].toLowerCase()];
  const year = Number(monthYearMatch[2]);

  if (month == null) {
    return null;
  }

  return boundary === 'start'
    ? new Date(Date.UTC(year, month, 1))
    : new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
};

const isExperienceFutureDated = (
  item: ResumeExperienceItem,
  now: Date,
) => {
  const nowMs = now.getTime();
  const startDate = parseResumeDateToken(item.startDate, 'start');
  const endDate = parseResumeDateToken(item.endDate, 'end');

  return (
    (startDate != null && startDate.getTime() > nowMs) ||
    (endDate != null && endDate.getTime() > nowMs)
  );
};

export const formatAtsAuditReferenceDate = (now = new Date()): string =>
  now.toISOString().slice(0, 10);

export const resumeHasFutureEmploymentDates = (
  resumeData: ResumeData,
  now = new Date(),
): boolean => resumeData.experience.some((item) => isExperienceFutureDated(item, now));

type AtsAuditLike = {
  suggestions: string[];
  criticalMistake?: {
    title: string;
    description: string;
    fix: string;
  };
};

export const sanitizeAtsAuditResult = <T extends AtsAuditLike>(
  result: T,
  resumeData: ResumeData,
  now = new Date(),
): T => {
  const criticalMistake = result.criticalMistake;

  if (!criticalMistake) {
    return result;
  }

  const criticalMistakeText = [
    criticalMistake.title,
    criticalMistake.description,
    criticalMistake.fix,
  ].join(' ');

  if (
    FUTURE_DATE_WARNING_PATTERN.test(criticalMistakeText) &&
    !resumeHasFutureEmploymentDates(resumeData, now)
  ) {
    return {
      ...result,
      criticalMistake: undefined,
      suggestions: result.suggestions.filter(
        (suggestion: string) => !FUTURE_DATE_WARNING_PATTERN.test(suggestion),
      ),
    };
  }

  return result;
};
