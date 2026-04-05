/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:       '#020205',
        surface:          'rgba(10, 10, 18, 0.75)',
        'surface-hover':  'rgba(18, 18, 32, 0.85)',
        'stone-base':     '#0a0a0f',
        'stone-light':    '#1c1c28',
        border:           'rgba(75, 139, 245, 0.12)',
        'border-magic':   'rgba(75, 139, 245, 0.35)',
        'torch-amber':    '#ff9d1c',
        'magic-blue':     '#4b8bf5',
        'magic-purple':   '#7b5cf0',
        'text-primary':   '#e2e8f0',
        'text-muted':     '#94a3b8',
      },
      fontFamily: {
        sans:    ['Rajdhani', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'rune-blue':   '0 0 15px rgba(75,139,245,0.4), 0 0 30px rgba(75,139,245,0.15)',
        'rune-purple': '0 0 15px rgba(123,92,240,0.4), 0 0 30px rgba(123,92,240,0.15)',
        'torch':       '0 0 20px rgba(255,157,28,0.3)',
        'panel-glow':  '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'rune-pulse':  'rune-pulse 3s ease-in-out infinite',
        'fire-burst':  'fire-burst 0.5s ease-out forwards',
        'float-slow':   'float-slow 8s ease-in-out infinite',
        'ember-rise':  'ember-rise 4s linear infinite',
      },
      keyframes: {
        'rune-pulse': {
          '0%, 100%': { opacity: 0.8, filter: 'drop-shadow(0 0 8px rgba(75,139,245,0.5))' },
          '50%':      { opacity: 1,   filter: 'drop-shadow(0 0 20px rgba(75,139,245,0.8))' },
        },
        'fire-burst': {
          '0%':   { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(2.5)', opacity: 0 },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-20px) rotate(1deg)' },
        },
        'ember-rise': {
          '0%':   { transform: 'translateY(0) translateX(0)', opacity: 0 },
          '10%':  { opacity: 1 },
          '100%': { transform: 'translateY(-100px) translateX(20px)', opacity: 0 },
        },
      }
    },
  },
  plugins: [],
}
