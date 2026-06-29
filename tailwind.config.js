/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F7F5F0',
          50: '#FAF8F3',
          100: '#F7F5F0',
          200: '#EFEBE2',
        },
        ink: {
          DEFAULT: '#14191E',
          muted: '#5A6168',
          faint: '#8A8F95',
        },
        accent: {
          DEFAULT: '#0F766E',
          fg: '#FFFFFF',
          soft: '#D9F0EC',
          50: '#ECFDF5',
          100: '#D9F0EC',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0F766E',
          700: '#0D5F58',
          800: '#115E59',
          900: '#134E4A',
        },
        primary: {
          50: '#ECFDF5',
          100: '#D9F0EC',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0F766E',
          700: '#0D5F58',
          800: '#115E59',
          900: '#134E4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        arabic: ['Amiri', 'serif'],
      },
      borderRadius: {
        editorial: '20px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        card: '0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)',
        lift: '0 20px 60px rgba(0,0,0,0.12)',
      },
      maxWidth: {
        site: '1680px',
      },
    },
  },
  plugins: [],
};
