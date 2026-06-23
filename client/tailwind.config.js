/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C89B3C',
          light: '#D4AE5A',
          dim: '#9A7628',
        },
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
      boxShadow: {
        'gold-ring': '0 0 0 1px rgba(200,155,60,0.3)',
        'card': '0 2px 8px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
        'glow': '0 0 24px rgba(200,155,60,0.18)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C89B3C 0%, #D4AE5A 50%, #9A7628 100%)',
        'surface-gradient': 'linear-gradient(180deg, #1B1B1B 0%, #111111 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 8s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
      },
    },
  },
  plugins: [],
};
