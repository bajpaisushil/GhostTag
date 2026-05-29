import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ghost: {
          bg: "#0b0f17",
          card: "#141a26",
          accent: "#22d3ee",
          danger: "#f43f5e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
