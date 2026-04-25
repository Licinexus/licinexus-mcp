interface Entry<T> {
  value: T;
  expires: number;
}

export class MemoryCache {
  private store = new Map<string, Entry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new MemoryCache();

export const TTL_5_MIN = 5 * 60 * 1000;
export const TTL_30_MIN = 30 * 60 * 1000;
export const TTL_1_HOUR = 60 * 60 * 1000;
