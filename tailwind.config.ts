import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Neutral exhibition palette. Legacy token names also theme checkout/admin.
        ink: {
          DEFAULT: "#f3f2ed",
          soft: "#eeede7",
          muted: "#e4e3dc",
        },
        champagne: {
          DEFAULT: "#292923",
          light: "#292923",
          dark: "#46463f",
        },
        silver: {
          DEFAULT: "#292923",
          muted: "#727269",
        },
      },
      fontFamily: {
        serif: ["var(--font-sans)", "Arial", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
