import { useEffect, useState } from 'react';
import { RefreshCw, Flag } from 'lucide-react';
import { api } from '../lib/api';
import TowerRow from './TowerRow';

const TYPES = ['Race', 'Qualifying', 'Practice'];

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

  return (
    <div>
      {/* Session selector */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-panel border-b border-white/10">
        <Flag size={15} className="text-f1red shrink-0" />
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setManualType(true); setType(t); }}
              className={`px-3 py-1 font-condensed font-semibold text-[13px] tracking-[0.12em] uppercase rounded-sm border transition-colors ${
                type === t
                  ? 'bg-f1red border-f1red text-white'
                  : 'bg-transparent border-white/15 text-muted hover:text-white hover:border-white/40'
              }`}
            >
              {t === 'Practice' ? 'FP' : t.slice(0, 4).toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => load(type)}
          className="ml-auto p-1.5 text-muted hover:text-white"
          aria-label="Refresh timing"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {session && (
        <div className="px-3 py-2 flex items-baseline justify-between border-b border-white/10 bg-row">
          <div>
            <div className="font-condensed font-bold text-lg tracking-wide uppercase">
              {session.location} <span className="text-f1red">GP</span>
            </div>
            <div className="font-condensed text-[13px] text-muted tracking-widest uppercase">
              {session.session_name} - {session.circuit_short_name}
            </div>
          </div>
          {updatedAt && (
            <div className="font-mono text-[10px] text-muted">
              {new Date(updatedAt).toLocaleTimeString('en-GB')}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="p-6 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-row animate-pulse rounded-sm" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-6 text-center">
          <p className="font-condensed text-muted tracking-wider">COULD NOT LOAD TIMING DATA</p>
          <p className="font-mono text-xs text-muted/70 mt-1">{error}</p>
          <button
            onClick={() => load(type)}
            className="mt-3 px-4 py-1.5 bg-f1red text-white font-condensed font-semibold text-sm tracking-widest rounded-sm"
          >
            RETRY
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="tower-scroll overflow-x-auto">
          <div className="min-w-[430px]">
            {/* Column headers */}
            <div
              className="grid items-center gap-x-2 px-2 py-1.5 bg-panel border-b border-white/10 font-condensed text-[11px] font-semibold tracking-[0.15em] text-muted uppercase"
              style={{ gridTemplateColumns: '26px 4px minmax(52px,64px) 1fr auto' }}
            >
              <span className="text-center">POS</span>
              <span />
              <span>DRV</span>
              <span>GAP / INT / LAST / BEST</span>
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
