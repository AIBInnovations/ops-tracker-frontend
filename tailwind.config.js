/** @type {import('tailwindcss').Config} */

/** Semantic colour built from the RGB channels held in a CSS variable. */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Height-gated variant. The nav rail must fit its items on a laptop, so
      // decorative blocks below the nav only appear on genuinely tall windows.
      screens: {
        tall: { raw: '(min-height: 900px)' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans Variable', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'Plus Jakarta Sans Variable', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        app: c('app'),
        ink: {
          DEFAULT: c('ink'),
          hover: c('ink-hover'),
        },
        pink: {
          DEFAULT: c('brand-pink'),
          soft: c('brand-pink-soft'),
        },
        surface: {
          DEFAULT: c('surface'),
          raised: c('surface-raised'),
          sunken: c('surface-sunken'),
          hover: c('surface-hover'),
          active: c('surface-active'),
          selected: c('surface-selected'),
        },
        line: {
          DEFAULT: c('line'),
          subtle: c('line-subtle'),
          strong: c('line-strong'),
        },
        fg: {
          DEFAULT: c('fg'),
          muted: c('fg-muted'),
          subtle: c('fg-subtle'),
          faint: c('fg-faint'),
          inverted: c('fg-inverted'),
        },
        accent: {
          DEFAULT: c('accent'),
          track: c('accent-track'),
          hover: c('accent-hover'),
          active: c('accent-active'),
          fg: c('accent-fg'),
          soft: c('accent-soft'),
          softhover: c('accent-soft-hover'),
          border: c('accent-border'),
          on: c('on-accent'),
        },
        success: {
          DEFAULT: c('success'),
          fg: c('success-fg'),
          soft: c('success-soft'),
          border: c('success-border'),
        },
        warning: {
          DEFAULT: c('warning'),
          fg: c('warning-fg'),
          soft: c('warning-soft'),
          border: c('warning-border'),
        },
        danger: {
          DEFAULT: c('danger'),
          fg: c('danger-fg'),
          soft: c('danger-soft'),
          border: c('danger-border'),
        },
        info: {
          DEFAULT: c('info'),
          fg: c('info-fg'),
          soft: c('info-soft'),
          border: c('info-border'),
        },
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.02em' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['14px', { lineHeight: '20px' }],
        lg: ['15px', { lineHeight: '22px' }],
        xl: ['19px', { lineHeight: '27px', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.025em' }],
        '4xl': ['38px', { lineHeight: '44px', letterSpacing: '-0.03em' }],
      },
      fontWeight: {
        normal: '450',
        medium: '520',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        xs: '6px',
        sm: '9px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '26px',
        '3xl': '32px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        ring: 'var(--shadow-ring)',
        card: 'var(--shadow-card)',
        // Not `accent` — that would collide with the `shadow-{color}` utility
        // Tailwind derives from the colour palette.
        glow: 'var(--shadow-accent)',
        popover: 'var(--shadow-ring), var(--shadow-lg)',
        modal: 'var(--shadow-ring), var(--shadow-xl)',
      },
      // Keys here must not collide with a `colors` key, or `bg-*` would emit
      // both a background-color and a background-image under one class.
      // Keys must not collide with a `colors` key, or `bg-*` would emit both a
      // background-color and a background-image under one class.
      backgroundImage: {
        brand: 'var(--gradient-accent)',
        'brand-deep': 'var(--gradient-accent-deep)',
      },
      spacing: {
        4.5: '18px',
        13: '52px',
        15: '60px',
        18: '72px',
        58: '236px',
        68: '272px',
      },
      zIndex: {
        sticky: '20',
        header: '30',
        overlay: '50',
        drawer: '60',
        modal: '70',
        popover: '80',
        toast: '90',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97) translateY(4px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        'pulse-dot': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: {
        'fade-in': 'fade-in 140ms ease-out',
        'scale-in': 'scale-in 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slide-right 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-in': 'toast-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
