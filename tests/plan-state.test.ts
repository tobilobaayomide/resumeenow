import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultPlanSnapshot,
  getPlanDailyCreditLimit,
  resolvePlanState,
} from '../src/lib/queries/planState.js';

test('resolvePlanState keeps signed-out users on the default free snapshot', () => {
  const resolved = resolvePlanState({
    userId: null,
    snapshot: undefined,
    isPending: false,
    isError: false,
  });

  assert.deepEqual(resolved, {
    planStatus: 'signed_out',
    snapshot: getDefaultPlanSnapshot(),
  });
});

test('resolvePlanState keeps the last known snapshot when one exists', () => {
  const cachedSnapshot = {
    tier: 'pro' as const,
    usedCredits: 12,
    dynamicFreeLimit: 5,
  };

  const resolved = resolvePlanState({
    userId: 'user-123',
    snapshot: cachedSnapshot,
    isPending: false,
    isError: true,
  });

  assert.deepEqual(resolved, {
    planStatus: 'ready',
    snapshot: cachedSnapshot,
  });
});

test('resolvePlanState marks authenticated query failures as unavailable', () => {
  const resolved = resolvePlanState({
    userId: 'user-123',
    snapshot: undefined,
    isPending: false,
    isError: true,
  });

  assert.equal(resolved.planStatus, 'unavailable');
  assert.deepEqual(resolved.snapshot, getDefaultPlanSnapshot());
});

test('resolvePlanState keeps authenticated queries in loading until data or error arrives', () => {
  const resolved = resolvePlanState({
    userId: 'user-123',
    snapshot: undefined,
    isPending: true,
    isError: false,
  });

  assert.equal(resolved.planStatus, 'loading');
  assert.deepEqual(resolved.snapshot, getDefaultPlanSnapshot());
});

test('getPlanDailyCreditLimit matches the product plan rules', () => {
  assert.equal(
    getPlanDailyCreditLimit({
      tier: 'free',
      usedCredits: 0,
      dynamicFreeLimit: 5,
    }),
    5,
  );

  assert.equal(
    getPlanDailyCreditLimit({
      tier: 'pro',
      usedCredits: 24,
      dynamicFreeLimit: 5,
    }),
    100,
  );
});
