import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0B14",
        surface: "#12131F",
        "surface-raised": "#1A1B2E",
        border: "#2A2B45",
        primary: "#14B8A6",
        "primary-light": "#67E8F9",
        "primary-glow": "#14B8A633",
        text: "#F8F8FF",
        secondary: "#9B9BC4",
        "text-accent": "#67E8F9",
        success: "#10B981",
        error: "#EF4444",
        "user-bubble": "#12312F",
        "deep-void": "#0A0A14",
        plasma: "#F59E0B",
        ghost: "#F0EFF4",
        graphite: "#18181B",
      },
      fontFamily: {
        sans: ["Sora", "Inter", "sans-serif"],
        serif: ["Instrument Serif", "serif"],
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config
