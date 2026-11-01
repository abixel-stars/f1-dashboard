import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { fmtLap, fmtGap, fmtInterval, tyreStyle, teamColor } from '../lib/format';

// One row of the timing tower. Team colour stripe is data; all figures are
// tabular mono; changed cells flash the accent once.
export default function TowerRow({ row, index, isFav, onToggleFav, onSelect }) {
  const prevRef = useRef({});
  const [flash, setFlash] = useState({});
  const prev = prevRef.current;

  useEffect(() => {
    const changed = {};
    const lastLap = row.last_lap?.lap_duration;
    if (prev.lastLap !== undefined && prev.lastLap !== lastLap) changed.last = true;
    if (prev.position !== undefined && prev.position !== row.position) changed.pos = true;
    if (prev.gap !== undefined && prev.gap !== row.gap_to_leader) changed.gap = true;
    if (Object.keys(changed).length) {
      setFlash(changed);
      const t = setTimeout(() => setFlash({}), 1300);
      prevRef.current = { lastLap, position: row.position, gap: row.gap_to_leader };
      return () => clearTimeout(t);
    }
    prevRef.current = { lastLap, position: row.position, gap: row.gap_to_leader };
  }, [row]);

  const tyre = row.tyre ? tyreStyle(row.tyre.compound) : null;
  const best = row.best_lap;
  const last = row.last_lap;

  const sectorClass = (isBest, val) => {
    if (val == null) return 'text-muted';
    if (isBest) return 'text-sessionbest font-bold';
    return 'text-ink/80';
  };

  return (
    <div
      className="tower-row grid items-center gap-x-2 px-4 py-[7px] border-b border-rule/60 cursor-pointer hover:bg-surface press"
      style={{ gridTemplateColumns: '28px 4px minmax(96px,112px) 1fr auto' }}
      onClick={() => onSelect(row)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(row); }}
      aria-label={`${row.full_name || row.name_acronym}, position ${row.position ?? '-'}`}
    >
      {/* Position */}
      <span className={`font-condensed font-bold text-lg text-center text-ink ${flash.pos ? 'cell-flash' : ''}`}>
        {row.position ?? '-'}
      </span>
      {/* Team colour stripe: data only */}
      <span className="h-9 w-1" style={{ background: teamColor(row.team_colour) }} />
      {/* Driver photo + acronym + tyre */}
      <span className="flex items-center gap-1.5 min-w-0">
        {row.headshot_url ? (
          <img
            src={row.headshot_url}
            alt={row.full_name || row.name_acronym}
            className="w-8 h-8 rounded-full object-cover object-top shrink-0 bg-surface"
            loading="lazy"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-surface shrink-0" aria-hidden />
        )}
        <span className="font-condensed font-bold text-base tracking-wider text-ink truncate">
          {row.name_acronym}
        </span>
        {tyre && (
          <span
            className="font-condensed font-bold text-[11px] w-[18px] h-[18px] flex items-center justify-center shrink-0"
            style={{ background: tyre.bg, color: tyre.fg }}
            title={`${row.tyre.compound} - ${row.tyre.age} laps`}
          >
            {tyre.label}
          </span>
        )}
      </span>
      {/* Times block: tabular mono */}
      <span className="flex items-center gap-3 font-mono text-[12px] tnum min-w-0 overflow-hidden text-ink">
        <span className={`whitespace-nowrap ${flash.gap ? 'cell-flash px-0.5' : ''}`} title="Gap to leader">
          {fmtGap(row.gap_to_leader)}
        </span>
        <span className="text-muted whitespace-nowrap hidden sm:inline" title="Interval">
          {fmtInterval(row.interval)}
        </span>
        <span className={`whitespace-nowrap ${flash.last ? 'cell-flash px-0.5' : ''}`} title="Last lap">
          {last ? fmtLap(last.lap_duration) : '--'}
        </span>
        <span
          className={`whitespace-nowrap font-bold ${best?.is_session_best ? 'text-sessionbest' : 'text-personalbest'}`}
          title="Best lap"
        >
          {best ? fmtLap(best.lap_duration) : '--'}
        </span>
        {last && (
          <span className="hidden md:flex items-center gap-1 text-[11px]" title="Sectors">
            <span className={sectorClass(last.s1_best, last.s1)}>S1</span>
            <span className={sectorClass(last.s2_best, last.s2)}>S2</span>
            <span className={sectorClass(last.s3_best, last.s3)}>S3</span>
          </span>
        )}
        {row.tyre && (
          <span className="text-muted whitespace-nowrap hidden lg:inline font-condensed tracking-wider">
            {row.tyre.age} LAPS
          </span>
        )}
      </span>
      {/* Favorite: the one accent when set */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(row.driver_number); }}
        className="press p-1 shrink-0"
        aria-label={isFav ? 'Remove favorite driver' : 'Set favorite driver'}
        aria-pressed={isFav}
      >
        <Star
          size={17}
          strokeWidth={1.5}
          className={isFav ? 'text-f1red fill-f1red' : 'text-muted/60'}
        />
      </button>
    </div>
  );
}
