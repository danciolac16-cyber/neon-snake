/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        neon: '0 0 18px rgba(34, 211, 238, 0.65), 0 0 36px rgba(236, 72, 153, 0.28)',
        cell: '0 0 10px currentColor, 0 0 22px currentColor',
      },
      fontFamily: {
        display: ['Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
