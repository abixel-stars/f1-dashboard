/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // GRIDX / data-terminal tokens: near-black F1 broadcast ground,
        // flat surfaces one lightness step apart, F1 red #E10600 as the
        // single accent (selection lines, live marks, key actions).
        ground: '#0B0B0D',
        surface: '#141417',
        raised: '#1D1D21',
        rule: '#26262B',
        ink: '#F4F4F5',
        muted: '#8B8C92',
        f1red: '#E10600',
        sessionbest: '#B14BF4',
        personalbest: '#00D26A',
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'Arial Narrow', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
