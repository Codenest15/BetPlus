import { defineConfig, devices } from "@playwright/test";

const frontend = process.env.E2E_FRONTEND_URL ?? "http://localhost:3000";
const backend = process.env.E2E_BACKEND_URL ?? "http://localhost:8000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: frontend,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  metadata: { backend },
});
