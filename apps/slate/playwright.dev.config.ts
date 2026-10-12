import { defineConfig } from "@playwright/test";
import production from "./playwright.config";

// Development deliberately keeps React StrictMode's effect replay enabled.
export default defineConfig({
  ...production,
  testMatch: "dialogs.spec.ts",
  outputDir: "test-results-dev",
  use: { ...production.use, baseURL: "http://127.0.0.1:3011" },
  webServer: {
    command: "npm run dev -- --port 3011 --strictPort",
    url: "http://127.0.0.1:3011",
    reuseExistingServer: !process.env.CI,
  },
});
