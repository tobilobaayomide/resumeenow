import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPdfExportExtraHeaders,
  resolvePdfExportAppOrigin,
} from '../api/export-pdf.js';

test('resolvePdfExportAppOrigin ignores request host headers and uses configured origins', () => {
  const origin = resolvePdfExportAppOrigin(
    {
      headers: {
        host: 'attacker-controlled.example.com',
        'x-forwarded-host': 'resumeenow-git-feature-123.vercel.app',
        'x-forwarded-proto': 'https',
      },
    },
    {
      APP_URL: 'https://resumeenow.xyz',
    },
  );

  assert.equal(origin, 'https://resumeenow.xyz');
});

test('resolvePdfExportAppOrigin falls back to configured origins when request headers are unavailable', () => {
  const origin = resolvePdfExportAppOrigin(
    {
      headers: {},
    },
    {
      SITE_URL: 'https://resumeenow.xyz',
    },
  );

  assert.equal(origin, 'https://resumeenow.xyz');
});

test('resolvePdfExportAppOrigin uses configured localhost origins for development', () => {
  const origin = resolvePdfExportAppOrigin(
    {
      headers: {
        host: 'resumeenow.xyz',
      },
    },
    {
      APP_URL: 'http://localhost:3000',
    },
  );

  assert.equal(origin, 'http://localhost:3000');
});

test('getPdfExportExtraHeaders returns bypass headers for protected Vercel deployments', () => {
  assert.deepEqual(
    getPdfExportExtraHeaders('https://resumeenow-git-feature-123.vercel.app', {
      VERCEL_AUTOMATION_BYPASS_SECRET: 'secret-value',
    }),
    {
      'x-vercel-protection-bypass': 'secret-value',
      'x-vercel-set-bypass-cookie': 'true',
    },
  );
});

test('getPdfExportExtraHeaders does not add bypass headers for localhost', () => {
  assert.equal(
    getPdfExportExtraHeaders('http://localhost:3000', {
      VERCEL_AUTOMATION_BYPASS_SECRET: 'secret-value',
    }),
    null,
  );
});
