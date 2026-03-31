import test from 'node:test';
import assert from 'node:assert/strict';
import { ensurePrintFontsReady } from '../src/lib/builder/printFonts.js';

test('ensurePrintFontsReady resolves after fonts finish loading', async () => {
  let loadCalls = 0;

  await ensurePrintFontsReady(
    {
      fonts: {
        load: async () => {
          loadCalls += 1;
        },
        ready: Promise.resolve(),
      },
    },
    50,
  );

  assert.equal(loadCalls, 9);
});

test('ensurePrintFontsReady times out instead of hanging indefinitely', async () => {
  const startedAt = Date.now();

  await ensurePrintFontsReady(
    {
      fonts: {
        load: async () => new Promise(() => {}),
        ready: new Promise(() => {}),
      },
    },
    25,
  );

  const elapsedMs = Date.now() - startedAt;
  assert.ok(elapsedMs < 250, `Expected timeout fallback, got ${elapsedMs}ms`);
});
