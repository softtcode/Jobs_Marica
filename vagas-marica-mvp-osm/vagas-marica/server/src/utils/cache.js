/** Cache simples em memória com TTL. Não persiste nada em disco nem em banco. */
export class TtlCache {
  constructor(ttlMs, maxEntries = 500) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.store = new Map();
  }
  get(key) {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }
  set(key, value, ttlMs = this.ttlMs) {
    if (this.store.size >= this.maxEntries) {
      this.store.delete(this.store.keys().next().value);
    }
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }
  /** Executa fn() apenas se não houver valor válido em cache (ou se force=true). */
  async wrap(key, fn, { force = false, ttlMs } = {}) {
    if (!force) {
      const cached = this.get(key);
      if (cached !== undefined) return cached;
    }
    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }
}
