/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#06070a",
        darkSurface: "#0f111a",
        accentCyan: "#06b6d4",
        accentBlue: "#3b82f6",
        accentPurple: "#8b5cf6",
        neonGreen: "#10b981",
        neonYellow: "#fbbf24",
      },
      boxShadow: {
        glow: "0 0 20px rgba(6, 182, 212, 0.15)",
        glowStrong: "0 0 35px rgba(6, 182, 212, 0.3)",
      },
    },
  },
  plugins: [],
};
