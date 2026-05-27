import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gallas: {
          red: "#C41E3A",
          "red-dark": "#8B0000",
          "red-light": "#E83A55",
          dark: "#0F0F0F",
          "dark-card": "#1A1A1A",
          "dark-border": "#2A2A2A",
          "dark-muted": "#3A3A3A",
          cream: "#F5F0E8",
          gold: "#D4A853",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
