import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        phone: { max: "679px" },
        tablet: { max: "1039px" },
        desktop: "1040px",
      },
      colors: {
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        paper: "var(--paper)",
        panel: "var(--panel)",
        mint: {
          DEFAULT: "var(--mint)",
          soft: "var(--mint-soft)",
        },
        coral: {
          DEFAULT: "var(--coral)",
          soft: "var(--coral-soft)",
        },
        amber: {
          DEFAULT: "var(--amber)",
          soft: "var(--amber-soft)",
        },
        blue: {
          DEFAULT: "var(--blue)",
          soft: "var(--blue-soft)",
        },
        charcoal: "var(--charcoal)",
        cream: "var(--cream)",
      },
      boxShadow: {
        os: "var(--shadow-hero)",
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        os: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
