import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "slate.svg",
        "apple-touch-icon.png",
        "fonts/OFL-geist.txt",
        "fonts/OFL-cinzel.txt",
        "fonts/OFL-alegreyasans.txt",
        "fonts/SOURCES.json",
      ],
      manifest: {
        name: "Slate — Nimble GM screen",
        short_name: "Slate",
        description:
          "Your campaign, at the table. An offline Nimble GM screen.",
        theme_color: "#f4f1eb",
        background_color: "#f4f1eb",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Full official statblocks and their source payloads are bundled in JS.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
