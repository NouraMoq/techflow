import { defineConfig, devices } from "@playwright/test";

// E2E config. Uses the system Google Chrome (channel) so no Chromium download is
// needed. Reuses a already-running dev server if present, else starts one.
// A global setup re-seeds the DB so every run starts from a known state.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // shared DB — run serially for deterministic state
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "ar",
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        // Locally use the installed Google Chrome (no download); in CI use the
        // Playwright-managed Chromium (installed via `playwright install`).
        channel: process.env.CI ? undefined : "chrome",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
