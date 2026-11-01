// Mobile data layer: replicates the Express server's /api responses by
// fetching the OpenF1 API directly (https://api.openf1.org/v1, CORS open).
// JSON shapes are identical to the server responses so UI components need
// no changes. Standings are cached in localStorage for 1h to avoid
// recomputation on every launch.
const BASE = 'https://api.openf1.org/v1';
// Upgrade OpenF1 headshot URLs from 1col (tiny) to 4col (HD).
const hdHeadshot = (url) => url ? url.replace('/1col/', '/4col/') : url;


// Global request throttle: max 1 request per 400ms to respect OpenF1 rate limits.
let lastReq = 0;
async function throttle() {
  const now = Date.now();
  const wait = 100 - (now - lastReq);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReq = Date.now();
}

async function fetchJson(path, attempt = 0) {
  await throttle();
  const res = await fetch(`${BASE}${path}`, {
    headers: {},
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    // Exponential backoff with jitter: 2s, 4s, 8s, 16s, 32s + random
    const wait = Math.min(32000, 2000 * Math.pow(2, attempt)) + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return fetchJson(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`OpenF1 ${res.status} on ${path}`);
  return res.json();
}

const q = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

const openf1 = {
  sessions: (params) => fetchJson(`/sessions?${q(params)}`),
  drivers: (params) => fetchJson(`/drivers?${q(params)}`),
  position: (params) => fetchJson(`/position?${q(params)}`),
  intervals: (params) => fetchJson(`/intervals?${q(params)}`),
  laps: (params) => fetchJson(`/laps?${q(params)}`),
  stints: (params) => fetchJson(`/stints?${q(params)}`),
  sessionResult: (params) => fetchJson(`/session_result?${q(params)}`),
};

// Keep only the latest record per driver_number (OpenF1 returns time series).
function latestByDriver(rows) {
  const map = new Map();
  for (const r of rows) {
    const prev = map.get(r.driver_number);
    if (!prev || r.date > prev.date) map.set(r.driver_number, r);
  }
  return [...map.values()];
}

// Standard F1 points, positions 1-10 (no fastest-lap bonus point since 2025).
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const pointsFor = (pos) => (pos >= 1 && pos <= 10 ? POINTS[pos - 1] : 0);

const STANDINGS_TTL = 6 * 60 * 60 * 1000;

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    if (Date.now() - savedAt > STANDINGS_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

// Returns stale data even if expired (for instant display), null if none.
function readStale(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch { /* storage full or unavailable */ }
}

function shapeSessionSummary(s) {
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
}

async function latestSession(type, year = 2026) {
  const sessions = await openf1.sessions({ year, session_name: type });
  const now = new Date().toISOString();
  const past = sessions.filter((s) => s.date_start <= now);
  const pool = past.length ? past : sessions;
  if (!pool.length) throw new Error('no session found');
  pool.sort((a, b) => a.date_start.localeCompare(b.date_start));
  return shapeSessionSummary(pool[pool.length - 1]);
}

async function currentSession(year = 2026) {
  const sessions = await openf1.sessions({ year });
  const now = new Date().toISOString();
  const started = sessions.filter((s) => s.date_start <= now);
  if (!started.length) throw new Error('no session found');
  started.sort((a, b) => a.date_start.localeCompare(b.date_start));
  return shapeSessionSummary(started[started.length - 1]);
}

async function sessions(year = 2026) {
  const all = await openf1.sessions({ year });
  const meetings = new Map();
  for (const s of all) {
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
}

async function drivers(sessionKey) {
  if (!sessionKey) throw new Error('session_key required');
  const list = await openf1.drivers({ session_key: sessionKey });
  return list.map((d) => ({
    driver_number: d.driver_number,
    full_name: d.full_name,
    first_name: d.first_name,
    last_name: d.last_name,
    name_acronym: d.name_acronym,
    broadcast_name: d.broadcast_name,
    team_name: d.team_name,
    team_colour: d.team_colour,
    country_code: d.country_code,
    headshot_url: hdHeadshot(d.headshot_url),
  }));
}

async function timing(sessionKey) {
  if (!sessionKey) throw new Error('session_key required');
  const [drv, posRows, intRows, lapRows, stintRows] = await Promise.all([
    openf1.drivers({ session_key: sessionKey }),
    openf1.position({ session_key: sessionKey }),
    openf1.intervals({ session_key: sessionKey }),
    openf1.laps({ session_key: sessionKey }),
    openf1.stints({ session_key: sessionKey }),
  ]);

  const driverInfo = new Map(drv.map((d) => [d.driver_number, d]));
  const posByDriver = new Map(latestByDriver(posRows).map((r) => [r.driver_number, r.position]));
  const intByDriver = new Map(latestByDriver(intRows).map((r) => [r.driver_number, r]));

  const lapsByDriver = new Map();
  for (const lap of lapRows) {
    if (!lapsByDriver.has(lap.driver_number)) lapsByDriver.set(lap.driver_number, []);
    lapsByDriver.get(lap.driver_number).push(lap);
  }

  let bestS1 = Infinity, bestS2 = Infinity, bestS3 = Infinity, bestLap = Infinity;
  for (const lap of lapRows) {
    if (lap.duration_sector_1) bestS1 = Math.min(bestS1, lap.duration_sector_1);
    if (lap.duration_sector_2) bestS2 = Math.min(bestS2, lap.duration_sector_2);
    if (lap.duration_sector_3) bestS3 = Math.min(bestS3, lap.duration_sector_3);
    if (lap.lap_duration) bestLap = Math.min(bestLap, lap.lap_duration);
  }

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
      headshot_url: hdHeadshot(info.headshot_url),
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
    session_key: Number(sessionKey),
    updated_at: new Date().toISOString(),
    session_best_lap: bestLap === Infinity ? null : bestLap,
    tower,
  };
}

async function computeDriverStandings(year) {
  const key = `f1-mobile-standings-drivers-${year}`;
  const sessions = await openf1.sessions({ year, session_name: 'Race' });
  const now = new Date().toISOString();
  const done = sessions.filter((s) => s.date_start < now);
  done.sort((a, b) => a.date_start.localeCompare(b.date_start));

  const totals = new Map();
  const info = new Map();
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
      headshot_url: hdHeadshot(d.headshot_url),
      ...t,
    };
  });
  table.sort((a, b) => b.points - a.points || b.wins - a.wins);
  const data = { year: Number(year), races_counted: done.length, table };
  writeCache(key, data);
  return data;
}

