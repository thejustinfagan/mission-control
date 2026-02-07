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
        midnight: {
          900: "#0b0f14",
          800: "#111826",
          700: "#162033",
          600: "#1b2840",
        },
        aurora: {
          400: "#6fffd2",
          500: "#54f0c1",
          600: "#38d7a9",
        },
        comet: {
          400: "#9aa4ff",
          500: "#7c86ff",
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(84, 240, 193, 0.2)",
        panel: "0 20px 60px rgba(3, 8, 20, 0.55)",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at top, rgba(84, 240, 193, 0.08), transparent 55%), radial-gradient(circle at 20% 20%, rgba(124, 134, 255, 0.1), transparent 40%)",
      },
    },
  },
  plugins: [],
};

export default config;
