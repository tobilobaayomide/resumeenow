import test from 'node:test';
import assert from 'node:assert/strict';
import { PREVIEW_RESUME_DATA } from '../src/domain/resume/fixtures/previewResume.js';
import {
  applyAllAtsImprovements,
  applyAtsImprovement,
  applyAtsKeywords,
} from '../src/lib/ai/atsAuditApply.js';

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

test('applyAtsKeywords adds a selected keyword and clears it from missing suggestions', () => {
  const result = createAuditResult({
    matchedKeywords: ['Figma'],
    missingKeywords: ['React', 'TypeScript'],
    keywordDensity: [
      { keyword: 'React', count: 0, importance: 10 },
      { keyword: 'TypeScript', count: 0, importance: 9 },
    ],
  });

  const outcome = applyAtsKeywords(PREVIEW_RESUME_DATA, result, ['React']);

  assert.equal(outcome.appliedKeywords.length, 1);
  assert.equal(outcome.appliedKeywords[0], 'React');
  assert.equal(outcome.resolvedKeywords.length, 1);
  assert.equal(outcome.resolvedKeywords[0], 'React');
  assert.ok(outcome.nextResumeData.skills.list.includes('React'));
  assert.deepEqual(outcome.nextResult.missingKeywords, ['TypeScript']);
  assert.deepEqual(outcome.nextResult.matchedKeywords, ['Figma', 'React']);
  assert.deepEqual(outcome.nextResult.keywordDensity, [
    { keyword: 'React', count: 1, importance: 10 },
    { keyword: 'TypeScript', count: 0, importance: 9 },
  ]);
});

test('applyAtsKeywords clears stale keyword suggestions that are already covered', () => {
  const resumeData = {
    ...PREVIEW_RESUME_DATA,
    skills: {
      ...PREVIEW_RESUME_DATA.skills,
      list: [...PREVIEW_RESUME_DATA.skills.list, 'React'],
    },
  };
  const result = createAuditResult({
    missingKeywords: ['React'],
  });

  const outcome = applyAtsKeywords(resumeData, result, ['React']);

  assert.deepEqual(outcome.appliedKeywords, []);
  assert.deepEqual(outcome.resolvedKeywords, ['React']);
  assert.equal(
    outcome.nextResumeData.skills.list.filter((skill: string) => skill === 'React').length,
    1,
  );
  assert.deepEqual(outcome.nextResult.missingKeywords, []);
  assert.deepEqual(outcome.nextResult.matchedKeywords, ['React']);
});

test('applyAtsImprovement updates the resume and removes only the applied suggestion', () => {
  const improvement = {
    id: PREVIEW_RESUME_DATA.experience[0].id,
    type: 'bullet' as const,
    current:
      'Led end-to-end redesign of onboarding flow, improving activation by 31%.',
    better:
      'Led end-to-end redesign of onboarding flow, increasing activation by 31% across the first-run experience.',
  };
  const result = createAuditResult({
    improvements: [
      improvement,
      {
        type: 'skill',
        current: 'Figma',
        better: 'Figma (Advanced Prototyping)',
      },
    ],
  });

  const outcome = applyAtsImprovement(PREVIEW_RESUME_DATA, result, improvement);

  assert.equal(outcome.applied, true);
  assert.match(
    outcome.nextResumeData.experience[0].description,
    /increasing activation by 31% across the first-run experience\./,
  );
  assert.deepEqual(outcome.nextResult.improvements, [
    {
      type: 'skill',
      current: 'Figma',
      better: 'Figma (Advanced Prototyping)',
    },
  ]);
});

test('applyAllAtsImprovements leaves unmatched suggestions in place', () => {
  const result = createAuditResult({
    improvements: [
      {
        id: PREVIEW_RESUME_DATA.experience[0].id,
        type: 'bullet',
        current: 'Missing bullet text',
        better: 'Rewritten bullet',
      },
      {
        type: 'skill',
        current: 'Figma',
        better: 'Figma (Advanced Prototyping)',
      },
    ],
  });

  const outcome = applyAllAtsImprovements(PREVIEW_RESUME_DATA, result);

  assert.equal(outcome.appliedCount, 1);
  assert.ok(outcome.nextResumeData.skills.list.includes('Figma (Advanced Prototyping)'));
  assert.deepEqual(outcome.nextResult.improvements, [
    {
      id: PREVIEW_RESUME_DATA.experience[0].id,
      type: 'bullet',
      current: 'Missing bullet text',
      better: 'Rewritten bullet',
    },
  ]);
});
