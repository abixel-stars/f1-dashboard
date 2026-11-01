import { useEffect, useState } from 'react';
import { Star, Timer, Flag, ChevronRight, CircleAlert } from 'lucide-react';
import { api } from '../lib/api';
import { teamColor } from '../lib/format';
import { DriverPhoto } from './DriverDetail';
import { SessionCountdown } from './Countdown';

// Home widget: favorite driver card + countdowns to next Race / Qualifying / Practice.
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

  // Next meeting's sessions for countdowns.
  const next = schedule?.next;
  const pickSession = (names) =>
    next?.sessions.find((s) => names.includes(s.session_name)) || null;
  const raceS = pickSession(['Race']);
  const qualiS = pickSession(['Qualifying']);
  const practiceS = pickSession(['Practice 1', 'Practice 2', 'Practice 3', 'Practice']);

  return (
    <div>
      {/* Favorite driver widget card */}
      <div className="px-3 pt-3">
        <div className="font-arcade text-[9px] text-white tracking-wider mb-2 flex items-center gap-1.5">
          <Star size={12} className="text-gold fill-gold" /> MY DRIVER
        </div>
        {favDriver ? (
          <button
            onClick={() => onSelectDriver(favDriver)}
            className="w-full text-left bg-row border border-white/10 rounded-sm overflow-hidden"
          >
            <div className="h-1" style={{ background: teamColor(favDriver.team_colour) }} />
            <div className="flex gap-3 p-3">
              <div className="w-20 h-20 shrink-0 bg-panel rounded-sm overflow-hidden border border-white/10">
                <DriverPhoto url={favDriver.headshot_url} name={favDriver.full_name} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-condensed font-bold text-2xl tracking-wide uppercase truncate">
                  {favDriver.full_name}
                </div>
                <div className="font-condensed text-[13px] tracking-[0.15em] uppercase" style={{ color: teamColor(favDriver.team_colour) }}>
                  {favDriver.team_name} - #{favDriver.driver_number}
                </div>
                {favStanding && (
                  <div className="font-mono text-sm mt-1">
                    <span className="font-bold text-gold">{favStanding.points} PTS</span>
                    <span className="text-muted"> - P{standings.table.indexOf(favStanding) + 1} - {favStanding.wins} WINS</span>
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="text-muted self-center shrink-0" />
            </div>
          </button>
        ) : (
          <div className="bg-row border border-dashed border-white/20 rounded-sm p-4 flex items-start gap-2.5">
            <CircleAlert size={18} className="text-gold shrink-0 mt-0.5" />
            <p className="font-condensed text-[15px] text-muted tracking-wide">
              NO FAVORITE DRIVER YET. TAP THE STAR ON ANY DRIVER IN TIMING OR STANDINGS TO PIN THEM HERE.
            </p>
          </div>
        )}
      </div>

      {/* Session countdowns widget */}
      <div className="px-3 pt-4">
        <div className="font-arcade text-[9px] text-white tracking-wider mb-2 flex items-center gap-1.5">
          <Timer size={12} className="text-f1red" /> NEXT SESSIONS
        </div>
        {error && <p className="font-condensed text-muted tracking-wider text-sm">FAILED TO LOAD: {error}</p>}
        {!schedule && !error && (
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-row animate-pulse rounded-sm" />
            ))}
          </div>
        )}
        {next ? (
          <div className="border border-white/10 rounded-sm overflow-hidden">
            <div className="px-3 py-2 bg-panel border-b border-white/10 flex items-center gap-1.5">
              <Flag size={13} className="text-f1red" />
              <span className="font-condensed font-bold text-base tracking-[0.12em] uppercase">
                {next.location} GP
              </span>
              <span className="font-condensed text-[12px] text-muted tracking-widest uppercase ml-auto">
                {next.country_name}
              </span>
            </div>
            <SessionCountdown label="Race" session={raceS} accent="#E10600" />
            <SessionCountdown label="Qualifying" session={qualiS} accent="#FFD700" />
            <SessionCountdown label="Practice" session={practiceS} accent="#EDEFF7" />
          </div>
        ) : (
          schedule && (
            <p className="font-condensed text-muted tracking-wider text-sm">SEASON COMPLETE - NO UPCOMING SESSIONS</p>
          )
        )}
      </div>

      {/* Quick link to live timing */}
      <div className="px-3 py-4">
        <button
          onClick={goTiming}
          className="w-full py-2.5 bg-f1red text-white font-condensed font-bold text-base tracking-[0.2em] uppercase rounded-sm flex items-center justify-center gap-2"
        >
          <Timer size={17} /> Open live timing
        </button>
      </div>
    </div>
  );
}
