import { useEffect, useState } from 'react';
import { fmtCountdown, countdownParts, fmtDateTime } from '../lib/format';

// Live-updating countdown block.
export function Countdown({ targetIso, compact = false }) {
  const [parts, setParts] = useState(() => countdownParts(targetIso));

  useEffect(() => {
    setParts(countdownParts(targetIso));
    const id = setInterval(() => setParts(countdownParts(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (parts.past) {
    return <span className="font-mono text-personalbest font-bold">LIVE / DONE</span>;
  }
  return (
    <span className={`font-mono font-bold ${compact ? 'text-sm' : 'text-lg'} text-gold tabular-nums`}>
      {fmtCountdown(parts)}
    </span>
  );
}

// One session countdown row (Practice / Qualifying / Race).
export function SessionCountdown({ label, session, accent }) {
  if (!session) return null;
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-row border-b border-white/5">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-8 rounded-sm" style={{ background: accent }} />
        <div>
          <div className="font-condensed font-bold text-base tracking-[0.12em] uppercase">{label}</div>
          <div className="font-condensed text-[12px] text-muted tracking-wider">{fmtDateTime(session.date_start)}</div>
        </div>
      </div>
      <Countdown targetIso={session.date_start} compact />
    </div>
  );
}
