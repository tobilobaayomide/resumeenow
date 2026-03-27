import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestScheduler, createTimedLruCache } from '../src/lib/ai/requestControl.js';

test('createTimedLruCache expires stale entries and evicts the least recently used item', () => {
  let now = 0;
  const cache = createTimedLruCache<string>({
    ttlMs: 100,
    maxEntries: 2,
    now: () => now,
  });

  cache.set('a', 'first');
  now = 10;
  cache.set('b', 'second');
  assert.equal(cache.get('a'), 'first');

  now = 20;
  cache.set('c', 'third');

  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 'first');
  assert.equal(cache.get('c'), 'third');

  now = 130;
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.size(), 0);
});

test('createRequestScheduler queues work instead of rejecting overflow', async () => {
  const scheduler = createRequestScheduler(1);
  const order: string[] = [];
  let releaseFirstTask: (() => void) | undefined;

  const firstTask = scheduler.run(async () => {
    order.push('first:start');
    await new Promise<void>((resolve) => {
      releaseFirstTask = () => resolve();
    });
    order.push('first:end');
  });

  const secondTask = scheduler.run(async () => {
    order.push('second:start');
    order.push('second:end');
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(order, ['first:start']);
  assert.equal(scheduler.getActiveCount(), 1);
  assert.equal(scheduler.getPendingCount(), 1);

  const release = releaseFirstTask;
  assert.ok(release);
  release();
  await Promise.all([firstTask, secondTask]);

  assert.deepEqual(order, ['first:start', 'first:end', 'second:start', 'second:end']);
  assert.equal(scheduler.getActiveCount(), 0);
  assert.equal(scheduler.getPendingCount(), 0);
});
