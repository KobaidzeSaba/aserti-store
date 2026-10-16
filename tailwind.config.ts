import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Black, silver and graphite. Shared tokens also theme checkout and admin.
        ink: {
          DEFAULT: "#000000",
          soft: "#111111",
          muted: "#1c1c1c",
        },
        champagne: {
          DEFAULT: "#f0f0ec",
          light: "#f0f0ec",
          dark: "#c7c7c2",
        },
        silver: {
          DEFAULT: "#f0f0ec",
          muted: "#a0a09b",
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
