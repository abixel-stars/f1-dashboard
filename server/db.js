// SQLite persistence (better-sqlite3, synchronous). DB file: server/data/f1.db
// Replaces the old in-memory cache so computed data survives restarts.
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new Database(join(dataDir, 'f1.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS driver_standings (
  year INTEGER NOT NULL,
  driver_number INTEGER NOT NULL,
  name_acronym TEXT,
  full_name TEXT,
  team_name TEXT,
  team_colour TEXT,
  headshot_url TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  podiums INTEGER NOT NULL DEFAULT 0,
  refreshed_at INTEGER NOT NULL,
  PRIMARY KEY (year, driver_number)
);

CREATE TABLE IF NOT EXISTS constructor_standings (
  year INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  team_colour TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  refreshed_at INTEGER NOT NULL,
  PRIMARY KEY (year, team_name)
);

CREATE TABLE IF NOT EXISTS schedule (
  year INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  refreshed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);
