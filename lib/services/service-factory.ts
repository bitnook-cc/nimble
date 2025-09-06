import { abilityService } from "./ability-service";
import { activityLogService } from "./activity-log-service";
import { AncestryService } from "./ancestry-service";
import { BackgroundService } from "./background-service";
import { CharacterCreationService } from "./character-creation-service";
import { CharacterService } from "./character-service";
// Import existing services that implement the interfaces
import { characterStorageService } from "./character-storage-service";
import { ClassService } from "./class-service";
import { ContentRepositoryService } from "./content-repository-service";
import { diceService } from "./dice-service";
// Import types for external services
import type { DiceService } from "./dice-service";
import {
  IAbilityService,
  IActivityLog,
  IAncestryService,
  IBackgroundService,
  ICharacterCreation,
  ICharacterService,
  ICharacterStorage,
  IClassService,
} from "./interfaces";
import { ItemService } from "./item-service";
import { SERVICE_KEYS, serviceContainer } from "./service-container";
import { settingsService } from "./settings-service";
import type { SettingsService } from "./settings-service";

/**
 * Service Factory
 * Sets up dependency injection container with all services
 */
export class ServiceFactory {
  private static initialized = false;

  /**
   * Initialize the service container with all dependencies
   */
  static initialize(): void {
    if (this.initialized) return;

    // Register existing services that already implement interfaces
    serviceContainer.register(
      SERVICE_KEYS.CHARACTER_STORAGE,
      () => characterStorageService,
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.ACTIVITY_LOG,
      () => activityLogService,
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.ABILITY_SERVICE,
      () => abilityService,
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.DICE_SERVICE,
      () => diceService,
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.SETTINGS_SERVICE,
      () => settingsService,
      true, // singleton
    );

    // Register services with dependency injection
    serviceContainer.register(
      SERVICE_KEYS.CHARACTER_SERVICE,
      (container) =>
        new CharacterService(
          container.get(SERVICE_KEYS.CHARACTER_STORAGE),
          container.get(SERVICE_KEYS.ACTIVITY_LOG),
          container.get(SERVICE_KEYS.ABILITY_SERVICE),
        ),
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.CLASS_SERVICE,
      (container) => new ClassService(container.get(SERVICE_KEYS.CHARACTER_SERVICE)),
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.ANCESTRY_SERVICE,
      (container) =>
        new AncestryService(
          container.get(SERVICE_KEYS.CHARACTER_SERVICE),
          container.get(SERVICE_KEYS.CHARACTER_STORAGE),
        ),
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.BACKGROUND_SERVICE,
      (container) =>
        new BackgroundService(
          container.get(SERVICE_KEYS.CHARACTER_SERVICE),
          container.get(SERVICE_KEYS.CHARACTER_STORAGE),
        ),
      true, // singleton
    );

    serviceContainer.register(
      SERVICE_KEYS.CHARACTER_CREATION,
      (container) =>
        new CharacterCreationService(
          container.get(SERVICE_KEYS.CHARACTER_STORAGE),
          container.get(SERVICE_KEYS.CHARACTER_SERVICE),
          container.get(SERVICE_KEYS.ANCESTRY_SERVICE),
          container.get(SERVICE_KEYS.BACKGROUND_SERVICE),
        ),
      true, // singleton
    );

    this.initialized = true;
  }

  /**
   * Get a service instance from the container
   */
  static getService<T>(key: string): T {
    this.initialize();
    return serviceContainer.get<T>(key);
  }

  /**
   * Reset the service container (useful for testing)
   */
  static reset(): void {
    serviceContainer.clearSingletons();
    this.initialized = false;
  }
}

// Convenience functions for getting services with proper types
export const getCharacterService = (): ICharacterService =>
  ServiceFactory.getService(SERVICE_KEYS.CHARACTER_SERVICE);
export const getCharacterStorage = (): ICharacterStorage =>
  ServiceFactory.getService(SERVICE_KEYS.CHARACTER_STORAGE);
export const getActivityLog = (): IActivityLog =>
  ServiceFactory.getService(SERVICE_KEYS.ACTIVITY_LOG);
export const getAbilityService = (): IAbilityService =>
  ServiceFactory.getService(SERVICE_KEYS.ABILITY_SERVICE);
export const getClassService = (): IClassService =>
  ServiceFactory.getService(SERVICE_KEYS.CLASS_SERVICE);
export const getAncestryService = (): IAncestryService =>
  ServiceFactory.getService(SERVICE_KEYS.ANCESTRY_SERVICE);
export const getBackgroundService = (): IBackgroundService =>
  ServiceFactory.getService(SERVICE_KEYS.BACKGROUND_SERVICE);
export const getCharacterCreation = (): ICharacterCreation =>
  ServiceFactory.getService(SERVICE_KEYS.CHARACTER_CREATION);
export const getDiceService = (): DiceService =>
  ServiceFactory.getService(SERVICE_KEYS.DICE_SERVICE);
export const getSettingsService = (): SettingsService =>
  ServiceFactory.getService(SERVICE_KEYS.SETTINGS_SERVICE);
export const getContentRepository = (): ContentRepositoryService =>
  ContentRepositoryService.getInstance();
export const getItemService = (): ItemService => ItemService.getInstance();
