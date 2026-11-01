// Persistent storage for computed aggregates: driver/constructor standings
// and the race schedule. Tables are read on each request when fresh
// (refreshed_at within maxAgeMs); otherwise the caller recomputes from
// OpenF1 and saves the result back here.
import { db } from './db.js';

const now = () => Date.now();

const metaGet = db.prepare('SELECT value FROM meta WHERE key = ?');
const metaSet = db.prepare(
  `INSERT INTO meta (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value`
);

// ---------- driver standings ----------

const dsFresh = db.prepare('SELECT MAX(refreshed_at) AS m FROM driver_standings WHERE year = ?');
const dsRows = db.prepare('SELECT * FROM driver_standings WHERE year = ?');
const dsClear = db.prepare('DELETE FROM driver_standings WHERE year = ?');
const dsUpsert = db.prepare(
  `INSERT INTO driver_standings
     (year, driver_number, name_acronym, full_name, team_name, team_colour,
      headshot_url, points, wins, podiums, refreshed_at)
   VALUES
     (@year, @driver_number, @name_acronym, @full_name, @team_name, @team_colour,
      @headshot_url, @points, @wins, @podiums, @refreshed_at)
   ON CONFLICT(year, driver_number) DO UPDATE SET
     name_acronym = excluded.name_acronym,
     full_name = excluded.full_name,
     team_name = excluded.team_name,
     team_colour = excluded.team_colour,
     headshot_url = excluded.headshot_url,
     points = excluded.points,
     wins = excluded.wins,
     podiums = excluded.podiums,
     refreshed_at = excluded.refreshed_at`
);

export function getDriverStandings(year, maxAgeMs) {
  const row = dsFresh.get(year);
  if (!row || !row.m || now() - row.m > maxAgeMs) return null;
  const rows = dsRows.all(year);
  rows.sort((a, b) => b.points - a.points || b.wins - a.wins);
  const races = Number(metaGet.get(`races:drivers:${year}`)?.value ?? 0);
  return {
    year: Number(year),
    races_counted: races,
    table: rows.map((r) => ({
      driver_number: r.driver_number,
      name_acronym: r.name_acronym,
      full_name: r.full_name,
      team_name: r.team_name,
      team_colour: r.team_colour,
      headshot_url: r.headshot_url,
      points: r.points,
      wins: r.wins,
      podiums: r.podiums,
    })),
  };
}

export function saveDriverStandings(year, table, racesCounted) {
  const t = now();
  const tx = db.transaction((rows) => {
    dsClear.run(year);
    for (const r of rows) dsUpsert.run({ year: Number(year), refreshed_at: t, ...r });
    metaSet.run(`races:drivers:${year}`, String(racesCounted));
  });
  tx(table);
}

// ---------- constructor standings ----------

const csFresh = db.prepare('SELECT MAX(refreshed_at) AS m FROM constructor_standings WHERE year = ?');
const csRows = db.prepare('SELECT * FROM constructor_standings WHERE year = ?');
const csClear = db.prepare('DELETE FROM constructor_standings WHERE year = ?');
const csUpsert = db.prepare(
  `INSERT INTO constructor_standings
     (year, team_name, team_colour, points, wins, refreshed_at)
   VALUES
     (@year, @team_name, @team_colour, @points, @wins, @refreshed_at)
   ON CONFLICT(year, team_name) DO UPDATE SET
     team_colour = excluded.team_colour,
     points = excluded.points,
     wins = excluded.wins,
     refreshed_at = excluded.refreshed_at`
);

export function getConstructorStandings(year, maxAgeMs) {
  const row = csFresh.get(year);
  if (!row || !row.m || now() - row.m > maxAgeMs) return null;
  const rows = csRows.all(year);
  rows.sort((a, b) => b.points - a.points || b.wins - a.wins);
  const races = Number(metaGet.get(`races:constructors:${year}`)?.value ?? 0);
  return {
    year: Number(year),
    races_counted: races,
    table: rows.map((r) => ({
      team_name: r.team_name,
      team_colour: r.team_colour,
      points: r.points,
      wins: r.wins,
    })),
  };
}

export function saveConstructorStandings(year, table, racesCounted) {
  const t = now();
  const tx = db.transaction((rows) => {
    csClear.run(year);
    for (const r of rows) csUpsert.run({ year: Number(year), refreshed_at: t, ...r });
    metaSet.run(`races:constructors:${year}`, String(racesCounted));
  });
  tx(table);
}

// ---------- schedule ----------

const schGet = db.prepare('SELECT payload, refreshed_at FROM schedule WHERE year = ?');
const schSet = db.prepare(
  `INSERT INTO schedule (year, payload, refreshed_at) VALUES (?, ?, ?)
   ON CONFLICT(year) DO UPDATE SET payload = excluded.payload, refreshed_at = excluded.refreshed_at`
);

export function getSchedule(year, maxAgeMs) {
  const row = schGet.get(Number(year));
  if (!row || now() - row.refreshed_at > maxAgeMs) return null;
  return JSON.parse(row.payload);
}

export function saveSchedule(year, payload) {
  schSet.run(Number(year), JSON.stringify(payload), now());
}
