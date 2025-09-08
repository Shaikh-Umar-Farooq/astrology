/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b35',
        'primary-hover': '#e55a2b',
        'bot-bg': '#fff9e6',
        'bot-border': '#ffe066',
        'border-gray': '#e5e5e5',
        'gray-light': '#f8f9fa',
        'gray-text': '#666',
        'gray-darker': '#333333',
        // Additional colors for formatted messages
        green: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
          800: '#166534',
        },
        red: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
          800: '#991b1b',
        },
        amber: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
          800: '#92400e',
        },
        blue: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
          800: '#1e40af',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        '1400': '1400px',
        '600': '600px',
      },
      gridTemplateColumns: {
        'desktop': '320px 1fr 320px',
        'tablet': '320px 1fr 320px',
      }
    },
  },
  plugins: [],
}
