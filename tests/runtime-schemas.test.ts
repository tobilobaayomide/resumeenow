import test from 'node:test';
import assert from 'node:assert/strict';
import { PREVIEW_RESUME_DATA } from '../src/domain/resume/fixtures/previewResume.js';
import { DEFAULT_TEMPLATE_ID } from '../src/domain/templates/types.js';
import { parseExportPayload } from '../src/schemas/builder/exportPayload.js';
import { parseBuilderPersistedState } from '../src/schemas/builder/persistedState.js';
import {
  parseResumeData,
  parseTemplateId,
  safeParseResumeRecord,
} from '../src/schemas/domain/resume.js';
import {
  BUILDER_PERSIST_VERSION,
  getDefaultBuilderPersistedState,
  migrateBuilderPersistedState,
} from '../src/store/builderPersistence.js';
import {
  reportRuntimeValidationIssue,
  resetRuntimeValidationReports,
} from '../src/lib/observability/runtimeValidation.js';

const captureConsoleWarn = <T>(run: () => T): { result: T; calls: unknown[][] } => {
  const originalWarn = console.warn;
  const calls: unknown[][] = [];

  console.warn = (...args: unknown[]) => {
    calls.push(args);
  };

  try {
    return { result: run(), calls };
  } finally {
    console.warn = originalWarn;
  }
};

test.beforeEach(() => {
  resetRuntimeValidationReports();
});

test('parseBuilderPersistedState accepts a valid persisted draft', () => {
  const parsed = parseBuilderPersistedState({
    resumeData: PREVIEW_RESUME_DATA,
    templateId: 'silicon',
    title: 'Senior Product Designer',
  });

  assert.deepEqual(parsed, {
    resumeData: PREVIEW_RESUME_DATA,
    templateId: 'silicon',
    title: 'Senior Product Designer',
  });
});

test('parseBuilderPersistedState rejects missing required draft fields', () => {
  assert.equal(
    parseBuilderPersistedState({
      templateId: 'silicon',
      title: 'Missing resume',
    }),
    null,
  );

  assert.equal(
    parseBuilderPersistedState({
      resumeData: PREVIEW_RESUME_DATA,
      templateId: null,
      title: 'Missing template',
    }),
    null,
  );

  assert.equal(
    parseBuilderPersistedState({
      resumeData: {},
      templateId: 'executive',
      title: 'Malformed resume',
    }),
    null,
  );
});

test('parseExportPayload accepts a valid payload', () => {
  const parsed = parseExportPayload({
    data: PREVIEW_RESUME_DATA,
    templateId: 'ats',
    fileName: 'Alex Morgan Resume',
  });

  assert.deepEqual(parsed, {
    data: PREVIEW_RESUME_DATA,
    templateId: 'ats',
    fileName: 'Alex Morgan Resume',
  });
});

test('parseExportPayload rejects missing required fields', () => {
  assert.throws(() =>
    parseExportPayload({
      templateId: 'executive',
    }),
  );

  assert.throws(() =>
    parseExportPayload({
      data: PREVIEW_RESUME_DATA,
    }),
  );

  assert.throws(() =>
    parseExportPayload({
      data: {},
      templateId: 'executive',
    }),
  );

  assert.throws(() =>
    parseExportPayload({
      data: PREVIEW_RESUME_DATA,
      templateId: 'not-a-template',
    }),
  );
});

test('parseResumeData preserves supported legacy normalization', () => {
  const parsed = parseResumeData({
    personalInfo: {
      fullName: 'Alex Morgan',
    },
    language: ['English (Native)', 'English (Native)', 'Spanish (Professional)'],
    experience: [
      {
        id: 'exp-legacy',
        role: 'Volunteer Mentor',
        company: 'Volunteering',
        date: '2024',
        description: 'Coached junior designers.',
      },
      {
        id: 'award-legacy',
        role: 'Designer of the Year',
        company: 'Awards & Honours',
        date: '2023',
        description: '',
      },
    ],
  });

  assert.deepEqual(parsed.volunteering, [
    {
      id: 'exp-legacy',
      role: 'Volunteer Mentor',
      company: 'Volunteering',
      startDate: '2024',
      endDate: '',
      description: 'Coached junior designers.',
    },
  ]);
  assert.deepEqual(parsed.achievements, ['Designer of the Year']);
  assert.deepEqual(parsed.languages, [
    'English (Native)',
    'Spanish (Professional)',
  ]);
});

