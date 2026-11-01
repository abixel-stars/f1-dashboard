import { useEffect, useState } from 'react';
import { fmtCountdown, countdownParts, fmtDateTime } from '../lib/format';

// Live-updating countdown block: tabular mono, ink on ground.
export function Countdown({ targetIso, compact = false }) {
  const [parts, setParts] = useState(() => countdownParts(targetIso));

  useEffect(() => {
    setParts(countdownParts(targetIso));
    const id = setInterval(() => setParts(countdownParts(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (parts.past) {
    return (
      <span className="flex items-center gap-1.5 font-condensed font-semibold text-sm tracking-[0.2em] text-f1red uppercase">
        <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-f1red" />
        Live
      </span>
    );
  }
  return (
    <span className={`font-mono font-bold ${compact ? 'text-sm' : 'text-lg'} text-ink tnum`}>
      {fmtCountdown(parts)}
    </span>
  );
}

// One session countdown row (Practice / Qualifying / Race). The race is the
// screen's main data element and carries the one hue; the rest stay neutral.
export function SessionCountdown({ label, session, hot = false }) {
  if (!session) return null;
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-ground border-b border-rule/60 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <span className={`w-[3px] h-8 shrink-0 ${hot ? 'bg-f1red' : 'bg-rule'}`} aria-hidden />
        <div>
          <div className="font-condensed font-bold text-base tracking-[0.14em] uppercase text-ink">
            {label}
          </div>
          <div className="font-mono text-[11px] text-muted tnum">
            {fmtDateTime(session.date_start)}
          </div>
        </div>
      </div>
      <Countdown targetIso={session.date_start} compact />
    </div>
  );
}
