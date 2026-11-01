import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import TowerRow from './TowerRow';

const TYPES = [
  { id: 'Race', short: 'RACE' },
  { id: 'Qualifying', short: 'QUALI' },
  { id: 'Practice', short: 'FP' },
];

// Map an OpenF1 session_name to one of our selector types.
function toSelectorType(name) {
  if (!name) return 'Race';
  if (/qualifying/i.test(name)) return 'Qualifying';
  if (/practice/i.test(name)) return 'Practice';
  return 'Race';
}

export default function TimingTower({ fav, onToggleFav, onSelectDriver }) {
  const [type, setType] = useState('Race');
  const [session, setSession] = useState(null);
  const [tower, setTower] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualType, setManualType] = useState(false);

  const load = async (sessionType, silent = false) => {
    try {
      if (!silent) { setLoading(true); setError(null); }
      const s = await api.latestSession(sessionType);
      setSession(s);
      const t = await api.timing(s.session_key);
      setTower(t.tower);
      setUpdatedAt(t.updated_at);
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // On first mount, default to the current session's type (e.g. Qualifying
  // during a live race weekend) instead of always Race.
  useEffect(() => {
    api.currentSession()
      .then((s) => { if (!manualType) setType(toSelectorType(s.session_name)); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load + switch session type.
  useEffect(() => {
    load(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Auto-refresh every 8s (silent, keeps flash animation meaningful).
  useEffect(() => {
    const id = setInterval(() => load(type, true), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const now = Date.now();
  const isLive = session &&
    new Date(session.date_start).getTime() <= now &&
    new Date(session.date_end).getTime() >= now;

  return (
    <div>
      {/* Session selector: text tabs, active marked by the 1px accent line
          lying on the rule, exactly as wide as the label. */}
      <div className="flex items-stretch border-b border-rule px-4">
        {TYPES.map(({ id, short }) => {
          const active = type === id;
          return (
            <button
              key={id}
              onClick={() => { setManualType(true); setType(id); }}
              aria-pressed={active}
              className={`press relative mr-6 py-3 font-condensed font-semibold text-[14px] tracking-[0.18em] uppercase ${
                active ? 'text-ink' : 'text-muted hover:text-ink/70'
              }`}
            >
              {short}
              <span
                aria-hidden
                className={`absolute left-0 right-0 -bottom-px h-px ${
                  active ? 'bg-f1red' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
        <button
          onClick={() => load(type)}
          className="press ml-auto my-auto p-2 text-muted hover:text-ink"
          aria-label="Refresh timing"
        >
          <RefreshCw size={15} strokeWidth={1.5} />
        </button>
      </div>

      {session && (
        <div className="px-4 py-3 flex items-baseline justify-between border-b border-rule">
          <div>
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="flex items-center gap-1.5">
                  <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-f1red" />
                  <span className="font-condensed font-semibold text-[12px] tracking-[0.2em] text-f1red uppercase">
                    Live
                  </span>
                </span>
              )}
              <h1 className="font-condensed font-bold text-2xl tracking-wide uppercase text-ink">
                {session.location} GP
              </h1>
            </div>
            <div className="font-condensed text-[13px] text-muted tracking-[0.14em] uppercase mt-0.5">
              {session.session_name} - {session.circuit_short_name}
            </div>
          </div>
          {updatedAt && (
            <div className="text-right shrink-0 ml-3">
              <div className="font-condensed text-[11px] tracking-[0.2em] text-muted uppercase">
                Updated
              </div>
              <div className="font-mono text-[11px] text-muted tnum">
                {new Date(updatedAt).toLocaleTimeString('en-GB')}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="p-4 space-y-2" aria-label="Loading timing">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-8 text-center">
          <p className="font-condensed font-semibold text-lg tracking-[0.12em] text-ink uppercase">
            Could not load timing data
          </p>
          <p className="font-mono text-xs text-muted mt-1">{error}</p>
          <button
            onClick={() => load(type)}
            className="press mt-4 px-6 py-2 bg-f1red text-white font-condensed font-semibold text-sm tracking-[0.18em] uppercase"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="tower-scroll overflow-x-auto">
          <div className="min-w-[460px]">
            {/* Column headers: small, muted, sentence case per app rules. */}
            <div
              className="grid items-center gap-x-2 px-4 py-2 border-b border-rule font-condensed text-[12px] font-medium tracking-[0.08em] text-muted"
              style={{ gridTemplateColumns: '28px 4px minmax(56px,68px) 1fr auto' }}
            >
              <span className="text-center">Pos</span>
              <span />
              <span>Driver</span>
              <span>Gap / Last / Best</span>
              <span className="w-[25px]" />
            </div>
            {tower.map((row, i) => (
              <TowerRow
                key={row.driver_number}
                row={row}
                index={i}
                isFav={fav === row.driver_number}
                onToggleFav={onToggleFav}
                onSelect={onSelectDriver}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
