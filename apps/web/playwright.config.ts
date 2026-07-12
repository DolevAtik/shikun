import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3001",
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      // The employee app is mobile-first, so the accessibility gate runs at the
      // size most people will actually hold.
      use: { ...devices["Pixel 7"] },
    },
  ],
});
