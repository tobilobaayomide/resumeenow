interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface PersistentCacheIndexEntry {
  cacheKey: string;
  storageKey: string;
  timestamp: number;
  lastAccessedAt: number;
}

interface PersistentTimedLruCacheOptions {
  namespace: string;
  ttlMs: number;
  maxEntries: number;
  storage?: StorageLike | null;
  now?: () => number;
}

interface PersistentCacheRecord<T> {
  timestamp: number;
  value: T;
}

const getDefaultStorage = (): StorageLike | null => {
  if (typeof window === "undefined" || !("sessionStorage" in window)) {
    return null;
  }

  return window.sessionStorage;
};

const createStorageKey = (namespace: string, cacheKey: string): string =>
  `${namespace}:entry:${encodeURIComponent(cacheKey)}`;

const createIndexKey = (namespace: string): string => `${namespace}:index`;

export const createPersistentTimedLruCache = <T>({
  namespace,
  ttlMs,
  maxEntries,
  storage = getDefaultStorage(),
  now = () => Date.now(),
}: PersistentTimedLruCacheOptions) => {
  const indexKey = createIndexKey(namespace);

  const loadIndex = (): PersistentCacheIndexEntry[] => {
    if (!storage) return [];

    try {
      const raw = storage.getItem(indexKey);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter((entry): entry is PersistentCacheIndexEntry => {
        if (!entry || typeof entry !== "object") return false;

        return (
          typeof entry.cacheKey === "string" &&
          typeof entry.storageKey === "string" &&
          typeof entry.timestamp === "number" &&
          typeof entry.lastAccessedAt === "number"
        );
      });
    } catch {
      return [];
    }
  };

  const saveIndex = (entries: PersistentCacheIndexEntry[]) => {
    if (!storage) return;

    try {
      storage.setItem(indexKey, JSON.stringify(entries));
    } catch {
      // Ignore storage write failures and keep the in-memory request path working.
    }
  };

  const removeEntry = (entry: PersistentCacheIndexEntry) => {
    if (!storage) return;

    try {
      storage.removeItem(entry.storageKey);
    } catch {
      // Ignore storage cleanup failures.
    }
  };

  const pruneEntries = (
    entries: PersistentCacheIndexEntry[],
  ): PersistentCacheIndexEntry[] => {
    const currentTime = now();
    const freshEntries = entries.filter((entry) => {
      const isFresh = currentTime - entry.timestamp < ttlMs;
      if (!isFresh) {
        removeEntry(entry);
      }
      return isFresh;
    });

    if (freshEntries.length <= maxEntries) {
      return freshEntries;
    }

    const sortedEntries = [...freshEntries].sort(
      (leftEntry, rightEntry) => leftEntry.lastAccessedAt - rightEntry.lastAccessedAt,
    );
    const overflowEntries = sortedEntries.slice(0, sortedEntries.length - maxEntries);
    overflowEntries.forEach(removeEntry);

    const overflowStorageKeys = new Set(
      overflowEntries.map((entry) => entry.storageKey),
    );

    return freshEntries.filter(
      (entry) => !overflowStorageKeys.has(entry.storageKey),
    );
  };

  const withPrunedIndex = (): PersistentCacheIndexEntry[] => {
    const prunedEntries = pruneEntries(loadIndex());
    saveIndex(prunedEntries);
    return prunedEntries;
  };

  return {
    clear() {
      const entries = loadIndex();
      entries.forEach(removeEntry);
      saveIndex([]);
    },
    delete(cacheKey: string) {
      if (!storage) return;

      const storageKey = createStorageKey(namespace, cacheKey);
      const nextEntries = loadIndex().filter((entry) => entry.storageKey !== storageKey);

      try {
        storage.removeItem(storageKey);
      } catch {
        // Ignore storage cleanup failures.
      }

      saveIndex(nextEntries);
    },
    get(cacheKey: string): T | undefined {
      if (!storage) return undefined;

      const storageKey = createStorageKey(namespace, cacheKey);
      const entries = withPrunedIndex();
      const indexEntry = entries.find((entry) => entry.storageKey === storageKey);

      if (!indexEntry) return undefined;

      try {
        const raw = storage.getItem(storageKey);
        if (!raw) {
          this.delete(cacheKey);
          return undefined;
        }

        const parsed = JSON.parse(raw) as PersistentCacheRecord<T>;
        if (
          !parsed ||
          typeof parsed !== "object" ||
          typeof parsed.timestamp !== "number" ||
          !("value" in parsed)
        ) {
          this.delete(cacheKey);
          return undefined;
        }

        const currentTime = now();
        if (currentTime - parsed.timestamp >= ttlMs) {
          this.delete(cacheKey);
          return undefined;
        }

        const nextEntries = entries.map((entry) =>
          entry.storageKey === storageKey
            ? {
                ...entry,
                lastAccessedAt: currentTime,
              }
            : entry,
        );
        saveIndex(nextEntries);

        return parsed.value;
      } catch {
        this.delete(cacheKey);
        return undefined;
      }
    },
    set(cacheKey: string, value: T) {
      if (!storage) return;

      const storageKey = createStorageKey(namespace, cacheKey);
      const currentTime = now();
      const nextRecord: PersistentCacheRecord<T> = {
        timestamp: currentTime,
        value,
      };

      try {
        storage.setItem(storageKey, JSON.stringify(nextRecord));
      } catch {
        return;
      }

      const existingEntries = loadIndex().filter((entry) => entry.storageKey !== storageKey);
      const nextEntries = pruneEntries([
        ...existingEntries,
        {
          cacheKey,
          storageKey,
          timestamp: currentTime,
          lastAccessedAt: currentTime,
        },
      ]);
      saveIndex(nextEntries);
    },
    size() {
      return withPrunedIndex().length;
    },
  };
};
