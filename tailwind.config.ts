import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ASERTI palette: charcoal + champagne gold + silver
        ink: {
          DEFAULT: "#0e0e10",
          soft: "#17171b",
          muted: "#24242b",
        },
        champagne: {
          DEFAULT: "#c8a96a",
          light: "#e3cd9c",
          dark: "#a5854b",
        },
        silver: {
          DEFAULT: "#d8d8dc",
          muted: "#9a9aa2",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
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
