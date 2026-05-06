/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#f2d00d", // Updated Dashboard Yellow
        secondary: "#1a2538", // Deep navy
        "background-light": "#fcfbf8",
        "background-dark": "#221f10",
        "surface-light": "#ffffff",
        "border-light": "#e5e3d7",
        "text-primary-light": "#1c1a0d",
        "text-secondary-light": "#7c754d",
        "status-green": "#10b981",
        "status-purple": "#8b5cf6",
        "status-orange": "#f97316",
        "status-grey": "#64748b",
        "status-red": "#ef4444",
        "status-yellow": "#eab308"
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
