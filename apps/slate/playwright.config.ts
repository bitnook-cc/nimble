import { defineConfig, devices } from "@playwright/test";

const channel = process.env.SLATE_BROWSER_CHANNEL || undefined;
const snapshotBrowser = (channel || "chromium").replace(/[^a-zA-Z0-9_-]/g, "-");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  // A normal run must fail for missing or changed baselines. Updating them is
  // an explicit review step via test:ui:update, never an automatic acceptance.
  updateSnapshots: "none",
  snapshotPathTemplate: "{testDir}/snapshots/aria/{testFilePath}/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixels: 80,
      pathTemplate: `{testDir}/snapshots/{platform}/${snapshotBrowser}/{testFilePath}/{arg}{ext}`,
    },
  },
  use: {
    baseURL: "http://127.0.0.1:3010",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    channel,
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:3010",
    reuseExistingServer: !process.env.CI,
  },
});
