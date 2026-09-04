import type { Config } from "tailwindcss";

// Design tokens for Hometown Hub: a "town-square notice board" identity —
// warm paper background, deep evergreen as the trusted/primary color, and a
// brick-lantern amber as the single warm accent used sparingly for action.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F3EC",
        ink: "#1E2A22",
        evergreen: {
          50: "#EEF3EE",
          100: "#D6E3D8",
          300: "#8FAE96",
          500: "#3F6B49",
          600: "#335A3C",
          700: "#294A30",
          900: "#152B1A",
        },
        lantern: {
          400: "#E8A33D",
          500: "#D98E1F",
          600: "#B8730F",
        },
        clay: "#C4633F",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        card: "0.625rem",
      },
    },
  },
  plugins: [],
};

export default config;
