import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D1A",
        surface: "#1B1238",
        "surface-raised": "#2D1B4E",
        border: "#FF3AF2",
        primary: "#FF3AF2",
        "primary-light": "#00F5D4",
        "primary-glow": "#FF3AF255",
        text: "#F8F8FF",
        secondary: "#DCD7FF",
        "text-accent": "#00F5D4",
        success: "#10B981",
        error: "#EF4444",
        "user-bubble": "#2D1B4E",
        "deep-void": "#0D0D1A",
        plasma: "#FFE600",
        ghost: "#FFFFFF",
        graphite: "#2D1B4E",
        max: {
          bg: "#0D0D1A",
          muted: "#2D1B4E",
          magenta: "#FF3AF2",
          cyan: "#00F5D4",
          yellow: "#FFE600",
          orange: "#FF6B35",
          purple: "#7B2FFF",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "Inter", "sans-serif"],
        heading: ["Outfit", "DM Sans", "sans-serif"],
        display: ["Bungee", "Outfit", "sans-serif"],
        serif: ["Outfit", "DM Sans", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config
