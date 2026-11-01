import { LayoutGrid, Timer, Trophy, CalendarDays } from 'lucide-react';

const TABS = [
  { id: 'widget', label: 'WIDGET', icon: LayoutGrid },
  { id: 'timing', label: 'TIMING', icon: Timer },
  { id: 'standings', label: 'STANDINGS', icon: Trophy },
  { id: 'schedule', label: 'SCHEDULE', icon: CalendarDays },
];

export default function Header({ tab, setTab }) {
  return (
    <header className="sticky top-0 z-40">
      {/* F1 red top strip */}
      <div className="bg-f1red px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-arcade text-[10px] text-white tracking-wider">F1 LIVE</span>
          <span className="font-condensed font-semibold text-white/90 text-sm tracking-[0.2em] uppercase">
            Dashboard
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="live-dot inline-block w-2 h-2 rounded-full bg-white" />
            <span className="font-condensed text-xs font-semibold text-white tracking-widest">2026</span>
          </span>
        </div>
      </div>
      {/* Tab bar */}
      <nav className="bg-panel border-b border-white/10 px-2">
        <div className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-condensed font-semibold text-sm tracking-[0.15em] uppercase border-b-2 transition-colors ${
                tab === id
                  ? 'text-white border-f1red'
                  : 'text-muted border-transparent hover:text-white/80'
              }`}
            >
              <Icon size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
