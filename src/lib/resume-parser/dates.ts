import {
  RESUME_PARSER_DATE_RANGE_REGEX as DATE_RANGE_REGEX,
  RESUME_PARSER_LOOSE_DATE_RANGE_REGEX as LOOSE_DATE_RANGE_REGEX,
} from '../../data/parser';
import { cleanLine } from './text.js';

export { LOOSE_DATE_RANGE_REGEX };

export const parseDateRange = (value: string): { startDate: string; endDate: string } => {
  const match = value.match(DATE_RANGE_REGEX);
  if (!match) return { startDate: '', endDate: '' };

  return {
    startDate: cleanLine(match[1]),
    endDate: cleanLine(match[2]),
  };
};

const normalizeDateToken = (value: string): string => cleanLine(value.replace(/\.$/, ''));

export const parseLooseDateRange = (value: string): { startDate: string; endDate: string } => {
  const direct = parseDateRange(value);
  if (direct.startDate || direct.endDate) return direct;

  const match = value.match(LOOSE_DATE_RANGE_REGEX);
  if (!match) return { startDate: '', endDate: '' };

  return {
    startDate: normalizeDateToken(match[1]),
    endDate: normalizeDateToken(match[2]),
  };
};
