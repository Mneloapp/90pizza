import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pizzaRed: "#E01010",
        pizzaBlack: "#111111",
        kraft: "#B98252",
        softGray: "#F4F4F4",
      },
      boxShadow: {
        premium: "0 30px 80px rgba(17, 17, 17, 0.18)",
        redGlow: "0 24px 70px rgba(224, 16, 16, 0.24)",
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(circle at 20% 20%, rgba(185,130,82,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(224,16,16,0.12), transparent 28%)",
      },
    },
  },
  plugins: [],
};

export default config;
