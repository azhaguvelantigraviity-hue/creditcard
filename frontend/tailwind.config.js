/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sbi: {
          blue: "#2c3e8c",
          light: "#f0f2f5",
          accent: "#00a1e1",
          hover: "#1e2b63",
        }
      }
    },
  },
  plugins: [],
}
