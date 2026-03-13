/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        page:    '#f5f5f9',
        card:    '#ffffff',
        primary: '#6366f1',
        'primary-light': '#ede9fe',
        'primary-dark':  '#4f46e5',
        muted:   '#64748b',
        border:  '#e2e8f0',
        sidebar: '#ffffff',
      },
      fontFamily: {
        sans: ['system-ui','-apple-system','BlinkMacSystemFont','Inter','Segoe UI','sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)',
        pop:  '0 4px 16px rgba(99,102,241,0.12)',
      },
    },
  },
  plugins: [],
}
