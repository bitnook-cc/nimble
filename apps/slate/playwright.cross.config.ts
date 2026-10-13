import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Functional and accessibility coverage; existing visual baselines remain in
// the main suite and are never regenerated for a different browser engine.
export default defineConfig({
  ...base,
  testMatch: [
    "viewport.spec.ts",
    "dialogs.spec.ts",
    "campaigns.spec.ts",
    "accessibility.spec.ts",
    "release.spec.ts",
    "slate.spec.ts",
    "initiative-modes.spec.ts",
    "image-gestures.spec.ts",
  ],
  outputDir: "test-results-cross",
  workers: 2,
  use: { ...base.use, channel: undefined },
  projects: [
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
