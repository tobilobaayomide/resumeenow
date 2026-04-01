import test from "node:test";
import assert from "node:assert/strict";
import { createPersistentTimedLruCache } from "../src/lib/ai/persistentCache.js";

const createMemoryStorage = () => {
  const entries = new Map<string, string>();

  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
  };
};

test("createPersistentTimedLruCache persists values and refreshes LRU access", () => {
  const storage = createMemoryStorage();
  let currentTime = 0;
  const cache = createPersistentTimedLruCache<string>({
    namespace: "test-ai-cache",
    ttlMs: 100,
    maxEntries: 2,
    storage,
    now: () => currentTime,
  });

  cache.set("a", "first");
  currentTime = 10;
  cache.set("b", "second");
  currentTime = 20;
  assert.equal(cache.get("a"), "first");
  currentTime = 30;
  cache.set("c", "third");

  assert.equal(cache.get("a"), "first");
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("c"), "third");
});

test("createPersistentTimedLruCache drops expired values", () => {
  const storage = createMemoryStorage();
  let currentTime = 0;
  const cache = createPersistentTimedLruCache<string>({
    namespace: "test-ai-cache-expiry",
    ttlMs: 50,
    maxEntries: 5,
    storage,
    now: () => currentTime,
  });

  cache.set("a", "first");
  currentTime = 60;

  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.size(), 0);
});
