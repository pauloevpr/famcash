const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      "serif": ["Mackinac", "ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
    },
    extend: {
      borderRadius: {
        DEFAULT: "0.75rem",
      },
      colors: {
        gray: colors.slate,
        primary: {
          ...colors.sky,
          DEFAULT: colors.sky['900'],
        },
        accent: {
          ...colors.fuchsia,
          DEFAULT: colors.fuchsia['600'],
        },
        negative: {
          ...colors.fuchsia,
          DEFAULT: colors.fuchsia['700'],
        },
        positive: {
          ...colors.sky,
          DEFAULT: colors.sky['700'],
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
        appear: 'appear 0.3s',
        'appear-bottom': 'appear-bottom 0.3s',
        'appear-top': 'appear-top 0.3s',
        'shrink-in': 'shrink-in 0.3s',
        'fade-in': 'fade-in 0.3s',
        'fade-in-slow': 'fade-in 1s',
      },
      keyframes: {
        appear: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'appear-bottom': {
          '0%': { transform: 'translateY(32px)', opacity: '1' },
          '60%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'appear-top': {
          '0%': { transform: 'translateY(-128px)', opacity: '0' },
          '60%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
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

