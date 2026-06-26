/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sidebar / brand tokens
        primary: {
          DEFAULT: '#260B10',
          light: '#3d1219',
          hover: '#4a1720',
        },
        gold: {
          DEFAULT: '#BF8B5E',
          light: '#D9B89C',
          dark: '#a67748',
          dim: '#9A7628',
        },
        copper: {
          DEFAULT: '#A6523F',
          dark: '#733122',
        },
        cream: {
          DEFAULT: '#FDF8F3',
          2: '#F5EDE0',
          3: '#EDE0CE',
        },
        charcoal: '#1a1a1a',
        // Dark panel tokens (kept for glass overlays / command palette)
        dark: '#111111',
        surface: {
          DEFAULT: '#1B1B1B',
          2: '#222222',
          3: '#2A2A2A',
          4: '#333333',
        },
        'off-white': {
          DEFAULT: '#F7F5F2',
          2: '#EDE9E3',
        },
        accent: {
          DEFAULT: '#7A5C2E',
          light: '#9A7A4A',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      width: {
        sidebar: '280px',
        'sidebar-collapsed': '72px',
      },
      boxShadow: {
        'gold-ring': '0 0 0 1px rgba(191,139,94,0.3)',
        card: '0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.12)',
        glow: '0 0 24px rgba(191,139,94,0.2)',
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        sidebar: '4px 0 24px rgba(0,0,0,0.2)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'slide-in': 'slide-in 0.2s ease forwards',
        'fade-up': 'fade-up 0.3s cubic-bezier(0.22,1,0.36,1) forwards',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
