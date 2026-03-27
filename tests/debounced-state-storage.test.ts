import test from 'node:test';
import assert from 'node:assert/strict';
import { createDebouncedStateStorage } from '../src/lib/storage/debouncedStateStorage.js';

const createMemoryStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => {
      values.set(name, value);
    },
    removeItem: (name: string) => {
      values.delete(name);
    },
  };
};

test('createDebouncedStateStorage flushes pending writes immediately when requested', () => {
  const storage = createMemoryStorage();
  const debouncedStorage = createDebouncedStateStorage({
    delayMs: 1000,
    storage,
  });

  debouncedStorage.setItem('builder', '{"title":"Draft"}');

  assert.equal(storage.getItem('builder'), null);
  assert.equal(debouncedStorage.hasPendingWrite('builder'), true);
  assert.equal(debouncedStorage.getItem('builder'), '{"title":"Draft"}');

  debouncedStorage.flushAll();

  assert.equal(storage.getItem('builder'), '{"title":"Draft"}');
  assert.equal(debouncedStorage.hasPendingWrite(), false);
});

test('createDebouncedStateStorage cancels a pending write when the key is removed', () => {
  const storage = createMemoryStorage();
  const debouncedStorage = createDebouncedStateStorage({
    delayMs: 1000,
    storage,
  });

  debouncedStorage.setItem('builder', '{"title":"Draft"}');
  debouncedStorage.removeItem('builder');
  debouncedStorage.flushAll();

  assert.equal(storage.getItem('builder'), null);
  assert.equal(debouncedStorage.hasPendingWrite('builder'), false);
});
