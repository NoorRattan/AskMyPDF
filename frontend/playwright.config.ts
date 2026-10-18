import { defineConfig, devices } from "@playwright/test"

const backendPython = process.env.BACKEND_PYTHON ?? "python"

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `${backendPython} -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: "../backend",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      env: {
        EMBEDDING_BACKEND: "hash",
        GROQ_API_KEY: "",
        ANTHROPIC_API_KEY: "",
        RATE_LIMIT_ENABLED: "false",
        ENABLE_API_DOCS: "false",
        UPLOAD_DIR: "./data/e2e_uploads",
      },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
