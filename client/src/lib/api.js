// All data comes from our own Express server, never directly from OpenF1.
const API_URL = import.meta.env.VITE_API_URL || '';

async function get(path) {
  const res = await fetch(`${API_URL}/api${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  health: () => get('/health'),
  latestSession: (type, year = 2026) =>
    get(`/sessions/latest?type=${encodeURIComponent(type)}&year=${year}`),
  currentSession: (year = 2026) => get(`/sessions/current?year=${year}`),
  sessions: (year = 2026) => get(`/sessions?year=${year}`),
  drivers: (sessionKey) => get(`/drivers?session_key=${sessionKey}`),
  timing: (sessionKey) => get(`/timing?session_key=${sessionKey}`),
  driverStandings: (year = 2026) => get(`/standings/drivers?year=${year}`),
  constructorStandings: (year = 2026) => get(`/standings/constructors?year=${year}`),
  schedule: (year = 2026) => get(`/schedule?year=${year}`),
};
