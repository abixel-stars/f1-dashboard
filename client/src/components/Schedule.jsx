import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { Countdown } from './Countdown';

export default function Schedule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.schedule()
      .then((d) => {
        setData(d);
        if (d.next) setExpanded(d.next.meeting_key);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date().toISOString();

  return (
    <div>
      <div className="px-3 py-2.5 bg-panel border-b border-white/10 flex items-center gap-2">
        <CalendarDays size={15} className="text-f1red" />
        <span className="font-arcade text-[9px] tracking-wider text-white">2026 CALENDAR</span>
      </div>

      {loading && (
        <div className="p-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-row animate-pulse rounded-sm" />
          ))}
        </div>
      )}
      {error && <p className="p-6 text-center font-condensed text-muted tracking-wider">FAILED TO LOAD: {error}</p>}

      {!loading && !error && data && (
        <div>
          {/* Next race highlight */}
          {data.next && (
            <div className="border-b-2 border-f1red bg-row">
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <span className="font-condensed font-bold text-sm tracking-[0.2em] text-f1red uppercase">Next race</span>
                <Countdown targetIso={data.next.race_session.date_start} />
              </div>
              <div className="px-3 pb-3">
                <div className="font-condensed font-bold text-2xl tracking-wide uppercase">
                  {data.next.location} <span className="text-f1red">GP</span>
                </div>
                <div className="font-condensed text-[13px] text-muted tracking-widest uppercase flex items-center gap-1">
                  <MapPin size={12} /> {data.next.country_name} - {fmtDateTime(data.next.race_session.date_start)}
                </div>
              </div>
            </div>
          )}

          {data.meetings.map((m) => {
            const race = m.sessions.find((s) => s.session_name === 'Race');
            const isPast = race && race.date_start < now;
            const isNext = data.next && data.next.meeting_key === m.meeting_key;
            const open = expanded === m.meeting_key;
            return (
              <div key={m.meeting_key} className={`border-b border-white/5 ${isPast ? 'opacity-45' : ''}`}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left tower-row"
                  onClick={() => setExpanded(open ? null : m.meeting_key)}
                >
                  {isNext && <span className="w-1.5 h-8 bg-f1red rounded-sm shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className="font-condensed font-bold text-base tracking-wider uppercase block truncate">
                      {m.location} GP
                    </span>
                    <span className="font-condensed text-[12px] text-muted tracking-widest uppercase">
                      {race ? fmtDateTime(race.date_start) : ''}
                    </span>
                  </span>
                  <ChevronRight size={16} className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>
                {open && (
                  <div className="px-3 pb-2.5">
                    {m.sessions.map((s) => (
                      <div key={s.session_key} className="flex items-center justify-between py-1.5 border-t border-white/5">
                        <span className="font-condensed font-semibold text-[14px] tracking-[0.12em] uppercase">
                          {s.session_name}
                        </span>
                        <span className="font-mono text-[11px] text-muted">{fmtDateTime(s.date_start)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
