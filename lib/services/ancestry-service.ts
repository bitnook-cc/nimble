import { Character } from '../types/character';
import { AncestryDefinition, AncestryFeature, AncestryFeatureGrant, AncestryAbilityFeature, AncestryStatBoostFeature, AncestryProficiencyFeature, AncestryTrait } from '../types/ancestry';
import { ResourceInstance, createResourceInstance } from '../types/resources';
import { IAncestryService, ICharacterService, ICharacterStorage } from './interfaces';
import { ContentRepositoryService } from './content-repository-service';

/**
 * Ancestry Service with Dependency Injection
 * Manages ancestry features and traits without tight coupling
 */
export class AncestryService implements IAncestryService {
  private contentRepository: ContentRepositoryService;

  constructor(
    private characterService: ICharacterService,
    private characterStorage: ICharacterStorage
  ) {
    this.contentRepository = ContentRepositoryService.getInstance();
  }

  /**
   * Get the ancestry definition for a character
   */
  getCharacterAncestry(character: Character): AncestryDefinition | null {
    return this.contentRepository.getAncestryDefinition(character.ancestry.ancestryId);
  }

  /**
   * Get all features that should be available to a character from their ancestry
   */
  getExpectedFeaturesForCharacter(character: Character): AncestryFeature[] {
    const ancestry = this.getCharacterAncestry(character);
    if (!ancestry) return [];
    
    return ancestry.features;
  }

  /**
   * Get features that haven't been granted yet
   */
  getMissingFeatures(character: Character): AncestryFeature[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const grantedFeatureIds = new Set(character.ancestry.grantedFeatures);
    
    return expectedFeatures.filter((_, index) => 
      !grantedFeatureIds.has(`${character.ancestry.ancestryId}-feature-${index}`)
    );
  }

  /**
   * Grant ancestry features to a character
   */
  async grantAncestryFeatures(characterId: string): Promise<void> {
    const character = await this.characterStorage.getCharacter(characterId);
    if (!character) return;

    const missingFeatures = this.getMissingFeatures(character);
    
    for (let i = 0; i < missingFeatures.length; i++) {
      const feature = missingFeatures[i];
      const featureId = `${character.ancestry.ancestryId}-feature-${character.ancestry.grantedFeatures.length + i}`;
      
      await this.applyAncestryFeature(character, feature, featureId);
      
      // Track that this feature was granted
      character.ancestry.grantedFeatures.push(featureId);
    }

    // Save updated character
    await this.characterStorage.updateCharacter(character);
  }

  /**
   * Apply a specific ancestry feature to a character
   */
  private async applyAncestryFeature(character: Character, feature: AncestryFeature, featureId: string): Promise<void> {
    switch (feature.type) {
      case 'ability':
        await this.applyAbilityFeature(character, feature as AncestryAbilityFeature);
        break;
      case 'stat_boost':
        await this.applyStatBoostFeature(character, feature as AncestryStatBoostFeature);
        break;
      case 'proficiency':
        await this.applyProficiencyFeature(character, feature as AncestryProficiencyFeature);
        break;
      case 'passive_feature':
      case 'darkvision':
      case 'resistance':
        // These features are informational and don't require mechanical changes
        break;
    }
  }

  /**
   * Apply an ability feature from ancestry
   */
  private async applyAbilityFeature(character: Character, feature: AncestryAbilityFeature): Promise<void> {
    const ability = feature.ability;
    
    // Add to the abilities array
    character.abilities.push(ability);
  }

  /**
   * Apply stat boost from ancestry
   */
  private async applyStatBoostFeature(character: Character, feature: AncestryStatBoostFeature): Promise<void> {
    for (const boost of feature.statBoosts) {
      character._attributes[boost.attribute] += boost.amount;
    }
  }

  /**
   * Apply proficiency feature from ancestry
   */
  private async applyProficiencyFeature(character: Character, feature: AncestryProficiencyFeature): Promise<void> {
    for (const proficiency of feature.proficiencies) {
      if (proficiency.type === 'skill' && proficiency.bonus) {
        const skillName = proficiency.name as keyof typeof character._skills;
        if (character._skills[skillName]) {
          character._skills[skillName].modifier += proficiency.bonus;
        }
      }
      // Other proficiency types (tool, language) are informational
    }
  }


  /**
   * Create ancestry trait for character creation
   */
  createAncestryTrait(ancestryId: string): AncestryTrait {
    return {
      ancestryId,
      grantedFeatures: []
    };
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

  /**
   * Get all granted features for the given character
   */
  getAllGrantedFeatures(character: Character): AncestryFeature[] {
    return this.getExpectedFeaturesForCharacter(character);
  }
}