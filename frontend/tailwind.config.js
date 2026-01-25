/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ocean depths palette for blue carbon theme
        ocean: {
          50: '#effcfc',
          100: '#d6f5f7',
          200: '#b2ebef',
          300: '#7ddce3',
          400: '#40c4d0',
          500: '#24a8b6',
          600: '#21879a',
          700: '#226d7d',
          800: '#245967',
          900: '#224a57',
          950: '#11303b',
        },
        // Coastal teal
        coastal: {
          50: '#f0fdfa',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5fe9ce',
          400: '#2dd4b8',
          500: '#14b8a0',
          600: '#0d9482',
          700: '#0f766a',
          800: '#115e56',
          900: '#134e48',
          950: '#042f2e',
        },
        // Kelp green
        kelp: {
          50: '#f0fdf5',
          100: '#dcfce8',
          200: '#bbf7d1',
          300: '#86efab',
          400: '#4ade7c',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803c',
          800: '#166533',
          900: '#14532b',
          950: '#052e14',
        },
        // Slate for dark mode
        slate: {
          850: '#1a2332',
          925: '#0f1623',
        },
        // Theme-aware surface colors
        surface: {
          light: '#f8fafc',
          DEFAULT: '#f1f5f9',
          dark: '#0f172a',
          card: {
            light: '#ffffff',
            dark: '#1e293b',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ocean-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d4f61 100%)',
        'ocean-light': 'linear-gradient(135deg, #f0fdfa 0%, #ccfbef 50%, #d6f5f7 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(36, 168, 182, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
      },
      backdropBlur: {
        'glass': '10px',
      },
      animation: {
        'ripple': 'ripple 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        ripple: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-5px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
      },
    },
  },
  plugins: [],
}