// Format seconds as M:SS.mmm (e.g. 98.321 -> "1:38.321")
export function fmtLap(sec) {
  if (sec == null || !isFinite(sec)) return '--';
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(3)}`;
}

// Format gap like "+13.078" or "1 LAP"
export function fmtGap(gap) {
  if (gap == null || !isFinite(gap)) return '--';
  if (gap === 0) return 'LEADER';
  return `+${gap.toFixed(3)}`;
}

export function fmtInterval(iv) {
  if (iv == null || !isFinite(iv)) return '--';
  return `+${iv.toFixed(3)}`;
}

const TYRE_STYLE = {
  SOFT:   { label: 'S', bg: '#E10600', fg: '#FFFFFF' },
  MEDIUM: { label: 'M', bg: '#FFD700', fg: '#111111' },
  HARD:   { label: 'H', bg: '#EDEFF7', fg: '#111111' },
  INTERMEDIATE: { label: 'I', bg: '#00D26A', fg: '#111111' },
  WET:    { label: 'W', bg: '#2E9BFF', fg: '#FFFFFF' },
};
export function tyreStyle(compound) {
  return TYRE_STYLE[compound] || { label: '?', bg: '#555', fg: '#fff' };
}

export function teamColor(hex) {
  return hex ? `#${hex}` : '#555';
}

// Countdown parts between now and a target ISO date.
export function countdownParts(targetIso) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, past: diff <= 0 };
}

const pad = (n) => String(n).padStart(2, '0');
export function fmtCountdown({ d, h, m, s }) {
  return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function fmtDateTime(iso) {
  const dt = new Date(iso);
  return dt.toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}
