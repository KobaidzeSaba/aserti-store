import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ASERTI brandbook palette — strictly monochrome.
        // Black (#000000), Mirror Silver (#252525), Industrial Gray
        // (#808080 / #4D4D4D), Glass/White (#FFFFFF).
        ink: {
          DEFAULT: "#000000", // black — absorbs light
          soft: "#101010", // near-black surface
          muted: "#252525", // mirror silver surface / hover
        },
        // "champagne" name kept so existing utility classes map to the new
        // monochrome accent (pure white / glass) — no gold anywhere.
        champagne: {
          DEFAULT: "#ffffff",
          light: "#ffffff",
          dark: "#9e9e9e",
        },
        silver: {
          DEFAULT: "#ededed", // primary text (near-white)
          muted: "#808080", // industrial gray — secondary text/borders
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