test('parseTemplateId keeps compatibility by falling back to the default template', () => {
  assert.equal(parseTemplateId('not-a-template'), DEFAULT_TEMPLATE_ID);
});

test('safeParseResumeRecord drops malformed rows instead of fabricating identifiers', () => {
  const malformed = safeParseResumeRecord({
    title: 'Incomplete row',
    template_id: 'mono',
    content: PREVIEW_RESUME_DATA,
    updated_at: new Date().toISOString(),
  });

  assert.deepEqual(malformed, { success: false });

  const normalized = safeParseResumeRecord({
    id: 'resume-1',
    user_id: 'user-1',
    content: PREVIEW_RESUME_DATA,
    updated_at: '2025-01-01T00:00:00.000Z',
  });

  assert.equal(normalized.success, true);
  if (normalized.success) {
    assert.equal(normalized.data.title, 'Untitled Resume');
    assert.equal(normalized.data.template_id, DEFAULT_TEMPLATE_ID);
  }
});

test('migrateBuilderPersistedState upgrades valid legacy builder state', () => {
  const migrated = migrateBuilderPersistedState(
    {
      resumeData: PREVIEW_RESUME_DATA,
      templateId: 'mono',
      title: 'Legacy Draft',
    },
    BUILDER_PERSIST_VERSION - 1,
  );

  assert.deepEqual(migrated, {
    resumeData: PREVIEW_RESUME_DATA,
    templateId: 'mono',
    title: 'Legacy Draft',
  });
});

test('migrateBuilderPersistedState resets invalid legacy builder state to safe defaults', () => {
  const { result: migrated, calls } = captureConsoleWarn(() =>
    migrateBuilderPersistedState(
      {
        resumeData: PREVIEW_RESUME_DATA,
        templateId: null,
      },
      BUILDER_PERSIST_VERSION - 1,
    ),
  );

  assert.deepEqual(migrated, getDefaultBuilderPersistedState());
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.[0],
    '[RuntimeValidation] builder.persist: Reset invalid persisted builder state during migration.',
  );
});

test('migrateBuilderPersistedState discards unsupported newer versions', () => {
  const { result: migrated, calls } = captureConsoleWarn(() =>
    migrateBuilderPersistedState(
      {
        resumeData: PREVIEW_RESUME_DATA,
        templateId: 'silicon',
        title: 'Future Draft',
      },
      BUILDER_PERSIST_VERSION + 1,
    ),
  );

  assert.deepEqual(migrated, getDefaultBuilderPersistedState());
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.[0],
    '[RuntimeValidation] builder.persist: Discarded persisted builder state from an unsupported future version.',
  );
});

test('reportRuntimeValidationIssue logs once per key by default', () => {
  const { calls } = captureConsoleWarn(() => {
    reportRuntimeValidationIssue({
      key: 'runtime-validation:once',
      source: 'test.source',
      action: 'Reported a deduplicated warning.',
      details: { scope: 'once' },
    });
    reportRuntimeValidationIssue({
      key: 'runtime-validation:once',
      source: 'test.source',
      action: 'Reported a deduplicated warning.',
      details: { scope: 'once' },
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.[0],
    '[RuntimeValidation] test.source: Reported a deduplicated warning.',
  );
});

test('reportRuntimeValidationIssue can log repeatedly when deduping is disabled', () => {
  const { calls } = captureConsoleWarn(() => {
    reportRuntimeValidationIssue({
      key: 'runtime-validation:repeat',
      source: 'test.source',
      action: 'Reported a repeated warning.',
      once: false,
    });
    reportRuntimeValidationIssue({
      key: 'runtime-validation:repeat',
      source: 'test.source',
      action: 'Reported a repeated warning.',
      once: false,
    });
  });

  assert.equal(calls.length, 2);
});
