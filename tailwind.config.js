/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        roast: { 50: '#faf6f2', 100: '#f0e6db', 500: '#8b5a3c', 700: '#5c3a24', 900: '#2e1d12' },
      },
    },
  },
  plugins: [],
};
