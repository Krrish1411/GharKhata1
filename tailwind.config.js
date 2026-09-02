/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#101B2D',
          800: '#1A2A3F',
          700: '#253A52',
        },
        marigold: {
          400: '#E8A33D',
          500: '#D49132',
          600: '#C08028',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

