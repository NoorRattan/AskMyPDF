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
        primary: "#7C3AED",
        "primary-light": "#A78BFA",
        "primary-glow": "#7C3AED33",
        text: "#F8F8FF",
        secondary: "#9B9BC4",
        "text-accent": "#A78BFA",
        success: "#10B981",
        error: "#EF4444",
        "user-bubble": "#1E1B4B",
        "deep-void": "#0A0A14",
        plasma: "#7B61FF",
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
