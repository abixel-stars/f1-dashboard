import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { fmtLap, fmtGap, fmtInterval, tyreStyle, teamColor } from '../lib/format';

// One row of the timing tower. Flashes changed cells on update.
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

  const sectorColor = (isBest, val) => {
    if (val == null) return 'text-muted';
    if (isBest) return 'text-sessionbest font-bold';
    return 'text-white/85';
  };

  return (
    <div
      className={`tower-row grid items-center gap-x-2 px-2 py-[7px] border-b border-white/5 cursor-pointer ${
        index % 2 ? 'bg-row' : 'bg-panel'
      }`}
      style={{ gridTemplateColumns: '26px 4px minmax(52px,64px) 1fr auto' }}
      onClick={() => onSelect(row)}
    >
      {/* Position */}
      <span className={`font-condensed font-bold text-lg text-center ${flash.pos ? 'cell-flash rounded' : ''}`}>
        {row.position ?? '-'}
      </span>
      {/* Team color stripe */}
      <span className="h-9 w-1 rounded-sm" style={{ background: teamColor(row.team_colour) }} />
      {/* Driver acronym + tyre */}
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="font-condensed font-bold text-base tracking-wider truncate">{row.name_acronym}</span>
        {tyre && (
          <span
            className="font-condensed font-bold text-[11px] w-[18px] h-[18px] flex items-center justify-center rounded-sm shrink-0"
            style={{ background: tyre.bg, color: tyre.fg }}
            title={`${row.tyre.compound} - ${row.tyre.age} laps`}
          >
            {tyre.label}
          </span>
        )}
      </span>
      {/* Times block */}
      <span className="flex items-center gap-3 font-mono text-[12px] min-w-0 overflow-hidden">
        <span className={`whitespace-nowrap ${flash.gap ? 'cell-flash rounded px-0.5' : ''}`} title="Gap to leader">
          {fmtGap(row.gap_to_leader)}
        </span>
        <span className="text-muted whitespace-nowrap hidden sm:inline" title="Interval">
          {fmtInterval(row.interval)}
        </span>
        <span className={`whitespace-nowrap ${flash.last ? 'cell-flash rounded px-0.5' : ''}`} title="Last lap">
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
            <span className={sectorColor(last.s1_best, last.s1)}>S1</span>
            <span className={sectorColor(last.s2_best, last.s2)}>S2</span>
            <span className={sectorColor(last.s3_best, last.s3)}>S3</span>
          </span>
        )}
        {row.tyre && <span className="text-muted whitespace-nowrap hidden lg:inline">{row.tyre.age} LAPS</span>}
      </span>
      {/* Favorite star */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(row.driver_number); }}
        className="p-1 shrink-0"
        aria-label="Toggle favorite driver"
      >
        <Star
          size={17}
          className={isFav ? 'text-gold fill-gold' : 'text-muted/60'}
        />
      </button>
    </div>
  );
}