async function driverStandings(year = 2026) {
  const key = `f1-mobile-standings-drivers-${year}`;
  const hit = readCache(key);
  if (hit) return hit;
  const stale = readStale(key);
  if (stale) {
    computeDriverStandings(year).catch(() => {});
    return stale;
  }
  return computeDriverStandings(year);
}

async function computeConstructorStandings(year) {
  const key = `f1-mobile-standings-constructors-${year}`;
  const sessions = await openf1.sessions({ year, session_name: 'Race' });
  const now = new Date().toISOString();
  const done = sessions.filter((s) => s.date_start < now);
  const teams = new Map();
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
  const data = { year: Number(year), races_counted: done.length, table };
  writeCache(key, data);
  return data;
}

async function constructorStandings(year = 2026) {
  const key = `f1-mobile-standings-constructors-${year}`;
  const hit = readCache(key);
  if (hit) return hit;
  const stale = readStale(key);
  if (stale) {
    computeConstructorStandings(year).catch(() => {});
    return stale;
  }
  return computeConstructorStandings(year);
}

async function schedule(year = 2026) {
  const all = await openf1.sessions({ year });
  const meetings = new Map();
  for (const s of all) {
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

export const mobileApi = {
  health: async () => ({ ok: true, time: new Date().toISOString() }),
  latestSession,
  currentSession,
  sessions,
  drivers,
  timing,
  driverStandings,
  constructorStandings,
  schedule,
};
