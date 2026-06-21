/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#1a202c", // Escuro/Azul Sigma
        },
        accent: {
          500: "#e2e8f0",
        }
      }
    },
  },
  plugins: [],
}
