interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export function createMemoryCache<T>(defaultTtlMs: number) {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);

      if (!entry) {
        return undefined;
      }

      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }

      return entry.value;
    },

    set(key: string, value: T, ttlMs = defaultTtlMs): void {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    },

    clear(): void {
      store.clear();
    },
  };
}
