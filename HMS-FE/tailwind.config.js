/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#d4af37", // Gold accent cho LuxeCore
        "secondary": "#1a2538", // Deep navy
        "background-light": "#f6f6f8",
        "background-dark": "#0d131f", 
      },
      fontFamily: {
        "display": ["Outfit", "sans-serif"] //
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}