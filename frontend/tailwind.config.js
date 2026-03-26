/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e9fcf1",
          100: "#d3f8e4",
          200: "#a6f2c8",
          300: "#7aebad",
          400: "#4ee491",
          500: "#21de76",
          600: "#1bb15e",
          700: "#148547",
          800: "#0d592f",
          900: "#072c18",
          950: "#051f11",
        },
        status: {
          success: "#21de76",
          warning: "#4ee491",
          danger: "#072c18",
          info: "#7aebad",
        },
        surface: {
          app: "rgb(var(--tw-surface-app) / <alpha-value>)",
          card: "rgb(var(--tw-surface-card) / <alpha-value>)",
          border: "rgb(var(--tw-surface-border) / <alpha-value>)",
          soft: "rgb(var(--tw-surface-soft) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--tw-ink) / <alpha-value>)",
          muted: "rgb(var(--tw-ink-muted) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
}
