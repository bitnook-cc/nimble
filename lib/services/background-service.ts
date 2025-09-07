import { BackgroundDefinition } from "../types/background";
import { Character, CharacterFeature } from "../types/character";
import { ContentRepositoryService } from "./content-repository-service";
import { IBackgroundService } from "./interfaces";

/**
 * Background Service with Dependency Injection
 * Manages background features and traits without tight coupling
 */
export class BackgroundService implements IBackgroundService {
  private contentRepository: ContentRepositoryService;

  constructor() {
    this.contentRepository = ContentRepositoryService.getInstance();
  }

  /**
   * Get the background definition for a character
   */
  getCharacterBackground(character: Character): BackgroundDefinition | null {
    return this.contentRepository.getBackgroundDefinition(character.backgroundId);
  }

  /**
   * Get all features that should be available to a character from their background
   */
  getExpectedFeaturesForCharacter(character: Character): CharacterFeature[] {
    const background = this.getCharacterBackground(character);
    if (!background) return [];

    return background.features;
  }

  /**
   * Get available backgrounds (both built-in and custom)
   */
  getAvailableBackgrounds(): BackgroundDefinition[] {
    return this.contentRepository.getAllBackgrounds();
  }

  /**
   * Add custom background
   */
  async addCustomBackground(background: BackgroundDefinition): Promise<void> {
    return this.contentRepository.addCustomBackground(background);
  }

  /**
   * Remove custom background
   */
  async removeCustomBackground(backgroundId: string): Promise<void> {
    return this.contentRepository.removeCustomBackground(backgroundId);
  }

  /**
   * Validate background definition
   */
  validateBackgroundDefinition(background: Partial<BackgroundDefinition>): boolean {
    return !!(background.id && background.name && background.description && background.features);
  }
}
