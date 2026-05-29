/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        surface: '#141414',
        gold: '#FFD700',
        'gold-hi': '#FFE44D',
        muted: '#9ca3af',
        line: '#262626',
        orange: '#FF8C00',
        crimson: '#FF4444',
        violet: '#CC44FF',
        emerald: '#2ECC71',
        teal: '#00CED1',
      },
      fontFamily: {
        display: ['"Anton"', '"Archivo Black"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        'spin-slow': 'spin 1s linear infinite',
        equalize: 'equalize 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        equalize: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
