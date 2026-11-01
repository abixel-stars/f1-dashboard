import { X, Star } from 'lucide-react';
import { fmtLap, tyreStyle, teamColor } from '../lib/format';

// Driver detail bottom sheet: photo, team, number, laps, tyre, sectors.
// Team colour on the top edge is data; the rest is flat ground and rules.
export default function DriverDetail({ row, isFav, onToggleFav, onClose }) {
  if (!row) return null;
  const tyre = row.tyre ? tyreStyle(row.tyre.compound) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={row.full_name || 'Driver detail'}
    >
      <div className="absolute inset-0 bg-black/80" />
      <div
        className="relative w-full sm:max-w-md bg-ground border-t-2 border border-rule overflow-hidden"
        style={{ borderTopColor: teamColor(row.team_colour) }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule">
          <span className="font-condensed font-semibold text-[13px] tracking-[0.24em] text-muted uppercase">
            Driver
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFav(row.driver_number)}
              className="press p-1.5"
              aria-label={isFav ? 'Remove favorite driver' : 'Set favorite driver'}
              aria-pressed={isFav}
            >
              <Star
                size={18}
                strokeWidth={1.5}
                className={isFav ? 'text-f1red fill-f1red' : 'text-muted/60'}
              />
            </button>
            <button onClick={onClose} className="press p-1.5 text-muted hover:text-ink" aria-label="Close">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Photo + identity */}
        <div className="flex gap-3 px-4 py-4">
          <div className="w-24 h-24 shrink-0 bg-surface overflow-hidden border border-rule">
            <DriverPhoto url={row.headshot_url} name={row.full_name} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-condensed font-bold text-4xl text-ink tnum">
                #{row.driver_number}
              </span>
              {row.position != null && (
                <span className="font-condensed font-bold text-sm px-2 py-0.5 bg-f1red text-white">
                  P{row.position}
                </span>
              )}
            </div>
            <div className="font-condensed font-bold text-xl tracking-wide uppercase truncate text-ink">
              {row.full_name}
            </div>
            <div
              className="font-condensed font-semibold text-[13px] tracking-[0.16em] uppercase"
              style={{ color: teamColor(row.team_colour) }}
            >
              {row.team_name}
            </div>
          </div>
        </div>

        {/* Stats: one container split by 1px rules, figures tabular. */}
        <div className="border-t border-rule">
          <StatRow
            label="Gap to leader"
            value={row.gap_to_leader === 0 ? 'LEADER' : row.gap_to_leader != null ? `+${row.gap_to_leader.toFixed(3)}` : '--'}
          />
          <StatRow
            label="Interval"
            value={row.interval != null ? `+${row.interval.toFixed(3)}` : '--'}
          />
          <StatRow
            label="Last lap"
            value={row.last_lap ? fmtLap(row.last_lap.lap_duration) : '--'}
          />
          <StatRow
            label="Best lap"
            value={row.best_lap ? fmtLap(row.best_lap.lap_duration) : '--'}
            highlight={row.best_lap?.is_session_best ? 'text-sessionbest' : 'text-personalbest'}
          />
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule/60">
            <span className="font-condensed text-[13px] tracking-[0.2em] text-muted uppercase">
              Tyre
            </span>
            <span className="flex items-center gap-2">
              {tyre ? (
                <>
                  <span className="font-condensed font-bold text-[11px] tracking-wider text-muted uppercase">
                    {row.tyre.age} laps old
                  </span>
                  <span
                    className="font-condensed font-bold text-[13px] w-[22px] h-[22px] flex items-center justify-center"
                    style={{ background: tyre.bg, color: tyre.fg }}
                  >
                    {tyre.label}
                  </span>
                </>
              ) : (
                <span className="font-mono text-sm text-muted">--</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="font-condensed text-[13px] tracking-[0.2em] text-muted uppercase">
              Sectors
            </span>
            <span className="flex gap-2.5 font-mono text-[12px] tnum">
              {row.last_lap ? (
                <>
                  <span className={row.last_lap.s1_best ? 'text-sessionbest font-bold' : 'text-ink/80'}>
                    S1 {row.last_lap.s1?.toFixed(2) ?? '--'}
                  </span>
                  <span className={row.last_lap.s2_best ? 'text-sessionbest font-bold' : 'text-ink/80'}>
                    S2 {row.last_lap.s2?.toFixed(2) ?? '--'}
                  </span>
                  <span className={row.last_lap.s3_best ? 'text-sessionbest font-bold' : 'text-ink/80'}>
                    S3 {row.last_lap.s3?.toFixed(2) ?? '--'}
                  </span>
                </>
              ) : (
                <span className="text-muted">--</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule/60">
      <span className="font-condensed text-[13px] tracking-[0.2em] text-muted uppercase">
        {label}
      </span>
      <span className={`font-mono font-bold text-base tnum text-ink ${highlight || ''}`}>
        {value}
      </span>
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
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#141417"/><circle cx="50" cy="38" r="18" fill="#8B8C92"/><path d="M20 100c2-22 16-32 30-32s28 10 30 32z" fill="#8B8C92"/></svg>`
          );
      }}
    />
  );
}
