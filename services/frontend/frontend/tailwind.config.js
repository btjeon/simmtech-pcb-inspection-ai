/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palantir-inspired Dark Theme
        background: {
          primary: '#0F1117',
          secondary: '#1E2130',
          elevated: 'rgba(30, 33, 48, 0.95)',
          card: '#1A1E2E',
        },
        accent: {
          primary: '#00E3AE',
          secondary: '#00b894',
          hover: '#00FFC8',
        },
        text: {
          primary: '#E1E5E9',
          secondary: '#9BA1A8',
          muted: '#6C7178',
        },
        status: {
          success: '#00E676',
          warning: '#FFB300',
          error: '#FF5252',
          info: '#00D9FF',
        },
        border: {
          DEFAULT: '#2C3038',
          light: '#3A3F4B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 227, 174, 0.3)',
        'glow-md': '0 0 20px rgba(0, 227, 174, 0.4)',
        'glow-lg': '0 0 30px rgba(0, 227, 174, 0.5)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #00E3AE, #00b894)',
        'gradient-dark': 'linear-gradient(180deg, #0F1117, #1E2130)',
      },
    },
  },
  plugins: [],
};
