/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Identidade Jobs Maricá
        navy: { DEFAULT: '#101827', 800: '#1B2537', 700: '#27324A' },
        brand: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#60A5FA', soft: '#EFF4FF', ring: '#BFD3FE' },
        surface: '#F4F7FB',
        line: '#E2E8F0',
        ink: '#0F172A',
        muted: '#64748B',
        success: { DEFAULT: '#15803D', soft: '#F0FDF4' },
        warning: { DEFAULT: '#B45309', soft: '#FFFBEB' },
        danger: { DEFAULT: '#B91C1C', soft: '#FEF2F2' },
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.05)',
        lift: '0 4px 10px rgba(15,23,42,.06), 0 12px 32px rgba(15,23,42,.08)',
        panel: '0 10px 40px rgba(15,23,42,.16)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
        'slide-in': 'slide-in .25s ease-out',
        'slide-up': 'slide-up .25s ease-out',
        'slide-in-left': 'slide-in-left .25s ease-out',
      },
    },
  },
  plugins: [],
};
