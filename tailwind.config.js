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
          50: '#FFF1F4',  // Landing page hero background
          100: '#FBE8EE', // Landing page lilac background
          200: '#F6DCE5', // Landing page light pink
          300: '#E8BAC9',
          400: '#D88FA6', // Landing page accent number / highlight
          500: '#B96F87', // Landing page dusty rose primary accent
          600: '#A15970',
          700: '#874358',
          800: '#672F41',
          900: '#4D1E2F',
        },
        sage: {
          50: '#F5F7F3',
          100: '#EAF0E7',
          200: '#D5E0CF',
          300: '#BDCEB4',
          400: '#A6B89A',
          500: '#919D85',
          600: '#758269',
          700: '#5C6752',
          800: '#444C3D',
          900: '#2E332A',
        },
        lavender: {
          50: '#FAF8FC',
          100: '#F1ECF7',
          200: '#E2D9EE',
          300: '#C8BCD9',
          400: '#A798BE',
          500: '#8E88A3',
          600: '#726C87',
          700: '#58536C',
          800: '#403C50',
          900: '#2A2735',
        },
        cream: {
          50: '#FFF8FA',
          100: '#FCEEF3',
          200: '#F7DDE6',
          300: '#EFC4D4',
          400: '#DF9DB5',
          500: '#B96F87',
          600: '#9E5B71',
          700: '#7E4255',
          800: '#592938',
          900: '#3D1B26',
        },
        ivory: '#FFF1F4',
        card: 'rgba(255, 255, 255, 0.82)',
        ink: '#3D2630',
        lilac: '#FBE8EE',
        cocoa: {
          50: '#FAF6F8',
          100: '#F3EBF0',
          200: '#E5D7DE',
          300: '#CEBBC4',
          400: '#A48693',
          500: '#886875', // Landing page muted text
          600: '#6E4F5D',
          700: '#573B49',
          800: '#462C38',
          900: '#3D2630', // Landing page primary ink
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        editorial: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(61, 38, 48, 0.05), 0 2px 6px -1px rgba(61, 38, 48, 0.03)',
        'soft-lg': '0 14px 34px -4px rgba(61, 38, 48, 0.08), 0 4px 12px -2px rgba(61, 38, 48, 0.04)',
        'glass': '0 8px 32px 0 rgba(61, 38, 48, 0.06)',
        'rose-glow': '0 4px 20px -2px rgba(216, 143, 166, 0.35)',
        'sage-glow': '0 4px 20px -2px rgba(145, 157, 133, 0.25)',
      }
    },
  },
  plugins: [],
}
