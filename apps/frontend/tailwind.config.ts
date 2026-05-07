import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        body:    ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        hearth: {
          bg:      "#F7F5F0",
          surface: "#FFFFFF",
          s2:      "#F2F0EB",
          accent:  "#E8714A",
          blue:    "#4A8FE7",
          green:   "#5BAD7F",
          amber:   "#F5A623",
          red:     "#E85454",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "22px",
      },
      boxShadow: {
        card:    "0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        "card-md": "0 6px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)",
      },
      animation: {
        "fade-up":    "fade-up 0.4s ease forwards",
        "blink-soft": "blink-soft 2s ease-in-out infinite",
        "shimmer":    "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
