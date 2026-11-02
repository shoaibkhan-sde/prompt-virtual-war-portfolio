import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jashn: {
          indigo: {
            DEFAULT: '#2E2A7A',
            50: '#F2F1FA',
            100: '#E4E2FA',
            200: '#C9C6F0',
            300: '#A9A5EE',
            400: '#7D77E4',
            500: '#5A53DA',
            600: '#413AC2',
            700: '#2E2A7A',
            800: '#1F1B58',
            900: '#14113D',
          },
          gold: {
            DEFAULT: '#F5A524',
            50: '#FEF8EC',
            100: '#FDF0D5',
            200: '#FCE0A7',
            300: '#FACF79',
            400: '#F7BD4F',
            500: '#F5A524',
            600: '#D78B13',
            700: '#A86B0B',
            800: '#7A4300',
            900: '#4F2B00',
          },
          berry: '#B83280',
          teal: '#0E6B6A',
          wine: '#8A2D6B',
          bg: '#F7F7FA',
          card: '#FFFFFF',
          text: '#14161C',
          muted: '#5B6070',
          border: '#E6E7EE',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        sway: {
          '0%': { transform: 'rotate(-7deg)' },
          '100%': { transform: 'rotate(7deg)' },
        },
        mq: {
          'to': { transform: 'translateX(-50%)' },
        },
        ring: {
          '0%': { strokeDashoffset: '565' },
          '60%, 100%': { strokeDashoffset: '170' },
        },
      },
      animation: {
        sway: 'sway 3.2s ease-in-out infinite alternate',
        marquee: 'mq 36s linear infinite',
        ring: 'ring 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
