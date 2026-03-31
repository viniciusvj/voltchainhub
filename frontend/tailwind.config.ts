import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        electric: "#0066FF",
        solar: "#FFB800",
        "volt-dark": {
          900: "#0A0A0F",
          800: "#12121A",
          700: "#1A1A25",
          600: "#222230",
        },
      },
    },
  },
  plugins: [],
};

export default config;
