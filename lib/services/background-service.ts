import { Character } from '../types/character';
import { BackgroundDefinition, BackgroundFeature, BackgroundFeatureGrant, BackgroundTrait } from '../types/background';
import { IBackgroundService, ICharacterService, ICharacterStorage } from './interfaces';
import { ContentRepositoryService } from './content-repository-service';

/**
 * Background Service with Dependency Injection
 * Manages background features and traits without tight coupling
 */
export class BackgroundService implements IBackgroundService {
  private contentRepository: ContentRepositoryService;

  constructor(
    private characterService: ICharacterService,
    private characterStorage: ICharacterStorage
  ) {
    this.contentRepository = ContentRepositoryService.getInstance();
  }

  /**
   * Get the background definition for a character
   */
  getCharacterBackground(character: Character): BackgroundDefinition | null {
    return this.contentRepository.getBackgroundDefinition(character.background.backgroundId);
  }

  /**
   * Get all features that should be available to a character from their background
   */
  getExpectedFeaturesForCharacter(character: Character): BackgroundFeature[] {
    const background = this.getCharacterBackground(character);
    if (!background) return [];
    
    return background.features;
  }

  /**
   * Get features that haven't been granted yet
   */
  getMissingFeatures(character: Character): BackgroundFeature[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const grantedFeatureIds = new Set(character.background.grantedFeatures);
    
    return expectedFeatures.filter((_, index) => 
      !grantedFeatureIds.has(`${character.background.backgroundId}-feature-${index}`)
    );
  }

  /**
   * Grant background features to a character
   */
  async grantBackgroundFeatures(characterId: string): Promise<void> {
    const character = await this.characterStorage.getCharacter(characterId);
    if (!character) return;

    const missingFeatures = this.getMissingFeatures(character);
    
    for (let i = 0; i < missingFeatures.length; i++) {
      const feature = missingFeatures[i];
      const featureId = `${character.background.backgroundId}-feature-${character.background.grantedFeatures.length + i}`;
      
      await this.applyBackgroundFeature(character, feature, featureId);
      
      // Track that this feature was granted
      character.background.grantedFeatures.push(featureId);
    }

    // Save updated character
    await this.characterStorage.updateCharacter(character);
  }

  /**
   * Apply a specific background feature to a character
   */
  private async applyBackgroundFeature(character: Character, feature: BackgroundFeature, featureId: string): Promise<void> {
    // Process each effect in the feature
    for (const effect of feature.effects) {
      await this.applyFeatureEffect(character, effect);
    }
  }

  /**
   * Apply a specific feature effect to a character
   */
  private async applyFeatureEffect(character: Character, effect: any): Promise<void> {
    switch (effect.type) {
      case 'ability':
        if (effect.ability) {
          character.abilities.push(effect.ability);
        }
        break;
      case 'attribute_boost':
        // Attribute boosts require user selection, handled separately
        // The selection process happens in the UI and is stored as SelectedAttributeBoost
        break;
      case 'proficiency':
        // Handle proficiency effects if needed
        // For now, these are mostly informational
        break;
      case 'passive_feature':
      default:
        // These features are informational and don't require mechanical changes
        break;
    }
  }

  /**
   * Create background trait for character creation
   */
  createBackgroundTrait(backgroundId: string): BackgroundTrait {
    return {
      backgroundId,
      grantedFeatures: []
    };
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
    return !!(
      background.id &&
      background.name &&
      background.description &&
      background.features
    );
  }

  /**
   * Get all granted features for the given character
   */
  getAllGrantedFeatures(character: Character): BackgroundFeature[] {
    return this.getExpectedFeaturesForCharacter(character);
  }
}