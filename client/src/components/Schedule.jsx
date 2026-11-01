import { useEffect, useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
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
      <div className="px-4 pt-4 pb-1">
        <h1 className="font-condensed font-bold text-2xl tracking-wide uppercase text-ink">
          2026 Calendar
        </h1>
        <div className="font-condensed text-[13px] text-muted tracking-[0.14em] uppercase mt-0.5">
          Race weekends and session times
        </div>
      </div>

      {loading && (
        <div className="p-4 space-y-2" aria-label="Loading schedule">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface animate-pulse" />
          ))}
        </div>
      )}
      {error && (
        <p className="p-8 text-center font-condensed font-semibold text-lg tracking-[0.12em] text-ink uppercase">
          Failed to load: {error}
        </p>
      )}

      {!loading && !error && data && (
        <div className="mt-2">
          {/* Next race */}
          {data.next && (
            <div className="bg-surface border-y border-rule">
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <span className="font-condensed font-semibold text-[13px] tracking-[0.24em] text-f1red uppercase">
                  Next race
                </span>
                <Countdown targetIso={data.next.race_session.date_start} />
              </div>
              <div className="px-4 pb-4">
                <div className="font-condensed font-bold text-3xl tracking-wide uppercase text-ink">
                  {data.next.location} GP
                </div>
                <div className="font-condensed text-[13px] text-muted tracking-[0.14em] uppercase flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} strokeWidth={1.5} />
                  {data.next.country_name} - {fmtDateTime(data.next.race_session.date_start)}
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
              <div key={m.meeting_key} className={`border-b border-rule/60 ${isPast ? 'opacity-40' : ''}`}>
                <button
                  className="press w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => setExpanded(open ? null : m.meeting_key)}
                  aria-expanded={open}
                >
                  {isNext && <span className="w-[3px] self-stretch bg-f1red shrink-0" aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className="font-condensed font-bold text-lg tracking-wider uppercase block truncate text-ink">
                      {m.location} GP
                    </span>
                    <span className="font-mono text-[11px] text-muted tnum">
                      {race ? fmtDateTime(race.date_start) : ''}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.5}
                    className={`text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-3">
                    {m.sessions.map((s) => (
                      <div
                        key={s.session_key}
                        className="flex items-center justify-between py-2 border-t border-rule/60"
                      >
                        <span className="font-condensed font-semibold text-[14px] tracking-[0.14em] uppercase text-ink">
                          {s.session_name}
                        </span>
                        <span className="font-mono text-[11px] text-muted tnum">
                          {fmtDateTime(s.date_start)}
                        </span>
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
