/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: '#1d1410',
        roast: '#4a2e20',
        crema: { DEFAULT: '#c9772f', light: '#f5e6d6' },
        foam: '#fbf9f6',
        line: '#ece4da',
        muted: '#7a6a5f',
        sage: '#2e7a55',
        brick: '#b4442f',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
