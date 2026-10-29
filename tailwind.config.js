/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#FDF7F8',
          100: '#FBF0F2',
          200: '#F4D9DF',
          300: '#E7BDC7',
          400: '#D5A4AF',
          500: '#C496A1', // Primary Dusty Rose
          600: '#A97582',
          700: '#8C5A66',
          800: '#70434E',
          900: '#543039',
        },
        sage: {
          50: '#F5F7F3',
          100: '#EAF0E7',
          200: '#D5E0CF',
          300: '#BDCEB4',
          400: '#A6B89A',
          500: '#919D85', // Primary Muted Sage
          600: '#758269',
          700: '#5C6752',
          800: '#444C3D',
          900: '#2E332A',
        },
        lavender: {
          50: '#F8F7FA',
          100: '#EEEAF5',
          200: '#DDD6EB',
          300: '#C4BADB',
          400: '#A99EC0',
          500: '#8E88A3', // Primary Lavender Purple
          600: '#726C87',
          700: '#58536C',
          800: '#403C50',
          900: '#2A2735',
        },
        cream: {
          50: '#FAF8F3',
          100: '#F4EFE2',
          200: '#EBE1C6', // Primary Vintage Cream
          300: '#DFCFA7',
          400: '#CEB984',
          500: '#BAA267',
          600: '#98834F',
          700: '#75643B',
          800: '#544729',
          900: '#342B18',
        },
        ivory: '#FAF7F2',
        card: '#FDFBF7',
        cocoa: {
          50: '#F7F5F4',
          100: '#EDE9E7',
          200: '#D8D2CD',
          400: '#8A8079',
          600: '#5C524C',
          800: '#3D342F',
          900: '#28221E',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'Cambria', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(92, 82, 76, 0.05), 0 1px 3px 0 rgba(92, 82, 76, 0.03)',
        'soft-lg': '0 10px 25px -3px rgba(92, 82, 76, 0.08), 0 4px 10px -2px rgba(92, 82, 76, 0.04)',
        'rose-glow': '0 4px 20px -2px rgba(196, 150, 161, 0.25)',
        'sage-glow': '0 4px 20px -2px rgba(145, 157, 133, 0.25)',
      }
    },
  },
  plugins: [],
}

