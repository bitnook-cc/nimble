/**
 * Central application configuration
 */
export const APP_CONFIG = {
  APP_NAME: "Sidekick",
  APP_TAGLINE: "A companion app for the Nimble TTRPG",
  APP_DESCRIPTION: "A companion app for the Nimble TTRPG",
  APP_VERSION: "1.0.0",
} as const;

export type AppConfig = typeof APP_CONFIG;
