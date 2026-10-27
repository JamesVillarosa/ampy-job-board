import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  // Tests write to one shared DB, so run them one at a time.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: process.env.BASE_URL ?? `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Run against a production build; skipped when BASE_URL points at a live deploy.
  webServer: process.env.BASE_URL
    ? undefined
    : { command: `npm run build && npx next start -p ${PORT}`, port: PORT, reuseExistingServer: !process.env.CI, timeout: 180_000 },
});
