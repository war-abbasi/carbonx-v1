/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── CSS-variable-driven theme tokens (auto dark/light) ──
        background: 'var(--bg)',
        elevated:   'var(--bg-elevated)',
        card:       'var(--bg-card)',
        surface:    'var(--surface)',
        foreground: 'var(--text)',
        muted:      'var(--text-muted)',
        dim:        'var(--text-dim)',
        accent: {
          DEFAULT: 'var(--accent)',
          warm:    'var(--accent-warm)',
          blue:    'var(--accent-blue)',
          gold:    'var(--accent-gold)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
        danger: 'var(--danger)',

        // ── Static palette (for non-themed use) ──
        emerald: {
          50:  '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46',
          900: '#064e3b', 950: '#022c22',
        },
        gold: {
          DEFAULT: '#c8a84b',
          light:   '#d4af37',
          dark:    '#a88118',
          muted:   'rgba(200, 168, 75, 0.15)',
        },
      },

      fontFamily: {
        sans:    ['DM Sans',         'system-ui', 'sans-serif'],
        display: ['Instrument Serif','Georgia',   'serif'],
        mono:    ['JetBrains Mono',  'monospace'],
      },

      backgroundImage: {
        'hero-gradient':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(var(--accent-rgb),0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 0% 70%, rgba(var(--accent-rgb),0.06) 0%, transparent 50%), radial-gradient(ellipse 40% 40% at 100% 40%, rgba(200,168,75,0.04) 0%, transparent 50%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(var(--accent-rgb),0.06) 0%, transparent 100%)',
      },

      boxShadow: {
        'glow-sm': '0 0 15px rgba(var(--accent-rgb),0.25)',
        'glow-md': '0 0 30px rgba(var(--accent-rgb),0.35)',
        'glow-lg': '0 0 60px rgba(var(--accent-rgb),0.4)',
        'card':    'var(--shadow-md)',
        'card-lg': 'var(--shadow-lg)',
        'auth':    'var(--shadow-lg), 0 0 60px rgba(var(--accent-rgb),0.08)',
      },

      animation: {
        'float':       'float 6s ease-in-out infinite',
        'float-slow':  'float 10s ease-in-out infinite',
        'float-gold':  'float 8s ease-in-out 2s infinite',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':     'fadeIn 0.6s ease-out',
        'fade-in-up':  'fadeInUp 0.7s ease-out',
        'slide-left':  'slideInLeft 0.5s ease-out',
        'bar-grow':    'barGrow 1s var(--ease-out) forwards',
        'orb-1':       'orb1 15s ease-in-out infinite',
        'orb-2':       'orb2 20s ease-in-out infinite',
        'orb-3':       'orb3 18s ease-in-out infinite',
      },

      keyframes: {
        float:       { '0%,100%': { transform: 'translateY(0)' },       '50%': { transform: 'translateY(-16px)' } },
        fadeIn:      { '0%': { opacity: '0' },                           '100%': { opacity: '1' } },
        fadeInUp:    { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        barGrow:     { '0%': { height: '0%' },                           '100%': {} },
        orb1: { '0%,100%': { transform: 'translate(0,0) scale(1)' },    '33%': { transform: 'translate(30px,-50px) scale(1.1)' },   '66%': { transform: 'translate(-20px,20px) scale(0.9)' } },
        orb2: { '0%,100%': { transform: 'translate(0,0) scale(1)' },    '50%': { transform: 'translate(-40px,30px) scale(1.15)' } },
        orb3: { '0%,100%': { transform: 'translate(0,0) scale(1)' },    '40%': { transform: 'translate(20px,-30px) scale(1.05)' },  '80%': { transform: 'translate(-10px,40px) scale(0.95)' } },
      },
    },
  },
  plugins: [],
};
