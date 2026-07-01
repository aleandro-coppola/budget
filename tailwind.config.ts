import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ale: "#2563eb",
        cris: "#db2777",
      },
    },
  },
  plugins: [],
};

export default config;
