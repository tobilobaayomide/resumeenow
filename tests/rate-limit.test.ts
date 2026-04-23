import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRateLimitKey,
  enforceInMemoryRateLimit,
  getClientIpFromHeaderRecord,
  RateLimitError,
  resetInMemoryRateLimits,
} from '../api/_lib/rate-limit.js';

test.beforeEach(() => {
  resetInMemoryRateLimits();
});

test('getClientIpFromHeaderRecord resolves the first forwarded IP', () => {
  const ipAddress = getClientIpFromHeaderRecord({
    'x-forwarded-for': '203.0.113.10, 10.0.0.2',
  });

  assert.equal(ipAddress, '203.0.113.10');
});

test('buildRateLimitKey combines namespace, user, and ip address', () => {
  assert.equal(
    buildRateLimitKey({
      namespace: 'pdf-export',
      userId: 'user-123',
      ipAddress: '203.0.113.10',
    }),
    'pdf-export:user-123:203.0.113.10',
  );
});

test('enforceInMemoryRateLimit throws after the fixed-window limit is reached', () => {
  enforceInMemoryRateLimit({
    key: 'resume-parse:user-1:203.0.113.10',
    limit: 2,
    windowMs: 1_000,
    now: 100,
  });
  enforceInMemoryRateLimit({
    key: 'resume-parse:user-1:203.0.113.10',
    limit: 2,
    windowMs: 1_000,
    now: 200,
  });

  assert.throws(
    () =>
      enforceInMemoryRateLimit({
        key: 'resume-parse:user-1:203.0.113.10',
        limit: 2,
        windowMs: 1_000,
        now: 300,
      }),
    (error: unknown) => {
      assert.ok(error instanceof RateLimitError);
      assert.equal(error.status, 429);
      assert.equal(error.retryAfterSeconds, 1);
      return true;
    },
  );
});

test('enforceInMemoryRateLimit resets after the window expires', () => {
  enforceInMemoryRateLimit({
    key: 'pdf-export:user-1:203.0.113.10',
    limit: 1,
    windowMs: 1_000,
    now: 100,
  });

  assert.doesNotThrow(() =>
    enforceInMemoryRateLimit({
      key: 'pdf-export:user-1:203.0.113.10',
      limit: 1,
      windowMs: 1_000,
      now: 1_200,
    }),
  );
});
