/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
        serif: ['Fraunces', 'Iowan Old Style', 'Palatino', 'serif'],
        sans: ['Figtree', 'Avenir Next', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 18px 40px -24px rgb(28 24 18 / 0.45)',
      },
    },
  },
  plugins: [],
};
