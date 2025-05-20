/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      ...defaultTheme.screens,
    },
    extend: {
      colors: {
        // Base colors
        'bg-deep': '#0A0C12',
        'bg-surface': '#1A1E28',
        // Glass tint
        'glass': '#E0E5F2',
        // Neon colors
        'neon-primary': '#A0A7B8',
        'neon-secondary': '#5EEAFF',
        'neon-blue': '#00AAFF',
        'neon-purple': '#A855F7',
        'neon-pink': '#EC4899',
        'neon-cyan': '#00eaff',
        'neon-magenta': '#ec4899',
        'neon-glow': '#5EEAFF',
        // Accent colors
        'accent-alert': '#FF4A6D',
        'accent-success': '#00E5A0',
        'accent-warning': '#FFB800',
        'accent-info': '#7B8CFF',
        // Text colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#D0D5E2',
      },
      fontFamily: {
        'sans': ['Inter', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'panel-header': '1.125rem', // 18px
        'section-header': '1rem',    // 16px
        'body': '0.875rem',          // 14px
        'small': '0.75rem',          // 12px
        'metrics': '0.8125rem',      // 13px
      },
      backdropBlur: {
        'xs': '5px',
        'sm': '8px',
        'md': '10px',
        'lg': '15px',
        'xl': '20px',
      },
      boxShadow: {
        'neon': '0 0 5px rgba(160, 167, 184, 0.5), inset 0 0 5px rgba(160, 167, 184, 0.2)',
        'neon-active': '0 0 8px rgba(94, 234, 255, 0.6), inset 0 0 8px rgba(94, 234, 255, 0.3)',
        'neon-blue': '0 0 8px rgba(0, 170, 255, 0.6), inset 0 0 8px rgba(0, 170, 255, 0.3)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
        'card': '0 4px 10px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.35)',
        'neon-strong': '0 0 24px 4px rgba(0,234,255,0.45), 0 0 8px 2px rgba(0,170,255,0.25)',
        'neon-magenta': '0 0 24px 4px #ec4899, 0 0 8px 2px #ec4899',
        'neon-cyan': '0 0 24px 4px #00eaff, 0 0 8px 2px #00eaff',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(160, 167, 184, 0.5), inset 0 0 5px rgba(160, 167, 184, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(94, 234, 255, 0.8), inset 0 0 10px rgba(94, 234, 255, 0.4)' },
        }
      },
      transitionProperty: {
        'width': 'width',
        'height': 'height',
        'spacing': 'margin, padding',
      },
      textShadow: {
        'glow': '0 0 8px #00eaff, 0 0 2px #fff',
        'magenta': '0 0 8px #ec4899, 0 0 2px #fff',
        'blue': '0 0 8px #00aaff, 0 0 2px #fff',
      },
    },
  },
  plugins: [],
} 