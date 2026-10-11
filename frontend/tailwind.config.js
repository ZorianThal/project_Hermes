/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper, #09090b)',
        'paper-soft': 'var(--color-paper-soft, #050507)',
        ink: 'var(--color-ink, #f4f4f5)',
        accent: 'var(--color-accent, #FF5500)',
        'accent-soft': 'var(--color-accent-soft, rgba(255, 85, 0, 0.15))',
      },
      fontFamily: {
        bit: ['"Bitcount Grid Single"', '"Kode Mono"', 'monospace'],
        mono: ['"Kode Mono"', 'ui-monospace', 'monospace'],
        chart: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
