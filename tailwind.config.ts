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
        brand: {
          slate: {
            50: "#F8FAFC",
            100: "#F1F5F9",
            200: "#E2E8F0",
            800: "#1E293B",
            900: "#0F172A",
            950: "#020617",
          },
          teal: {
            500: "#14B8A6",
            600: "#0D9488",
            700: "#0F766E",
          },
          rose: {
            500: "#F43F5E",
            600: "#E11D48",
          },
        },
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-roboto-mono)", "ui-monospace", "SFMono-Regular"],
      },
    },
  },
  plugins: [],
};
export default config;
