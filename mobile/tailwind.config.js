/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:   '#260B10',
        'primary-light': '#3d1219',
        gold:      '#BF8B5E',
        'gold-light': '#D9B89C',
        'gold-dark': '#a67748',
        cream:     '#FDF8F3',
        charcoal:  '#1a1a1a',
        copper:    '#A6523F',
      },
      fontFamily: {
        display: ['CormorantGaramond_700Bold'],
        body:    ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
