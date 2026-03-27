import test from 'node:test';
import assert from 'node:assert/strict';
import { PREVIEW_RESUME_DATA } from '../src/domain/resume/fixtures/previewResume.js';
import { resolveResumePrintPayload } from '../src/lib/builder/printPayload.js';

test('resolveResumePrintPayload returns normalized payload for valid export data', () => {
  const resolved = resolveResumePrintPayload({
    data: PREVIEW_RESUME_DATA,
    templateId: 'ats',
    fileName: '  Alex Morgan Resume  ',
  });

  assert.equal(resolved.error, '');
  assert.deepEqual(resolved.payload, {
    data: PREVIEW_RESUME_DATA,
    templateId: 'ats',
    fileName: 'Alex Morgan Resume',
  });
});

test('resolveResumePrintPayload falls back to a default file name', () => {
  const resolved = resolveResumePrintPayload({
    data: PREVIEW_RESUME_DATA,
    templateId: 'executive',
  });

  assert.equal(resolved.error, '');
  assert.equal(resolved.payload?.fileName, 'Resume');
});

test('resolveResumePrintPayload reports missing payloads explicitly', () => {
  assert.deepEqual(resolveResumePrintPayload(null), {
    payload: null,
    error: 'Missing export payload.',
  });
});

test('resolveResumePrintPayload rejects malformed payloads', () => {
  assert.deepEqual(
    resolveResumePrintPayload({
      data: {},
      templateId: 'executive',
    }),
    {
      payload: null,
      error: 'Could not load resume export.',
    },
  );
});
