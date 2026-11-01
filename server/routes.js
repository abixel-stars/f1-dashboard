import { Router } from 'express';
import { cached } from './cache.js';
import { openf1, latestByDriver } from './openf1.js';
import {
  getDriverStandings, saveDriverStandings,
  getConstructorStandings, saveConstructorStandings,
  getSchedule, saveSchedule,
} from './store.js';

const router = Router();

// Standard F1 points, positions 1-10 (no fastest-lap bonus point since 2025).
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const pointsFor = (pos) => (pos >= 1 && pos <= 10 ? POINTS[pos - 1] : 0);

const LIVE_TTL = 10 * 1000;
const SLOW_TTL = 60 * 60 * 1000;

router.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Most recently started session of any type (the "current" session - live or
// just finished). Used to default the timing view during a race weekend.
router.get('/sessions/current', async (req, res, next) => {
  try {
    const { year = '2026' } = req.query;
    const data = await cached(`sessions-current-${year}`, LIVE_TTL, async () => {
      const sessions = await openf1.sessions({ year });
      const now = new Date().toISOString();
      const started = sessions.filter((s) => s.date_start <= now);
      if (!started.length) return null;
      started.sort((a, b) => a.date_start.localeCompare(b.date_start));
      const s = started[started.length - 1];
      return {
        session_key: s.session_key,
        session_name: s.session_name,
        session_type: s.session_type,
        location: s.location,
        country_name: s.country_name,
        circuit_short_name: s.circuit_short_name,
        date_start: s.date_start,
        date_end: s.date_end,
        meeting_key: s.meeting_key,
        year: s.year,
      };
    });
    if (!data) return res.status(404).json({ error: 'no session found' });
    res.json(data);
  } catch (e) { next(e); }
});

// Latest session_key for a session type (Race / Qualifying / Practice).
router.get('/sessions/latest', async (req, res, next) => {
  try {
    const { type = 'Race', year = '2026' } = req.query;
    const data = await cached(`sessions-latest-${type}-${year}`, SLOW_TTL, async () => {
      const sessions = await openf1.sessions({ year, session_name: type });
      // Latest session that has already started (completed or live), not future ones.
      const now = new Date().toISOString();
      const past = sessions.filter((s) => s.date_start <= now);
      const pool = past.length ? past : sessions;
      if (!pool.length) return null;
      pool.sort((a, b) => a.date_start.localeCompare(b.date_start));
      const s = pool[pool.length - 1];
      return {
        session_key: s.session_key,
        session_name: s.session_name,
        session_type: s.session_type,
        location: s.location,
        country_name: s.country_name,
        country_code: s.country_code,
        circuit_short_name: s.circuit_short_name,
        date_start: s.date_start,
        date_end: s.date_end,
        meeting_key: s.meeting_key,
        year: s.year,
      };
    });
    if (!data) return res.status(404).json({ error: 'no session found' });
    res.json(data);
  } catch (e) { next(e); }
});

// All sessions of a year, grouped per meeting (for schedule + session selector).
router.get('/sessions', async (req, res, next) => {
  try {
    const { year = '2026' } = req.query;
    const data = await cached(`sessions-${year}`, SLOW_TTL, async () => {
      const sessions = await openf1.sessions({ year });
      const meetings = new Map();
      for (const s of sessions) {
        if (!meetings.has(s.meeting_key)) {
          meetings.set(s.meeting_key, {
            meeting_key: s.meeting_key,
            location: s.location,
            country_name: s.country_name,
            country_code: s.country_code,
            circuit_short_name: s.circuit_short_name,
            year: s.year,
            sessions: [],
          });
        }
        meetings.get(s.meeting_key).sessions.push({
          session_key: s.session_key,
          session_name: s.session_name,
          session_type: s.session_type,
          date_start: s.date_start,
          date_end: s.date_end,
        });
      }
      const list = [...meetings.values()];
      for (const m of list) m.sessions.sort((a, b) => a.date_start.localeCompare(b.date_start));
      list.sort((a, b) => a.sessions[0].date_start.localeCompare(b.sessions[0].date_start));
      return list;
    });
    res.json(data);
  } catch (e) { next(e); }
});

// Drivers of a session (with official headshot_url, team colour, acronym).
router.get('/drivers', async (req, res, next) => {
  try {
    const { session_key } = req.query;
    if (!session_key) return res.status(400).json({ error: 'session_key required' });
    const data = await cached(`drivers-${session_key}`, SLOW_TTL, async () => {
      const drivers = await openf1.drivers({ session_key });
      return drivers.map((d) => ({
        driver_number: d.driver_number,
        full_name: d.full_name,
        first_name: d.first_name,
        last_name: d.last_name,
        name_acronym: d.name_acronym,
        broadcast_name: d.broadcast_name,
        team_name: d.team_name,
        team_colour: d.team_colour,
        country_code: d.country_code,
        headshot_url: d.headshot_url,
      }));
    });
    res.json(data);
  } catch (e) { next(e); }
});

// Live timing tower for a session: merged positions, gaps, laps, tires, sectors.
router.get('/timing', async (req, res, next) => {
  try {
    const { session_key } = req.query;
    if (!session_key) return res.status(400).json({ error: 'session_key required' });

    const data = await cached(`timing-${session_key}`, LIVE_TTL, async () => {
      const [drivers, posRows, intRows, lapRows, stintRows] = await Promise.all([
        openf1.drivers({ session_key }),
        openf1.position({ session_key }),
        openf1.intervals({ session_key }),
        openf1.laps({ session_key }),
        openf1.stints({ session_key }),
      ]);

      const driverInfo = new Map(drivers.map((d) => [d.driver_number, d]));
      const posByDriver = new Map(latestByDriver(posRows).map((r) => [r.driver_number, r.position]));
      const intByDriver = new Map(latestByDriver(intRows).map((r) => [r.driver_number, r]));

      // Laps per driver: last lap + best lap.
      const lapsByDriver = new Map();
      for (const lap of lapRows) {
        if (!lapsByDriver.has(lap.driver_number)) lapsByDriver.set(lap.driver_number, []);
        lapsByDriver.get(lap.driver_number).push(lap);
      }

      // Session best sectors + best lap overall (for purple highlighting).
      let bestS1 = Infinity, bestS2 = Infinity, bestS3 = Infinity, bestLap = Infinity;
      for (const lap of lapRows) {
        if (lap.duration_sector_1) bestS1 = Math.min(bestS1, lap.duration_sector_1);
        if (lap.duration_sector_2) bestS2 = Math.min(bestS2, lap.duration_sector_2);
        if (lap.duration_sector_3) bestS3 = Math.min(bestS3, lap.duration_sector_3);
        if (lap.lap_duration) bestLap = Math.min(bestLap, lap.lap_duration);
      }

      // Latest stint per driver (tire compound + age).
      const stintByDriver = new Map();
      for (const st of stintRows) {
        const prev = stintByDriver.get(st.driver_number);
        if (!prev || st.stint_number > prev.stint_number) stintByDriver.set(st.driver_number, st);
      }

      const tower = [];
      for (const [num, info] of driverInfo) {
        const laps = (lapsByDriver.get(num) || []).filter((l) => l.lap_duration);
        laps.sort((a, b) => a.lap_number - b.lap_number);
        const lastLap = laps.length ? laps[laps.length - 1] : null;
        let best = null;
        for (const l of laps) if (!best || l.lap_duration < best.lap_duration) best = l;

        const stint = stintByDriver.get(num);
        const tyreAge = stint && lastLap
          ? stint.tyre_age_at_start + Math.max(0, lastLap.lap_number - stint.lap_start)
          : stint ? stint.tyre_age_at_start : null;

        const iv = intByDriver.get(num) || {};
        tower.push({
          driver_number: num,
          position: posByDriver.get(num) ?? null,
          name_acronym: info.name_acronym,
          full_name: info.full_name,
          team_name: info.team_name,
          team_colour: info.team_colour,
          headshot_url: info.headshot_url,
          gap_to_leader: iv.gap_to_leader ?? null,
          interval: iv.interval ?? null,
          last_lap: lastLap ? {
            lap_number: lastLap.lap_number,
            lap_duration: lastLap.lap_duration,
            s1: lastLap.duration_sector_1 ?? null,
            s2: lastLap.duration_sector_2 ?? null,
            s3: lastLap.duration_sector_3 ?? null,
            s1_best: lastLap.duration_sector_1 === bestS1,
            s2_best: lastLap.duration_sector_2 === bestS2,
            s3_best: lastLap.duration_sector_3 === bestS3,
            is_pit_out_lap: !!lastLap.is_pit_out_lap,
          } : null,
          best_lap: best ? {
            lap_number: best.lap_number,
            lap_duration: best.lap_duration,
            is_session_best: best.lap_duration === bestLap,
          } : null,
          tyre: stint ? { compound: stint.compound, age: tyreAge } : null,
        });
      }

      tower.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
      return {
        session_key: Number(session_key),
        updated_at: new Date().toISOString(),
        session_best_lap: bestLap === Infinity ? null : bestLap,
        tower,
      };
    });

    res.json(data);
  } catch (e) { next(e); }
});

// Driver standings for a year: aggregated points from all race session_results.
// Computed from OpenF1, then persisted in the driver_standings table.
async function computeDriverStandings(year) {
  const sessions = await openf1.sessions({ year, session_name: 'Race' });
  const now = new Date().toISOString();
  const done = sessions.filter((s) => s.date_start < now);
  done.sort((a, b) => a.date_start.localeCompare(b.date_start));

  const totals = new Map(); // driver_number -> { points, wins, podiums }
  const info = new Map();   // driver_number -> driver info
  // Driver numbers are stable per season: fetch driver info once from the
  // latest completed race and reuse it, instead of one call per race.
  if (done.length) {
    try {
      const latestDrivers = await openf1.drivers({ session_key: done[done.length - 1].session_key });
      for (const d of latestDrivers) info.set(d.driver_number, d);
    } catch { /* fall through, info stays sparse */ }
  }
  for (const s of done) {
    let results = [];
    try { results = await openf1.sessionResult({ session_key: s.session_key }); }
    catch { continue; }
    for (const r of results) {
      if (!r.position) continue;
      const t = totals.get(r.driver_number) || { points: 0, wins: 0, podiums: 0 };
      t.points += pointsFor(r.position);
      if (r.position === 1) t.wins += 1;
      if (r.position <= 3) t.podiums += 1;
      totals.set(r.driver_number, t);
    }
  }

  const table = [...totals.entries()].map(([num, t]) => {
    const d = info.get(num) || {};
    return {
      driver_number: num,
      name_acronym: d.name_acronym,
      full_name: d.full_name,
      team_name: d.team_name,
      team_colour: d.team_colour,
      headshot_url: d.headshot_url,
      ...t,
    };
  });
  table.sort((a, b) => b.points - a.points || b.wins - a.wins);
  return { year: Number(year), races_counted: done.length, table };
}

router.get('/standings/drivers', async (req, res, next) => {
  try {
    const { year = '2026' } = req.query;
    let data = getDriverStandings(year, SLOW_TTL);
    if (!data) {
      data = await computeDriverStandings(year);
      saveDriverStandings(year, data.table, data.races_counted);
    }
    res.json(data);
  } catch (e) { next(e); }
});

// Constructor standings: same aggregation, grouped by team. Persisted in
// the constructor_standings table.
async function computeConstructorStandings(year) {
  const sessions = await openf1.sessions({ year, session_name: 'Race' });
  const now = new Date().toISOString();
  const done = sessions.filter((s) => s.date_start < now);
  const teams = new Map();
  // Driver info fetched once from the latest completed race (numbers are
  // stable per season); reused for every race instead of per-race calls.
  const info = new Map();
  if (done.length) {
    try {
      const latestDrivers = await openf1.drivers({ session_key: done[done.length - 1].session_key });
      for (const d of latestDrivers) info.set(d.driver_number, d);
    } catch { /* fall through */ }
  }
  for (const s of done) {
    let results = [];
    try { results = await openf1.sessionResult({ session_key: s.session_key }); }
    catch { continue; }
    for (const r of results) {
      if (!r.position) continue;
      const d = info.get(r.driver_number) || {};
      const name = d.team_name || 'Unknown';
      const t = teams.get(name) || { team_name: name, team_colour: d.team_colour, points: 0, wins: 0 };
      t.points += pointsFor(r.position);
      if (r.position === 1) t.wins += 1;
      if (!t.team_colour && d.team_colour) t.team_colour = d.team_colour;
      teams.set(name, t);
    }
  }
  const table = [...teams.values()].sort((a, b) => b.points - a.points || b.wins - a.wins);
  return { year: Number(year), races_counted: done.length, table };
}

router.get('/standings/constructors', async (req, res, next) => {
  try {
    const { year = '2026' } = req.query;
    let data = getConstructorStandings(year, SLOW_TTL);
    if (!data) {
      data = await computeConstructorStandings(year);
      saveConstructorStandings(year, data.table, data.races_counted);
    }
    res.json(data);
  } catch (e) { next(e); }
});

// Schedule: meetings with sessions + next upcoming race info. The assembled
// payload is persisted in the schedule table.
async function computeSchedule(year) {
  const sessions = await openf1.sessions({ year });
  const meetings = new Map();
  for (const s of sessions) {
    if (!meetings.has(s.meeting_key)) {
      meetings.set(s.meeting_key, {
        meeting_key: s.meeting_key,
        location: s.location,
        country_name: s.country_name,
        country_code: s.country_code,
        circuit_short_name: s.circuit_short_name,
        sessions: [],
      });
    }
    meetings.get(s.meeting_key).sessions.push({
      session_key: s.session_key,
      session_name: s.session_name,
      date_start: s.date_start,
      date_end: s.date_end,
    });
  }
  const list = [...meetings.values()];
  for (const m of list) m.sessions.sort((a, b) => a.date_start.localeCompare(b.date_start));
  list.sort((a, b) => a.sessions[0].date_start.localeCompare(b.sessions[0].date_start));

  const now = new Date().toISOString();
  let next = null;
  for (const m of list) {
    const race = m.sessions.find((s) => s.session_name === 'Race');
    if (race && race.date_start > now) { next = { ...m, race_session: race }; break; }
  }
  return { year: Number(year), meetings: list, next };
}

router.get('/schedule', async (req, res, next) => {
  try {
    const { year = '2026' } = req.query;
    let data = getSchedule(year, SLOW_TTL);
    if (!data) {
      data = await computeSchedule(year);
      saveSchedule(year, data);
    }
    res.json(data);
  } catch (e) { next(e); }
});

export default router;
