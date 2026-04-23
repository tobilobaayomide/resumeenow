import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GeminiProxyError,
  getGeminiRetryDelayMs,
  shouldRetryGeminiError,
} from '../src/lib/ai/geminiRetry.js';

test('shouldRetryGeminiError treats Gemini high-demand overloads as retryable', () => {
  const error = new GeminiProxyError(
    'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
    {
      error: 'AI_PROVIDER_ERROR',
      providerStatus: 429,
      status: 429,
    },
  );

  assert.equal(shouldRetryGeminiError(error), true);
});

test('shouldRetryGeminiError does not retry local concurrency failures', () => {
  const error = new GeminiProxyError(
    'Another AI request is already running. Please wait for it to finish.',
    {
      error: 'CONCURRENT_LIMIT',
      status: 429,
    },
  );

  assert.equal(shouldRetryGeminiError(error), false);
});

test('getGeminiRetryDelayMs uses provider retry-after hints and the correct first backoff slot', () => {
  assert.equal(
    getGeminiRetryDelayMs(
      new GeminiProxyError('Slow down.', {
        error: 'RATE_LIMITED',
        retryAfterSeconds: 7,
        status: 429,
      }),
      2,
    ),
    7000,
  );

  assert.equal(getGeminiRetryDelayMs(new Error('429'), 2), 5000);
  assert.equal(getGeminiRetryDelayMs(new Error('429'), 1), 15000);
});
