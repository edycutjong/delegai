import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Configuration for DelegAI
 *
 * Runs against demo mode — no MetaMask/1Shot/Venice keys needed.
 * Set DELEGAI_DEMO=true for self-contained testing.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "html" : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      DELEGAI_DEMO: "true",
      NEXT_PUBLIC_DELEGAI_DEMO: "true",
      NEXT_PUBLIC_CHAIN_ID: "11155111",
    },
  },
});
