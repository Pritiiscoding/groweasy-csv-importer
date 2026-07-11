/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F1115",
          soft: "#171A21",
          line: "#262B36",
        },
        amber: {
          DEFAULT: "#E8A33D",
          soft: "#F4C978",
        },
        signal: {
          good: "#4FD1C5",
          bad: "#E86A6A",
        },
        mist: {
          DEFAULT: "#E7E9EE",
          muted: "#8B92A5",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
