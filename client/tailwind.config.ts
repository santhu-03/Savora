import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#260B10', light: '#3d1219' },
        gold: { DEFAULT: '#BF8B5E', light: '#D9B89C', dark: '#a67748' },
        copper: { DEFAULT: '#A6523F', dark: '#733122' },
        cream: '#FDF8F3',
        charcoal: '#1a1a1a',
        // Legacy tokens (used by existing landing page)
        dark: '#111111',
        surface: { DEFAULT: '#1B1B1B', 2: '#222222', 3: '#2A2A2A', 4: '#333333' },
        'off-white': { DEFAULT: '#F7F5F2', 2: '#EDE9E3' },
        accent: { DEFAULT: '#7A5C2E', light: '#9A7A4A' },
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'gold-ring': '0 0 0 1.5px rgba(191,139,94,0.4)',
        card: '0 2px 12px rgba(38,11,16,0.06)',
        'card-hover': '0 12px 40px rgba(38,11,16,0.14)',
        glow: '0 0 24px rgba(191,139,94,0.22)',
        warm: '0 4px 24px rgba(166,82,63,0.14)',
        // Legacy
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card-hover-legacy': '0 8px 32px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #BF8B5E 0%, #D9B89C 50%, #a67748 100%)',
        'primary-gradient': 'linear-gradient(135deg, #260B10 0%, #3d1219 100%)',
        'cream-gradient': 'linear-gradient(180deg, #FDF8F3 0%, #F5EDE2 100%)',
        // Legacy
        'gold-gradient-legacy': 'linear-gradient(135deg, #C89B3C 0%, #D4AE5A 50%, #9A7628 100%)',
        'surface-gradient': 'linear-gradient(180deg, #1B1B1B 0%, #111111 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 8s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [forms, typography],
} satisfies Config;
