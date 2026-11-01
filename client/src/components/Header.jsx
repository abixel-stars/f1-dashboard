// GRIDX top bar: product mark + wordmark on the left, live mark on the right.
// Flat ground, one 1px rule below. No hero, no strip.
export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-ground border-b border-rule">
      <div className="flex items-center gap-2.5 px-4 h-14">
        <img
          src="./gridx-logo.jpg"
          alt="GRIDX"
          className="w-8 h-8 rounded-[2px] object-cover shrink-0"
        />
        <div className="leading-none">
          <div className="font-condensed font-bold text-xl tracking-[0.18em] text-ink">
            GRIDX
          </div>
          <div className="font-condensed font-medium text-[11px] tracking-[0.28em] text-muted uppercase">
            Live timing
          </div>
        </div>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="live-dot inline-block w-2 h-2 rounded-full bg-f1red" />
          <span className="font-mono text-[11px] text-muted tnum">2026</span>
        </span>
      </div>
    </header>
  );
}
