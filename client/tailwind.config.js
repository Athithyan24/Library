/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        pine: 'rgb(var(--pine) / <alpha-value>)',
        brass: 'rgb(var(--brass) / <alpha-value>)',
        clay: 'rgb(var(--clay) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['Plus Jakarta Sans', 'Segoe UI', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 24px 50px -28px rgb(40 50 80 / 0.35)',
        card: '0 8px 24px -16px rgb(40 50 80 / 0.45)',
      },
    },
  },
  plugins: [],
};
