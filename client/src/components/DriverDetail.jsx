import { X, Star, Flag } from 'lucide-react';
import { fmtLap, tyreStyle, teamColor } from '../lib/format';

// Driver detail overlay: photo, team, number, best/last lap, tyre, sectors.
export default function DriverDetail({ row, isFav, onToggleFav, onClose }) {
  if (!row) return null;
  const tyre = row.tyre ? tyreStyle(row.tyre.compound) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full sm:max-w-md bg-panel border-t-2 sm:border border-white/10 sm:rounded-sm overflow-hidden"
        style={{ borderTopColor: teamColor(row.team_colour) }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
          <span className="font-arcade text-[9px] text-white tracking-wider">DRIVER</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onToggleFav(row.driver_number)} className="p-1.5" aria-label="Toggle favorite">
              <Star size={18} className={isFav ? 'text-gold fill-gold' : 'text-muted/60'} />
            </button>
            <button onClick={onClose} className="p-1.5 text-muted hover:text-white" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Photo + identity */}
        <div className="flex gap-3 px-4 py-3">
          <div className="w-24 h-24 shrink-0 bg-row rounded-sm overflow-hidden border border-white/10">
            <DriverPhoto url={row.headshot_url} name={row.full_name} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-condensed font-bold text-4xl">#{row.driver_number}</span>
              {row.position != null && (
                <span className="font-condensed font-bold text-sm px-2 py-0.5 bg-f1red text-white rounded-sm">
                  P{row.position}
                </span>
              )}
            </div>
            <div className="font-condensed font-bold text-xl tracking-wide uppercase truncate">{row.full_name}</div>
            <div className="font-condensed text-[13px] tracking-[0.15em] uppercase" style={{ color: teamColor(row.team_colour) }}>
              {row.team_name}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-white/10 border-t border-white/10">
          <Stat label="GAP TO LEADER" value={row.gap_to_leader === 0 ? 'LEADER' : row.gap_to_leader != null ? `+${row.gap_to_leader.toFixed(3)}` : '--'} />
          <Stat label="INTERVAL" value={row.interval != null ? `+${row.interval.toFixed(3)}` : '--'} />
          <Stat
            label="LAST LAP"
            value={row.last_lap ? fmtLap(row.last_lap.lap_duration) : '--'}
            mono
          />
          <Stat
            label="BEST LAP"
            value={row.best_lap ? fmtLap(row.best_lap.lap_duration) : '--'}
            mono
            highlight={row.best_lap?.is_session_best ? 'text-sessionbest' : 'text-personalbest'}
          />
          <div className="bg-panel px-4 py-2.5">
            <div className="font-condensed text-[11px] tracking-[0.2em] text-muted uppercase">Tyre</div>
            <div className="flex items-center gap-2 mt-0.5">
              {tyre ? (
                <>
                  <span className="font-condensed font-bold text-[13px] w-[22px] h-[22px] flex items-center justify-center rounded-sm" style={{ background: tyre.bg, color: tyre.fg }}>
                    {tyre.label}
                  </span>
                  <span className="font-condensed text-sm text-muted tracking-wider">{row.tyre.age} LAPS OLD</span>
                </>
              ) : <span className="font-mono text-sm">--</span>}
            </div>
          </div>
          <div className="bg-panel px-4 py-2.5">
            <div className="font-condensed text-[11px] tracking-[0.2em] text-muted uppercase">Sectors</div>
            <div className="flex gap-2 mt-1 font-mono text-[12px]">
              {row.last_lap ? (
                <>
                  <span className={row.last_lap.s1_best ? 'text-sessionbest font-bold' : 'text-white/80'}>S1 {row.last_lap.s1?.toFixed(2) ?? '--'}</span>
                  <span className={row.last_lap.s2_best ? 'text-sessionbest font-bold' : 'text-white/80'}>S2 {row.last_lap.s2?.toFixed(2) ?? '--'}</span>
                  <span className={row.last_lap.s3_best ? 'text-sessionbest font-bold' : 'text-white/80'}>S3 {row.last_lap.s3?.toFixed(2) ?? '--'}</span>
                </>
              ) : '--'}
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 flex items-center gap-1.5 border-t border-white/10">
          <Flag size={12} className="text-f1red" />
          <span className="font-condensed text-[11px] tracking-[0.2em] text-muted uppercase">Official data via OpenF1</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono, highlight }) {
  return (
    <div className="bg-panel px-4 py-2.5">
      <div className="font-condensed text-[11px] tracking-[0.2em] text-muted uppercase">{label}</div>
      <div className={`${mono ? 'font-mono' : 'font-condensed'} font-bold text-lg mt-0.5 ${highlight || ''}`}>{value}</div>
    </div>
  );
}

// Official headshot with neutral fallback if the URL fails.
export function DriverPhoto({ url, name }) {
  return (
    <img
      src={url}
      alt={name || 'Driver'}
      className="w-full h-full object-cover object-top"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src =
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1B2040"/><circle cx="50" cy="38" r="18" fill="#8A90B8"/><path d="M20 100c2-22 16-32 30-32s28 10 30 32z" fill="#8A90B8"/></svg>`
          );
      }}
    />
  );
}
