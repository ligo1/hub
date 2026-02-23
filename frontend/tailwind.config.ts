import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0A0A0F',
          800: '#12121A',
          700: '#1C1C2E',
          600: '#252538',
          500: '#2E2E45',
        },
        accent: {
          purple: '#6B21A8',
          'purple-light': '#A855F7',
          blue: '#2563EB',
          'blue-light': '#60A5FA',
          pink: '#EC4899',
          gold: '#F59E0B',
          'gold-light': '#FCD34D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;
