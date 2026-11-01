/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#151B31',
        panel: '#0C0E1A',
        row: '#161A33',
        rowalt: '#1B2040',
        f1red: '#E10600',
        gold: '#FFD700',
        sessionbest: '#B14BF4',
        personalbest: '#00D26A',
        muted: '#8A90B8',
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'Arial Narrow', 'sans-serif'],
        arcade: ['"Press Start 2P"', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
