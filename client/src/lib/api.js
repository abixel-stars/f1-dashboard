// Data layer switch:
// - default (web): all data comes from our own Express server, never directly from OpenF1.
// - mobile (VITE_APP_MODE=mobile): the Capacitor APK calls OpenF1 directly
//   via mobileApi, which returns the exact same JSON shapes as the server.
import { mobileApi } from './mobileApi.js';

const IS_MOBILE = import.meta.env.VITE_APP_MODE === 'mobile';
const API_URL = import.meta.env.VITE_API_URL || '';

async function get(path) {
  const res = await fetch(`${API_URL}/api${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

const serverApi = {
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

export const api = IS_MOBILE ? mobileApi : serverApi;
export const isMobileApp = IS_MOBILE;
