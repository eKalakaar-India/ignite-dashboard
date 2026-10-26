/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12172E',
        cloud: '#F5F7FC',
        primary: {
          50: '#EEF1FB',
          100: '#DCE3F7',
          200: '#B7C4EE',
          300: '#8FA0E2',
          400: '#647BD3',
          500: '#3E52B8',
          600: '#2F3E9E',
          700: '#242F7D',
          800: '#1B2361',
          900: '#131B3A',
        },
        bloom: {
          light: '#FBE6EA',
          DEFAULT: '#E8546B',
          dark: '#C43A50',
        },
        growth: {
          light: '#E1F5F0',
          DEFAULT: '#12896F',
          dark: '#0C6B56',
        },
        amber: {
          light: '#FCF1DF',
          DEFAULT: '#E8A33D',
          dark: '#C0821F',
        },
        danger: {
          light: '#FBE7E5',
          DEFAULT: '#E1493C',
          dark: '#B93327',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(19, 27, 58, 0.04), 0 8px 24px -8px rgba(19, 27, 58, 0.10)',
        'card-hover': '0 4px 10px rgba(19, 27, 58, 0.06), 0 16px 32px -12px rgba(19, 27, 58, 0.16)',
        drawer: '-8px 0 32px -8px rgba(19, 27, 58, 0.20)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
        slideIn: 'slideIn 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
        slideInLeft: 'slideInLeft 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [],
}
