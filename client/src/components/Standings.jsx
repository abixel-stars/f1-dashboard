import { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { api } from '../lib/api';
import { teamColor } from '../lib/format';

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
      <div className="flex gap-1.5 px-3 py-2.5 bg-panel border-b border-white/10">
        {[
          { id: 'drivers', label: 'DRIVERS' },
          { id: 'constructors', label: 'TEAMS' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`px-3 py-1 font-condensed font-semibold text-[13px] tracking-[0.12em] rounded-sm border transition-colors ${
              mode === id
                ? 'bg-f1red border-f1red text-white'
                : 'border-white/15 text-muted hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
        {data && (
          <span className="ml-auto font-condensed text-[12px] text-muted tracking-widest self-center">
            AFTER {data.races_counted} RACES
          </span>
        )}
      </div>

      {loading && (
        <div className="p-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-row animate-pulse rounded-sm" />
          ))}
        </div>
      )}
      {error && <p className="p-6 text-center font-condensed text-muted tracking-wider">FAILED TO LOAD: {error}</p>}

      {!loading && !error && data && mode === 'drivers' && (
        <div>
          {data.table.map((r, i) => (
            <div
              key={r.driver_number}
              className={`grid items-center gap-x-2 px-3 py-2 border-b border-white/5 cursor-pointer tower-row ${i % 2 ? 'bg-row' : 'bg-panel'}`}
              style={{ gridTemplateColumns: '30px 4px 1fr auto auto' }}
              onClick={() => onSelectDriver({ driver_number: r.driver_number, name_acronym: r.name_acronym, full_name: r.full_name, team_name: r.team_name, team_colour: r.team_colour, headshot_url: r.headshot_url })}
            >
              <span className="font-condensed font-bold text-lg text-center">{i + 1}</span>
              <span className="h-8 w-1 rounded-sm" style={{ background: teamColor(r.team_colour) }} />
              <span className="min-w-0">
                <span className="font-condensed font-bold text-base tracking-wider block truncate">{r.full_name}</span>
                <span className="font-condensed text-[12px] text-muted tracking-widest uppercase">{r.team_name}</span>
              </span>
              <span className="font-mono font-bold text-base">{r.points}<span className="text-muted text-xs font-medium"> PTS</span></span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(r.driver_number); }}
                className="p-1"
                aria-label="Toggle favorite driver"
              >
                <Star size={16} className={fav === r.driver_number ? 'text-gold fill-gold' : 'text-muted/60'} />
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
              className={`grid items-center gap-x-3 px-3 py-2.5 border-b border-white/5 ${i % 2 ? 'bg-row' : 'bg-panel'}`}
              style={{ gridTemplateColumns: '30px 4px 1fr auto' }}
            >
              <span className="font-condensed font-bold text-lg text-center">{i + 1}</span>
              <span className="h-8 w-1 rounded-sm" style={{ background: teamColor(r.team_colour) }} />
              <span className="min-w-0">
                <span className="font-condensed font-bold text-base tracking-wider block truncate uppercase">{r.team_name}</span>
                <span className="font-condensed text-[12px] text-muted tracking-widest">{r.wins} WINS</span>
              </span>
              <span className="font-mono font-bold text-base">{r.points}<span className="text-muted text-xs font-medium"> PTS</span></span>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="px-3 py-2 flex items-center gap-1.5 text-muted">
          <Trophy size={12} />
          <span className="font-condensed text-[11px] tracking-[0.15em]">2026 SEASON - POINTS 25-18-15-12-10-8-6-4-2-1</span>
        </div>
      )}
    </div>
  );
}
