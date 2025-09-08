import { AncestryDefinition } from "../schemas/ancestry";
import { Character, CharacterFeature } from "../types/character";
import { ContentRepositoryService } from "./content-repository-service";
import { IAncestryService, ICharacterService, ICharacterStorage } from "./interfaces";

/**
 * Ancestry Service with Dependency Injection
 * Manages ancestry features and traits without tight coupling
 */
export class AncestryService implements IAncestryService {
  private contentRepository: ContentRepositoryService;

  constructor() {
    this.contentRepository = ContentRepositoryService.getInstance();
  }

  /**
   * Get the ancestry definition for a character
   */
  getCharacterAncestry(character: Character): AncestryDefinition | null {
    return this.contentRepository.getAncestryDefinition(character.ancestryId);
  }

  /**
   * Get all features that should be available to a character from their ancestry
   */
  getExpectedFeaturesForCharacter(character: Character): CharacterFeature[] {
    const ancestry = this.getCharacterAncestry(character);
    if (!ancestry) return [];

    return ancestry.features;
  }

  /**
   * Get available ancestries (both built-in and custom)
   */
  getAvailableAncestries(): AncestryDefinition[] {
    return this.contentRepository.getAllAncestries();
  }

  /**
   * Add custom ancestry
   */
  async addCustomAncestry(ancestry: AncestryDefinition): Promise<void> {
    return this.contentRepository.addCustomAncestry(ancestry);
  }

  /**
   * Remove custom ancestry
   */
  async removeCustomAncestry(ancestryId: string): Promise<void> {
    return this.contentRepository.removeCustomAncestry(ancestryId);
  }
}
