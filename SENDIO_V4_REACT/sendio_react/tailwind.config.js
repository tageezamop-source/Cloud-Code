/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#07101e',
          surface: '#0d1829',
          card: '#131f35',
        },
        accent: {
          indigo: '#6366f1',
          purple: '#8b5cf6',
        },
        text: {
          primary: '#f0f4ff',
          muted: '#8b9ab5',
        },
        border: 'rgba(99,102,241,0.15)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
