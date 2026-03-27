import type { StateStorage } from 'zustand/middleware';

type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type PendingWrite = {
  timer: ReturnType<typeof setTimeout>;
  value: string;
};

export interface DebouncedStateStorage extends StateStorage {
  flushItem: (name: string) => void;
  flushAll: () => void;
  hasPendingWrite: (name?: string) => boolean;
}

interface CreateDebouncedStateStorageOptions {
  delayMs: number;
  storage: StorageAdapter;
}

export const createDebouncedStateStorage = ({
  delayMs,
  storage,
}: CreateDebouncedStateStorageOptions): DebouncedStateStorage => {
  const pendingWrites = new Map<string, PendingWrite>();

  const clearPendingWrite = (name: string) => {
    const pendingWrite = pendingWrites.get(name);

    if (!pendingWrite) {
      return null;
    }

    clearTimeout(pendingWrite.timer);
    pendingWrites.delete(name);
    return pendingWrite;
  };

  const flushItem = (name: string) => {
    const pendingWrite = clearPendingWrite(name);

    if (!pendingWrite) {
      return;
    }

    storage.setItem(name, pendingWrite.value);
  };

  return {
    getItem: (name) => {
      const pendingWrite = pendingWrites.get(name);
      return pendingWrite?.value ?? storage.getItem(name);
    },
    setItem: (name, value) => {
      clearPendingWrite(name);

      const timer = setTimeout(() => {
        storage.setItem(name, value);
        pendingWrites.delete(name);
      }, delayMs);

      pendingWrites.set(name, { timer, value });
    },
    removeItem: (name) => {
      clearPendingWrite(name);
      storage.removeItem(name);
    },
    flushItem,
    flushAll: () => {
      const keys = Array.from(pendingWrites.keys());

      keys.forEach((name) => {
        flushItem(name);
      });
    },
    hasPendingWrite: (name) =>
      typeof name === 'string' ? pendingWrites.has(name) : pendingWrites.size > 0,
  };
};
