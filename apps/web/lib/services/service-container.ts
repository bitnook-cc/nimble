/**
 * Service Container for Dependency Injection
 * Manages service dependencies and provides controlled access to services
 */
export class ServiceContainer {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  /**
   * Register a service factory
   */
  register<T>(key: string, factory: (container: ServiceContainer) => T, singleton = false): void {
    this.services.set(key, { factory, singleton });
  }

  /**
   * Get a service instance
   */
  get<T>(key: string): T {
    const serviceConfig = this.services.get(key);
    if (!serviceConfig) {
      throw new Error(`Service not registered: ${key}`);
    }

    if (serviceConfig.singleton) {
      if (!this.singletons.has(key)) {
        this.singletons.set(key, serviceConfig.factory(this));
      }
      return this.singletons.get(key);
    }

    return serviceConfig.factory(this);
  }

  /**
   * Clear all singletons (useful for testing)
   */
  clearSingletons(): void {
    this.singletons.clear();
  }
}

// Service keys for type safety
export const SERVICE_KEYS = {
  STORAGE: "storage",
  CHARACTER_STORAGE: "characterStorage",
  ACTIVITY_LOG: "activityLog",
  ABILITY_SERVICE: "abilityService",
  CHARACTER_SERVICE: "characterService",
  CLASS_SERVICE: "classService",
  ANCESTRY_SERVICE: "ancestryService",
  BACKGROUND_SERVICE: "backgroundService",
  CHARACTER_CREATION: "characterCreation",
  DICE_SERVICE: "diceService",
  SETTINGS_SERVICE: "settingsService",
  ACTIVITY_SHARING_SERVICE: "activitySharingService",
} as const;

export type ServiceKey = (typeof SERVICE_KEYS)[keyof typeof SERVICE_KEYS];

// Create and export a global container instance
export const serviceContainer = new ServiceContainer();
