/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6fff7',
          100: '#ccfff0',
          200: '#99ffe0',
          300: '#66ffd1',
          400: '#33ffc1',
          500: '#00e5a0',
          600: '#00c98a',
          700: '#00ad74',
          800: '#00915f',
          900: '#007549',
        },
      },
    },
  },
  plugins: [],
}
