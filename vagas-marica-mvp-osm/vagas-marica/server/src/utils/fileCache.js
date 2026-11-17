import fs from 'node:fs';
import path from 'node:path';

/**
 * Cache chave-valor com TTL, persistido em um arquivo JSON (sem banco de dados).
 * Gravação atômica (arquivo temporário + rename) e com pequeno atraso para
 * agrupar várias escritas.
 */
export class FileCache {
  constructor(filePath, { maxEntries = 5000, flushDelayMs = 500 } = {}) {
    this.filePath = filePath;
    this.maxEntries = maxEntries;
    this.flushDelayMs = flushDelayMs;
    this.data = new Map();
    this.timer = null;
    this.load();
  }

  load() {
    if (!this.filePath) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      const now = Date.now();
      for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v.expires === 'number' && v.expires > now) this.data.set(k, v);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`[cache] arquivo ilegível, iniciando vazio: ${err.message}`);
    }
  }

  get(key) {
    const hit = this.data.get(key);
    if (!hit) return undefined;
    if (hit.expires <= Date.now()) {
      this.data.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key, value, ttlMs) {
    this.data.delete(key);
    this.data.set(key, { value, expires: Date.now() + ttlMs });
    while (this.data.size > this.maxEntries) this.data.delete(this.data.keys().next().value);
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (!this.filePath || this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; this.flush(); }, this.flushDelayMs);
    this.timer.unref?.();
  }

  flush() {
    if (!this.filePath) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(this.data)));
      fs.renameSync(tmp, this.filePath);
    } catch (err) {
      console.warn(`[cache] não foi possível gravar ${this.filePath}: ${err.message}`);
    }
  }
}
