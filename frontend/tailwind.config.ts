import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        iua: {
          navy: "#0A2342",
          blue: "#1B4F8A",
          cyan: "#3DB8E8",
          sky: "#6EC8EF",
          sun: "#F0A202",
          mist: "#F3F7FB",
          ink: "#122033",
          muted: "#5B6B7C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(10, 35, 66, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
