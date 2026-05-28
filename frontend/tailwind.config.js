/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#15803D",
          600: "#166534",
          700: "#14532D",
          800: "#104026",
          900: "#0B2F1C",
          950: "#052E16",
        },
        secondary: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#059669",
          600: "#047857",
          700: "#065F46",
          800: "#064E3B",
          900: "#022C22",
        },
        accent: {
          50: "#F7FEE7",
          100: "#ECFCCB",
          200: "#D9F99D",
          300: "#BEF264",
          400: "#A3E635",
          500: "#84CC16",
          600: "#65A30D",
          700: "#4D7C0F",
          800: "#3F6212",
          900: "#365314",
        },
        status: {
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
          info: "#059669",
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
