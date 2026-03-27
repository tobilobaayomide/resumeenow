import {
  DEFAULT_TEMPLATE_ID,
  INITIAL_RESUME_DATA,
} from '../types/resume.js';
import {
  parseBuilderPersistedState,
  type BuilderPersistedState,
} from '../schemas/builder/persistedState.js';
import { reportRuntimeValidationIssue } from '../lib/observability/runtimeValidation.js';

export const BUILDER_STORAGE_NAME = 'resumeenow:builder';
export const BUILDER_PERSIST_VERSION = 1;

const DEFAULT_BUILDER_TITLE = 'Untitled Resume';

export const getDefaultBuilderPersistedState = (): BuilderPersistedState => ({
  resumeData: INITIAL_RESUME_DATA,
  templateId: DEFAULT_TEMPLATE_ID,
  title: DEFAULT_BUILDER_TITLE,
});

export const migrateBuilderPersistedState = (
  persistedState: unknown,
  version: number,
): BuilderPersistedState => {
  if (version > BUILDER_PERSIST_VERSION) {
    reportRuntimeValidationIssue({
      key: `builder.persist.unsupported-version:${version}`,
      source: 'builder.persist',
      action: 'Discarded persisted builder state from an unsupported future version.',
      details: {
        storedVersion: version,
        supportedVersion: BUILDER_PERSIST_VERSION,
      },
    });
    return getDefaultBuilderPersistedState();
  }

  const parsedPersistedState = parseBuilderPersistedState(persistedState);

  if (!parsedPersistedState) {
    reportRuntimeValidationIssue({
      key: `builder.persist.invalid-version:${version}`,
      source: 'builder.persist',
      action: 'Reset invalid persisted builder state during migration.',
      details: {
        storedVersion: version,
        supportedVersion: BUILDER_PERSIST_VERSION,
      },
    });
    return getDefaultBuilderPersistedState();
  }

  return parsedPersistedState;
};
