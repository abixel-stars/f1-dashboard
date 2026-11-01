# F1 Live Dashboard

Live Formula 1 timing tower, standings, race schedule and countdowns, styled after the official F1 live timing experience. Installable as a phone app (PWA).

## Structure

```
f1-dashboard/
  server/   Node.js + Express backend. Proxies the OpenF1 API with SQLite-backed caching (better-sqlite3).
  client/   React + Vite + Tailwind CSS frontend (PWA, mobile-first).
```

## Run

**1. Server** (http://localhost:3001)

```bash
cd server
npm install
npm start        # or: npm run dev (watch mode)
```

**2. Client** (http://localhost:5173, proxies `/api` to the server)

```bash
cd client
npm install
npm run dev
```

For the phone: `npm run build` in `client/`, serve `client/dist`, then "Add to Home Screen" from the mobile browser.

Set `VITE_API_URL` in `client/.env` if the API lives somewhere else:

```
VITE_API_URL=https://your-server.example.com
```

## API contract (all under `/api`)

| Endpoint | Cache | Description |
|---|---|---|
| `GET /health` | - | Liveness check |
| `GET /sessions?year=2026` | 1h | Meetings grouped with their sessions |
| `GET /sessions/latest?type=Race&year=2026` | 1h | Latest completed session of a type (Race, Qualifying, Practice) |
| `GET /sessions/current?year=2026` | 10s | Most recently started session (defaults the timing view) |
| `GET /drivers?session_key=` | 1h | Drivers: acronym, team, colour, official headshot URL |
| `GET /timing?session_key=` | 10s | Timing tower rows: position, gap, interval, last/best lap, sectors, tyre compound + age |
| `GET /standings/drivers?year=2026` | 1h | Driver standings, aggregated 25-18-15-12-10-8-6-4-2-1 points |
| `GET /standings/constructors?year=2026` | 1h | Constructor standings, same aggregation |
| `GET /schedule?year=2026` | 1h | Full calendar + next upcoming race |

## Database (SQLite)

The server persists everything in `server/data/f1.db` (better-sqlite3, WAL mode), so computed data survives restarts:

| Table | Contents |
|---|---|
| `cache_entries` | Generic TTL cache (key, JSON value, expires_at) for timing, sessions and drivers |
| `driver_standings` | Per-driver points/wins/podiums per year + `refreshed_at` |
| `constructor_standings` | Per-team points/wins per year + `refreshed_at` |
| `schedule` | Assembled schedule payload per year + `refreshed_at` |
| `meta` | Small key/values, e.g. `races:drivers:2026` = number of races counted |

On startup the server serves from the DB whenever entries are still fresh (10s for live timing, 1h for standings/schedule) instead of refetching from OpenF1. The `data/` directory is gitignored (only `.gitkeep` is committed); to reset, stop the server and delete `server/data/f1.db`.

## Notes

- Data: [OpenF1 API](https://api.openf1.org/v1) (free, no key). Unofficial fan project, not affiliated with Formula 1.
- Driver photos are the official `headshot_url` values from OpenF1; a neutral silhouette is shown only if a URL fails to load.
- Points use the standard table with no fastest-lap bonus (abolished from 2025).
- The server retries with backoff on HTTP 429/5xx and keeps request fan-out low (driver info is fetched once per standings computation, not per race).
- Icons: [Lucide](https://lucide.dev) (`lucide-react` npm package).
