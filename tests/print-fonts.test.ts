import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRINT_FONT_LOADS,
  ensurePrintFontsReady,
} from '../src/lib/builder/printFonts.js';

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

  assert.equal(loadCalls, PRINT_FONT_LOADS.length);
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
