/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sigma: {
          bg: { primary: '#0a0a0f', secondary: '#12121a' },
          glass: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
          accent: { DEFAULT: '#6c5ce7', glow: '#a29bfe' },
          text: { primary: '#e8e8ed', secondary: '#6b6b7b', accent: '#6c5ce7' },
          success: '#00b894',
          danger: '#ff6b6b',
          code: '#1a1a2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(108,92,231,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(108,92,231,0.6)' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
