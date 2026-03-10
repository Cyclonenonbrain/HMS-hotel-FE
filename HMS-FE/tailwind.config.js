/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#eccb13", // Updated Dashboard Yellow
        secondary: "#1a2538", // Deep navy
        "background-light": "#f8f8f6",
        "background-dark": "#221f10",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
