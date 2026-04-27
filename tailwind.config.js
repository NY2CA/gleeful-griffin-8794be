/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:        'var(--navy)',
        'navy-deep': 'var(--navy-deep)',
        'navy-soft': 'var(--navy-soft)',
        gold:        'var(--gold)',
        'gold-bright': 'var(--gold-bright)',
        'gold-deep': 'var(--gold-deep)',
        cream:       'var(--cream)',
        'cream-warm': 'var(--cream-warm)',
        ink:         'var(--ink)',
        'ink-dim':   'var(--ink-dim)',
        'ink-mute':  'var(--ink-mute)',
        line:        'var(--line)',
        'line-dark': 'var(--line-dark)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:  '0 30px 60px -20px rgba(15, 30, 61, 0.30)',
        soft:  '0 20px 40px -16px rgba(15, 30, 61, 0.12)',
        lift:  '0 20px 40px -16px rgba(15, 30, 61, 0.35)',
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
