// Minimal OpenF1 API client (https://api.openf1.org/v1). No key required.
const BASE = 'https://api.openf1.org/v1';

async function fetchJson(path, attempt = 0) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'f1-dashboard/1.0' },
  });
  // Gentle retry with backoff on rate limiting / transient errors.
  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    const wait = 1500 * (attempt + 1);
    await new Promise((r) => setTimeout(r, wait));
    return fetchJson(path, attempt + 1);
  }
  if (!res.ok) {
    const err = new Error(`OpenF1 ${res.status} on ${path}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const q = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export const openf1 = {
  sessions: (params) => fetchJson(`/sessions?${q(params)}`),
  drivers: (params) => fetchJson(`/drivers?${q(params)}`),
  position: (params) => fetchJson(`/position?${q(params)}`),
  intervals: (params) => fetchJson(`/intervals?${q(params)}`),
  laps: (params) => fetchJson(`/laps?${q(params)}`),
  stints: (params) => fetchJson(`/stints?${q(params)}`),
  sessionResult: (params) => fetchJson(`/session_result?${q(params)}`),
  meetings: (params) => fetchJson(`/meetings?${q(params)}`),
};

// Keep only the latest record per driver_number (OpenF1 returns time series).
export function latestByDriver(rows) {
  const map = new Map();
  for (const r of rows) {
    const prev = map.get(r.driver_number);
    if (!prev || r.date > prev.date) map.set(r.driver_number, r);
  }
  return [...map.values()];
}
