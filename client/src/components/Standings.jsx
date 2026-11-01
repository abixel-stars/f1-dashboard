import { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { api } from '../lib/api';
import { teamColor } from '../lib/format';

const MODES = [
  { id: 'drivers', label: 'Drivers' },
  { id: 'constructors', label: 'Teams' },
];

export default function Standings({ fav, onToggleFav, onSelectDriver }) {
  const [mode, setMode] = useState('drivers');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fn = mode === 'drivers' ? api.driverStandings : api.constructorStandings;
    fn()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mode]);

  return (
    <div>
      <div className="px-4">
        <h1 className="font-condensed font-bold text-2xl tracking-wide uppercase text-ink pt-4">
          Championship
        </h1>
        <div className="font-condensed text-[13px] text-muted tracking-[0.14em] uppercase mt-0.5">
          {data ? `After ${data.races_counted} races` : '2026 season'}
        </div>
      </div>

      {/* Mode selector: text tabs on the rule. */}
      <div className="flex items-stretch border-b border-rule px-4 mt-1">
        {MODES.map(({ id, label }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              onClick={() => setMode(id)}
              aria-pressed={active}
              className={`press relative mr-6 py-3 font-condensed font-semibold text-[14px] tracking-[0.18em] uppercase ${
                active ? 'text-ink' : 'text-muted hover:text-ink/70'
              }`}
            >
              {label}
              <span
                aria-hidden
                className={`absolute left-0 right-0 -bottom-px h-px ${
                  active ? 'bg-f1red' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="p-4 space-y-2" aria-label="Loading standings">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface animate-pulse" />
          ))}
        </div>
      )}
      {error && (
        <p className="p-8 text-center font-condensed font-semibold text-lg tracking-[0.12em] text-ink uppercase">
          Failed to load: {error}
        </p>
      )}

      {!loading && !error && data && mode === 'drivers' && (
        <div>
          {data.table.map((r, i) => (
            <div
              key={r.driver_number}
              className="grid items-center gap-x-2 px-4 py-2 border-b border-rule/60 cursor-pointer hover:bg-surface press"
              style={{ gridTemplateColumns: '30px 4px 1fr auto auto' }}
              onClick={() => onSelectDriver({ driver_number: r.driver_number, name_acronym: r.name_acronym, full_name: r.full_name, team_name: r.team_name, team_colour: r.team_colour, headshot_url: r.headshot_url })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectDriver({ driver_number: r.driver_number, name_acronym: r.name_acronym, full_name: r.full_name, team_name: r.team_name, team_colour: r.team_colour, headshot_url: r.headshot_url });
                }
              }}
            >
              <span className="font-condensed font-bold text-lg text-center text-ink">{i + 1}</span>
              <span className="h-9 w-1" style={{ background: teamColor(r.team_colour) }} />
              <span className="min-w-0">
                <span className="font-condensed font-bold text-base tracking-wider block truncate text-ink">
                  {r.full_name}
                </span>
                <span className="font-condensed text-[12px] text-muted tracking-[0.14em] uppercase">
                  {r.team_name}
                </span>
              </span>
              <span className="font-mono font-bold text-base text-ink tnum">
                {r.points}
                <span className="text-muted text-[11px] font-medium"> PTS</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(r.driver_number); }}
                className="press p-1"
                aria-label={fav === r.driver_number ? 'Remove favorite driver' : 'Set favorite driver'}
                aria-pressed={fav === r.driver_number}
              >
                <Star
                  size={16}
                  strokeWidth={1.5}
                  className={fav === r.driver_number ? 'text-f1red fill-f1red' : 'text-muted/60'}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && data && mode === 'constructors' && (
        <div>
          {data.table.map((r, i) => (
            <div
              key={r.team_name}
              className="grid items-center gap-x-3 px-4 py-2.5 border-b border-rule/60"
              style={{ gridTemplateColumns: '30px 4px 1fr auto' }}
            >
              <span className="font-condensed font-bold text-lg text-center text-ink">{i + 1}</span>
              <span className="h-9 w-1" style={{ background: teamColor(r.team_colour) }} />
              <span className="min-w-0">
                <span className="font-condensed font-bold text-base tracking-wider block truncate uppercase text-ink">
                  {r.team_name}
                </span>
                <span className="font-condensed text-[12px] text-muted tracking-[0.14em] uppercase">
                  {r.wins} wins
                </span>
              </span>
              <span className="font-mono font-bold text-base text-ink tnum">
                {r.points}
                <span className="text-muted text-[11px] font-medium"> PTS</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="px-4 py-3 flex items-center gap-1.5 text-muted">
          <Trophy size={12} strokeWidth={1.5} />
          <span className="font-condensed text-[12px] tracking-[0.14em] uppercase">
            Points 25-18-15-12-10-8-6-4-2-1
          </span>
        </div>
      )}
    </div>
  );
}
