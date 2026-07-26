import { defineConfig, devices } from "@playwright/test";

// Port 3100 is used for e2e to avoid clashing with a dev server on 3000.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ??
        "dev-secret-change-me-in-production-please-9f8a7b6c5d4e3f2a",
      DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
    },
  },
});
