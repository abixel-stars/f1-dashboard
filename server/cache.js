// TTL cache backed by SQLite (table cache_entries). Same interface as the
// old in-memory cache, so routes keep working unchanged. Values are stored
// as JSON; `undefined` is treated as a miss (never persisted).
import { db } from './db.js';

const now = () => Date.now();

const stmtGet = db.prepare('SELECT value, expires_at FROM cache_entries WHERE key = ?');
const stmtSet = db.prepare(
  `INSERT INTO cache_entries (key, value, expires_at) VALUES (?, ?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`
);
const stmtDel = db.prepare('DELETE FROM cache_entries WHERE key = ?');

export function get(key) {
  const row = stmtGet.get(key);
  if (!row) return undefined;
  if (now() > row.expires_at) {
    stmtDel.run(key);
    return undefined;
  }
  return JSON.parse(row.value);
}

export function set(key, value, ttlMs) {
  if (value === undefined) {
    stmtDel.run(key);
    return;
  }
  stmtSet.run(key, JSON.stringify(value), now() + ttlMs);
}

export async function cached(key, ttlMs, fn) {
  const hit = get(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  set(key, value, ttlMs);
  return value;
}
