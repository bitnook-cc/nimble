/**
 * Central application configuration
 */
export const APP_CONFIG = {
  APP_NAME: "Nimble Sheets",
  APP_DESCRIPTION: "Digital character sheets for the Nimble RPG system",
  APP_VERSION: "1.0.0",
} as const;

export type AppConfig = typeof APP_CONFIG;