/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: 'var(--bg)',
          50: 'var(--surface-2)',
          100: 'var(--bg)',
          200: 'var(--surface-3)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-fg)',
          soft: 'var(--accent-soft)',
          50: '#ECFDF5',
          100: '#D9F0EC',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: 'var(--accent)',
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
          600: 'var(--accent)',
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
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
      },
      maxWidth: {
        site: '1680px',
      },
    },
  },
  plugins: [],
};
