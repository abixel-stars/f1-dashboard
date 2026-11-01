import { LayoutGrid, Timer, Trophy, CalendarDays } from 'lucide-react';

const TABS = [
  { id: 'widget', label: 'Home', icon: LayoutGrid },
  { id: 'timing', label: 'Timing', icon: Timer },
  { id: 'standings', label: 'Tables', icon: Trophy },
  { id: 'schedule', label: 'Races', icon: CalendarDays },
];

// Bottom tab bar (data-terminal): the active tab is marked by the one 1px
// accent line on the bar's top edge, exactly as wide as the label.
export default function TabBar({ tab, setTab }) {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 bg-ground border-t border-rule"
    >
      <div className="flex pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`press relative flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2.5 ${
                active ? 'text-ink' : 'text-muted hover:text-ink/70'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="relative font-condensed font-semibold text-[11px] tracking-[0.2em] uppercase">
                {label}
                <span
                  aria-hidden
                  className={`absolute -top-[30px] left-0 right-0 h-px ${
                    active ? 'bg-f1red' : 'bg-transparent'
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
