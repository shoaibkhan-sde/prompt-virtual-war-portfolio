/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F0E",
        surface: "#121816",
        border: "#222c29",
        muted: "#8a9a95",
        accent: {
          teal: "#06b6d4",
          amber: "#f59e0b",
          red: "#ef4444",
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
}
