import { useEffect, useState } from 'react';
import { Star, ChevronRight, CircleAlert } from 'lucide-react';
import { api } from '../lib/api';
import { teamColor } from '../lib/format';
import { DriverPhoto } from './DriverDetail';
import { SessionCountdown } from './Countdown';

// Home: favorite driver card + countdowns to the next sessions.
export default function WidgetHome({ fav, drivers, onToggleFav, onSelectDriver, goTiming }) {
  const [schedule, setSchedule] = useState(null);
  const [standings, setStandings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.schedule(), api.driverStandings().catch(() => null)])
      .then(([sched, std]) => {
        setSchedule(sched);
        setStandings(std);
      })
      .catch((e) => setError(e.message));
  }, []);

  const favDriver = fav != null ? drivers.find((d) => d.driver_number === fav) : null;
  const favStanding = fav != null && standings
    ? standings.table.find((r) => r.driver_number === fav)
    : null;
  const favPos = favStanding ? standings.table.indexOf(favStanding) + 1 : null;

  // Next meeting's sessions for countdowns.
  const next = schedule?.next;
  const pickSession = (names) =>
    next?.sessions.find((s) => names.includes(s.session_name)) || null;
  const raceS = pickSession(['Race']);
  const qualiS = pickSession(['Qualifying']);
  const practiceS = pickSession(['Practice 1', 'Practice 2', 'Practice 3', 'Practice']);

  return (
    <div>
      {/* Favorite driver */}
      <section className="px-4 pt-4" aria-label="Favorite driver">
        <div className="flex items-center gap-1.5 mb-2">
          <Star size={12} strokeWidth={1.5} className={favDriver ? 'text-f1red fill-f1red' : 'text-muted'} />
          <h2 className="font-condensed font-semibold text-[13px] tracking-[0.24em] text-muted uppercase">
            My driver
          </h2>
        </div>
        {favDriver ? (
          <button
            onClick={() => onSelectDriver(favDriver)}
            className="press w-full text-left bg-surface border border-rule overflow-hidden"
          >
            <div className="h-[3px]" style={{ background: teamColor(favDriver.team_colour) }} />
            <div className="flex gap-3 p-3">
              <div className="w-20 h-20 shrink-0 bg-ground overflow-hidden border border-rule">
                <DriverPhoto url={favDriver.headshot_url} name={favDriver.full_name} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-condensed font-bold text-2xl tracking-wide uppercase truncate text-ink">
                  {favDriver.full_name}
                </div>
                <div
                  className="font-condensed font-semibold text-[13px] tracking-[0.16em] uppercase"
                  style={{ color: teamColor(favDriver.team_colour) }}
                >
                  {favDriver.team_name} - #{favDriver.driver_number}
                </div>
                {favStanding && (
                  <div className="font-mono text-sm tnum mt-1 text-ink">
                    <span className="font-bold">{favStanding.points} PTS</span>
                    <span className="text-muted"> - P{favPos} - {favStanding.wins} wins</span>
                  </div>
                )}
              </div>
              <ChevronRight size={18} strokeWidth={1.5} className="text-muted self-center shrink-0" />
            </div>
          </button>
        ) : (
          <div className="bg-surface border border-dashed border-rule p-4 flex items-start gap-2.5">
            <CircleAlert size={18} strokeWidth={1.5} className="text-muted shrink-0 mt-0.5" />
            <p className="font-condensed text-[15px] text-muted tracking-[0.08em]">
              No favorite driver yet. Tap the star on any driver in Timing or Tables to pin them here.
            </p>
          </div>
        )}
      </section>

      {/* Session countdowns */}
      <section className="px-4 pt-6" aria-label="Next sessions">
        <h2 className="font-condensed font-semibold text-[13px] tracking-[0.24em] text-muted uppercase mb-2">
          Next sessions
        </h2>
        {error && (
          <p className="font-condensed text-muted tracking-[0.08em] text-sm">
            Failed to load: {error}
          </p>
        )}
        {!schedule && !error && (
          <div className="space-y-1.5" aria-label="Loading countdowns">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface animate-pulse" />
            ))}
          </div>
        )}
        {next ? (
          <div className="border border-rule">
            <div className="px-3 py-2.5 bg-surface border-b border-rule flex items-center">
              <span className="font-condensed font-bold text-lg tracking-[0.12em] uppercase text-ink">
                {next.location} GP
              </span>
              <span className="font-condensed text-[12px] text-muted tracking-[0.16em] uppercase ml-auto">
                {next.country_name}
              </span>
            </div>
            <SessionCountdown label="Race" session={raceS} hot />
            <SessionCountdown label="Qualifying" session={qualiS} />
            <SessionCountdown label="Practice" session={practiceS} />
          </div>
        ) : (
          schedule && (
            <p className="font-condensed text-muted tracking-[0.08em] text-sm">
              Season complete - no upcoming sessions
            </p>
          )
        )}
      </section>

      {/* Primary action: the screen's one job. */}
      <div className="px-4 py-6">
        <button
          onClick={goTiming}
          className="press w-full py-3 bg-f1red text-white font-condensed font-bold text-base tracking-[0.24em] uppercase"
        >
          Open live timing
        </button>
      </div>
    </div>
  );
}
