import { palette, shadowRgb } from './src/theme/palette.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Todas as cores vêm de src/theme/palette.js (fonte única). "slate" é substituído por uma
      // escala neutra quente; "navy" mantém o nome usado pelos componentes, agora em grafite vinho.
      colors: {
        navy: palette.navy,
        brand: palette.brand,
        surface: palette.surface,
        line: palette.line,
        ink: palette.ink,
        muted: palette.muted,
        slate: palette.slate,
        success: palette.success,
        warning: palette.warning,
        danger: palette.danger,
        geo: palette.geo,
        rating: palette.rating,
        'map-bg': palette.mapBg,
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      boxShadow: {
        card: `0 1px 2px rgba(${shadowRgb},.04), 0 2px 8px rgba(${shadowRgb},.05)`,
        lift: `0 4px 10px rgba(${shadowRgb},.06), 0 12px 32px rgba(${shadowRgb},.09)`,
        panel: `0 10px 40px rgba(${shadowRgb},.18)`,
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
