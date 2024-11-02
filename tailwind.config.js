const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          ...colors.sky,
          DEFAULT: colors.sky['600'],
        },
        negative: {
          ...colors.pink,
          DEFAULT: colors.pink['600'],
        },
        positive: {
          ...colors.teal,
          DEFAULT: colors.teal['700'],
        },
        success: {
          ...colors.green,
          DEFAULT: colors.green['500'],
        },
        error: {
          ...colors.pink,
          DEFAULT: colors.pink['600'],
        },
      },
      aspectRatio: {
        vga: '4 / 3',
      },
      animation: {
        'shrink-in': 'shrink-in 0.3s',
        'fade-in': 'fade-in 0.3s',
        'fade-in-slow': 'fade-in 1s',
      },
      keyframes: {
        'shrink-in': {
          '0%': { transform: 'scale(1.10)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

