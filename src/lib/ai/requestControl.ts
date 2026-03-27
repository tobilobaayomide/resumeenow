type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

interface TimedLruCacheOptions {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}

export const createTimedLruCache = <T>({
  ttlMs,
  maxEntries,
  now = () => Date.now(),
}: TimedLruCacheOptions) => {
  const entries = new Map<string, CacheEntry<T>>();

  const pruneExpired = () => {
    const currentTime = now();
    for (const [key, entry] of entries.entries()) {
      if (currentTime - entry.timestamp >= ttlMs) {
        entries.delete(key);
      }
    }
  };

  const evictOverflow = () => {
    while (entries.size > maxEntries) {
      const oldestKey = entries.keys().next().value;
      if (!oldestKey) {
        break;
      }
      entries.delete(oldestKey);
    }
  };

  return {
    clear() {
      entries.clear();
    },
    delete(key: string) {
      entries.delete(key);
    },
    get(key: string): T | undefined {
      pruneExpired();
      const entry = entries.get(key);
      if (!entry) {
        return undefined;
      }

      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key: string, value: T) {
      pruneExpired();
      if (entries.has(key)) {
        entries.delete(key);
      }

      entries.set(key, { value, timestamp: now() });
      evictOverflow();
    },
    size() {
      pruneExpired();
      return entries.size;
    },
  };
};

export const createRequestScheduler = (maxConcurrent: number) => {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new Error('maxConcurrent must be at least 1.');
  }

  let activeCount = 0;
  const waiters: Array<() => void> = [];

  const acquireSlot = async () => {
    if (activeCount >= maxConcurrent) {
      await new Promise<void>((resolve) => {
        waiters.push(() => {
          activeCount += 1;
          resolve();
        });
      });
      return;
    }

    activeCount += 1;
  };

  const releaseSlot = () => {
    activeCount = Math.max(0, activeCount - 1);
    const next = waiters.shift();
    if (next) {
      next();
    }
  };

  return {
    async run<T>(task: () => Promise<T>): Promise<T> {
      await acquireSlot();
      try {
        return await task();
      } finally {
        releaseSlot();
      }
    },
    getActiveCount() {
      return activeCount;
    },
    getPendingCount() {
      return waiters.length;
    },
  };
};
