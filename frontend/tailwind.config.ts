import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        iua: {
          navy: "#0B1F3A",
          teal: "#0D9488",
          gold: "#C4A35A",
          sand: "#F7F5F2",
          ink: "#0A0F1A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(13,148,136,0.22), transparent), radial-gradient(ellipse 60% 50% at 80% 10%, rgba(196,163,90,0.18), transparent), linear-gradient(160deg, #0B1F3A 0%, #123053 45%, #0A1628 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
