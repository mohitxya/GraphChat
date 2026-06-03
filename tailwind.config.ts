import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#090b10",
        foreground: "#eef2f7",
        muted: "#9aa4b2",
        panel: "#11151d",
        panel2: "#151b25",
        border: "#273142",
        accent: "#38bdf8",
        gold: "#f6c85f",
        danger: "#ef4444"
      },
      boxShadow: {
        node: "0 24px 80px rgba(0,0,0,0.34)"
      }
    }
  },
  plugins: []
};

export default config;
