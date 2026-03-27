import test from 'node:test';
import assert from 'node:assert/strict';
import { getResumeCollectionViewState } from '../src/lib/dashboard/resumeCollectionState.js';

test('getResumeCollectionViewState prioritizes loading first', () => {
  assert.equal(
    getResumeCollectionViewState({
      isLoading: true,
      error: 'Failed to load resumes.',
      totalCount: 0,
      filteredCount: 0,
    }),
    'loading',
  );
});

test('getResumeCollectionViewState prioritizes error over empty state', () => {
  assert.equal(
    getResumeCollectionViewState({
      isLoading: false,
      error: 'Failed to load resumes.',
      totalCount: 0,
      filteredCount: 0,
    }),
    'error',
  );
});

test('getResumeCollectionViewState distinguishes empty and no-match states', () => {
  assert.equal(
    getResumeCollectionViewState({
      isLoading: false,
      error: null,
      totalCount: 0,
      filteredCount: 0,
    }),
    'empty',
  );

  assert.equal(
    getResumeCollectionViewState({
      isLoading: false,
      error: null,
      totalCount: 3,
      filteredCount: 0,
    }),
    'no_matches',
  );
});

test('getResumeCollectionViewState returns ready when resumes are available', () => {
  assert.equal(
    getResumeCollectionViewState({
      isLoading: false,
      error: null,
      totalCount: 3,
      filteredCount: 2,
    }),
    'ready',
  );
});
