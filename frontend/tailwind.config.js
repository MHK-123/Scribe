/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:       '#020209',
        surface:          'rgba(8, 8, 24, 0.85)',
        'surface-hover':  'rgba(14, 14, 36, 0.95)',
        'surface-solid':  '#0d0d20',
        border:           'rgba(75, 139, 245, 0.12)',
        'border-bright':  'rgba(75, 139, 245, 0.35)',
        accent:           '#4b8bf5',
        'accent-purple':  '#7b5cf0',
        'accent-cyan':    '#00d4ff',
        'text-primary':   '#e2e8f0',
        'text-muted':     '#8892b0',
      },
      fontFamily: {
        sans:    ['Rajdhani', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-blue':   '0 0 20px rgba(75,139,245,0.3), 0 0 40px rgba(75,139,245,0.1)',
        'glow-purple': '0 0 20px rgba(123,92,240,0.3), 0 0 40px rgba(123,92,240,0.1)',
        'glow-cyan':   '0 0 20px rgba(0,212,255,0.3)',
        'panel':       '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(75,139,245,0.06)',
      },
      animation: {
        'glow-pulse':  'glow-pulse 3s ease-in-out infinite',
        'rune-spin':   'rune-spin 8s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'scanline':    'scanline 4s linear infinite',
        'flicker':     'flicker 0.15s infinite',
        'gradient-x':  'gradient-x 15s ease infinite',
        'slide-up':    'slide-up 0.4s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(75,139,245,0.2), 0 0 20px rgba(75,139,245,0.05)' },
          '50%':      { boxShadow: '0 0 25px rgba(75,139,245,0.5), 0 0 50px rgba(75,139,245,0.15)' },
        },
        'rune-spin': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'scanline': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' },
        },
        'flicker': {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.85 },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: 'left center' },
          '50%':      { backgroundPosition: 'right center' },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
