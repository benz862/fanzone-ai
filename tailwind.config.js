/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leafs: '#00205B',
        leafsAccent: '#FFFFFF',
        darkbg: '#0f172a',
        cardbg: '#1e293b',
      }
    }
  },
  plugins: [],
}

