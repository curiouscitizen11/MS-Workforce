import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0b1a2e",
          50: "#E8EEF4",
          100: "#D1DDE9",
          200: "#A3BBD3",
          300: "#7599BD",
          400: "#4777A7",
          500: "#0b1a2e",
          600: "#081E33",
          700: "#061626",
          800: "#040F1A",
          900: "#02070D",
          alt: "#0e2240",
          card: "#152d4a",
          line: "#22354f",
        },
        body: "#c9d4e0",
        teal: {
          DEFAULT: "#2ec4b6",
          50: "#E6F7F5",
          100: "#CCEFEB",
          200: "#99DFD7",
          300: "#66CFC3",
          400: "#2ec4b6",
          500: "#0D9488",
          600: "#0F766E",
          700: "#085952",
          800: "#053B36",
          900: "#031E1B",
        },
      },
    },
  },
  plugins: [],
};
export default config;
