export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  size: number;
  maxEntries: number;
  ttlMs: number;
  hitRate: number;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/** Small dependency-free LRU cache used in front of BaselineStore. */
export class LruCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private expirations = 0;

  constructor(
    private readonly maxEntries = 500,
    private readonly ttlMs = 0
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error('cache maxEntries must be a positive integer');
    }
    if (ttlMs < 0) {
      throw new Error('cache ttlMs cannot be negative');
    }
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (this.ttlMs > 0 && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      this.expirations++;
      this.misses++;
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    this.entries.set(key, {
      value,
      expiresAt: this.ttlMs > 0 ? Date.now() + this.ttlMs : Number.POSITIVE_INFINITY,
    });

    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
      this.evictions++;
    }
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  getMetrics(): CacheMetrics {
    const requests = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations,
      size: this.entries.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      hitRate: requests === 0 ? 0 : this.hits / requests,
    };
  }
}
