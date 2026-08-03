/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1e293b',
          light: '#475569',
          faint: '#94a3b8',
          bg: '#f8fafc',
          line: '#e2e8f0',
        },
        brand: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        ok: '#16a34a',
        warn: '#f59e0b',
        bad: '#dc2626',
      },
      fontSize: {
        xs: ['0.8125rem', '1.125rem'],
        sm: ['0.9375rem', '1.375rem'],
        base: ['1.0625rem', '1.6'],
        lg: ['1.25rem', '1.75rem'],
        xl: ['1.375rem', '1.75rem'],
        '2xl': ['1.6rem', '2rem'],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
