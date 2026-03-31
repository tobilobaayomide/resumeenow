import test from 'node:test';
import assert from 'node:assert/strict';
import { PREVIEW_RESUME_DATA } from '../src/domain/resume/fixtures/previewResume.js';
import {
  formatAtsAuditReferenceDate,
  resumeHasFutureEmploymentDates,
  sanitizeAtsAuditResult,
} from '../src/lib/ai/atsAudit.js';

const createAuditResult = (
  overrides: Record<string, unknown> = {},
) => ({
  score: 82,
  keywordCoverage: 70,
  matchedCount: 7,
  keywordCount: 10,
  quantifiedBulletCount: 2,
  breakdown: [],
  matchedKeywords: [],
  missingKeywords: [],
  suggestions: [],
  keywordDensity: [],
  improvements: [],
  criticalMistake: undefined,
  ...overrides,
});

test('formatAtsAuditReferenceDate uses an ISO calendar date', () => {
  assert.equal(
    formatAtsAuditReferenceDate(new Date('2026-03-31T14:22:00.000Z')),
    '2026-03-31',
  );
});

test('resumeHasFutureEmploymentDates ignores completed roles in prior months', () => {
  const resumeData = {
    ...PREVIEW_RESUME_DATA,
    experience: [
      {
        ...PREVIEW_RESUME_DATA.experience[0],
        startDate: 'FEB 2025',
        endDate: 'DEC 2025',
      },
    ],
  };

  assert.equal(
    resumeHasFutureEmploymentDates(
      resumeData,
      new Date('2026-03-31T00:00:00.000Z'),
    ),
    false,
  );
});

test('resumeHasFutureEmploymentDates flags roles with future end dates', () => {
  const resumeData = {
    ...PREVIEW_RESUME_DATA,
    experience: [
      {
        ...PREVIEW_RESUME_DATA.experience[0],
        startDate: 'FEB 2026',
        endDate: 'DEC 2026',
      },
    ],
  };

  assert.equal(
    resumeHasFutureEmploymentDates(
      resumeData,
      new Date('2026-03-31T00:00:00.000Z'),
    ),
    true,
  );
});

test('sanitizeAtsAuditResult removes false future-employment warnings', () => {
  const resumeData = {
    ...PREVIEW_RESUME_DATA,
    experience: [
      {
        ...PREVIEW_RESUME_DATA.experience[0],
        role: 'Frontend Engineer',
        company: 'Technocrat IT',
        startDate: 'FEB 2025',
        endDate: 'DEC 2025',
      },
    ],
  };

  const result = sanitizeAtsAuditResult(
    createAuditResult({
      suggestions: [
        'Fix the future employment date on Technocrat IT.',
        'Add more quantified impact.',
      ],
      criticalMistake: {
        title: 'Future Employment Date',
        description:
          'The experience entry lists dates FEB 2025 - DEC 2025, indicating future employment.',
        fix: 'Correct the future date so the role does not look fabricated.',
      },
    }),
    resumeData,
    new Date('2026-03-31T00:00:00.000Z'),
  );

  assert.equal(result.criticalMistake, undefined);
  assert.deepEqual(result.suggestions, ['Add more quantified impact.']);
});
