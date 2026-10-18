import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (/[/\\](react|react-dom|scheduler)[/\\]/.test(id)) return "react"
          if (/[/\\](framer-motion|motion-dom|motion-utils|gsap)[/\\]/.test(id)) return "motion"
          if (id.includes("lucide-react")) return "icons"
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
})
