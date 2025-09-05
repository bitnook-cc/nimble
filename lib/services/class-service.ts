import { Character, SelectedFeature, SelectedPoolFeature, SelectedSubclass, SelectedAttributeBoost, AttributeName } from '../types/character';
import { ClassDefinition, ClassFeature, ClassFeatureGrant, SubclassDefinition, FeaturePool } from '../types/class';
import { ResourceInstance } from '../types/resources';
// Removed direct subclass imports - now using ContentRepositoryService
import { SpellAbility } from '../types/abilities';
import { IClassService, ICharacterService } from './interfaces';
import { ContentRepositoryService } from './content-repository-service';
import { abilityService } from './ability-service';
import { resourceService } from './resource-service';
import { FeatureEffectService } from './feature-effect-service';
import { SubclassChoiceFeatureEffect, AttributeBoostFeatureEffect, PickFeatureFromPoolFeatureEffect, SpellSchoolFeatureEffect } from '../types/feature-effects';

/**
 * Class Service with Dependency Injection
 * Manages class features and progression without tight coupling
 */
export class ClassService implements IClassService {
  private contentRepository: ContentRepositoryService;
  private featureEffectService: FeatureEffectService;

  constructor(private characterService: ICharacterService) {
    this.contentRepository = ContentRepositoryService.getInstance();
    this.featureEffectService = new FeatureEffectService(characterService, resourceService, abilityService);
  }

  /**
   * Get the class definition for a character
   */
  getCharacterClass(character: Character): ClassDefinition | null {
    return this.contentRepository.getClassDefinition(character.classId);
  }

  /**
   * Get the subclass definition for a character
   */
  getCharacterSubclass(character: Character): SubclassDefinition | null {
    if (!character.subclassId) return null;
    return this.contentRepository.getSubclassDefinition(character.subclassId);
  }

  /**
   * Get all features that should be available to a character at their current level
   */
  getExpectedFeaturesForCharacter(character: Character): ClassFeature[] {
    const classFeatures = this.contentRepository.getAllClassFeaturesUpToLevel(character.classId, character.level);
    
    // Add subclass features if character has a subclass
    if (character.subclassId) {
      const subclassFeatures = this.contentRepository.getAllSubclassFeaturesUpToLevel(character.subclassId, character.level);
      return [...classFeatures, ...subclassFeatures];
    }
    
    return classFeatures;
  }

  /**
   * Get features that are missing for a character (should have but don't)
   * Now checks for missing effects rather than missing features
   */
  getMissingFeatures(character: Character): ClassFeature[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const grantedEffectsByFeature = new Map<string, Set<string>>();
    
    // Build map of granted effects by parent feature ID
    for (const grant of character.grantedEffects) {
      if (!grantedEffectsByFeature.has(grant.parentFeatureId)) {
        grantedEffectsByFeature.set(grant.parentFeatureId, new Set());
      }
      grantedEffectsByFeature.get(grant.parentFeatureId)!.add(grant.effectId);
    }
    
    return expectedFeatures.filter(feature => {
      // Check if all effects from this feature have been granted
      const grantedEffectsForFeature = grantedEffectsByFeature.get(feature.id) || new Set();
      
      // A feature is missing if any of its effects haven't been granted
      return feature.effects.some(effect => !grantedEffectsForFeature.has(effect.id));
    });
  }

  /**
   * Get features that are granted for a specific level
   */
  getFeaturesForLevel(classId: string, level: number): ClassFeature[] {
    return this.contentRepository.getClassFeaturesForLevel(classId, level);
  }

  /**
   * Generate a unique ID for a class feature grant (DEPRECATED - transitioning to effect-level tracking)
   */
  generateFeatureId(classId: string, level: number, featureName: string, subclassId?: string): string {
    const prefix = subclassId || classId;
    return `${prefix}-${level}-${featureName.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Generate a feature ID for a subclass feature (DEPRECATED - transitioning to effect-level tracking)
   */
  generateSubclassFeatureId(subclassId: string, level: number, featureName: string): string {
    return this.generateFeatureId('', level, featureName, subclassId);
  }

  /**
   * Level up a character and grant new features
   */
  async levelUpCharacter(targetLevel: number): Promise<ClassFeatureGrant[]> {
    const character = this.characterService.character;
    if (!character) {
      throw new Error('No character loaded');
    }

    if (targetLevel <= character.level) {
      throw new Error('Target level must be higher than current level');
    }

    const newFeatures: ClassFeatureGrant[] = [];
    const classDef = this.getCharacterClass(character);
    if (!classDef) {
      throw new Error(`Class not found: ${character.classId}`);
    }

    // Grant features for each level from current+1 to target level
    for (let level = character.level + 1; level <= targetLevel; level++) {
      const levelFeatures = this.getFeaturesForLevel(character.classId, level);
      
      for (const feature of levelFeatures) {
        const featureGrant = await this.grantFeature(character, feature, level);
        newFeatures.push(featureGrant);
      }
    }

    // Update character level
    const updatedCharacter = {
      ...character,
      level: targetLevel,
      // Update hit dice to match new level
      hitDice: {
        ...character._hitDice,
        size: classDef.hitDieSize,
        max: targetLevel,
        current: Math.min(character._hitDice.current + (targetLevel - character.level), targetLevel)
      }
    };

    await this.characterService.updateCharacter(updatedCharacter);
    return newFeatures;
  }

  /**
   * Grant a specific feature to a character using effect-level tracking
   */
  async grantFeature(character: Character, feature: ClassFeature, level: number): Promise<ClassFeatureGrant> {
    // Determine source type and ID
    const sourceType = character.subclassId && this.isSubclassFeature(feature) ? 'subclass' : 'class';
    const sourceId = sourceType === 'subclass' ? character.subclassId! : character.classId;
    
    // Apply the feature effects using the shared effect service
    const updatedCharacter = await this.featureEffectService.applyEffects(
      character, 
      feature.effects, 
      feature.id, 
      sourceType, 
      sourceId, 
      level
    );

    await this.characterService.updateCharacter(updatedCharacter);

    // Create the feature grant record for backwards compatibility
    const featureGrant: ClassFeatureGrant = {
      featureId: feature.id, // Use actual feature ID instead of generated one
      classId: sourceId,
      level,
      feature,
      grantedAt: new Date()
    };

    return featureGrant;
  }


  /**
   * Synchronize character spells based on their spell school access and tier access
   * Now works with effect-based system
   */
  private syncCharacterSpells(character: Character): Character {
    // Find all spell school effects the character has been granted
    const spellSchoolEffects = character.grantedEffects
      .filter(grant => grant.effect.type === 'spell_school')
      .map(grant => grant.effect as SpellSchoolFeatureEffect);
    
    // Get all spells the character should have access to
    const eligibleSpells: SpellAbility[] = [];
    
    for (const schoolEffect of spellSchoolEffects) {
      const schoolSpells = this.contentRepository.getSpellsBySchool(schoolEffect.spellSchool.schoolId);
      
      // Filter by character's spell tier access
      const accessibleSpells = schoolSpells.filter(spell => spell.tier <= character.spellTierAccess);
      eligibleSpells.push(...accessibleSpells);
    }
    
    // Get current spell abilities
    const currentSpells = character.abilities.filter(ability => ability.type === 'spell') as SpellAbility[];
    const currentSpellIds = new Set(currentSpells.map(spell => spell.id));
    
    // Find missing spells
    const missingSpells = eligibleSpells.filter(spell => !currentSpellIds.has(spell.id));
    
    // Add missing spells to character's abilities
    if (missingSpells.length > 0) {
      const nonSpellAbilities = character.abilities.filter(ability => ability.type !== 'spell');
      const allAbilities = [...nonSpellAbilities, ...currentSpells, ...missingSpells];
      
      return {
        ...character,
        abilities: allAbilities
      };
    }
    
    return character;
  }


  /**
   * Select a subclass for a character (now using effect-based tracking)
   */
  async selectSubclass(character: Character, subclassId: string, grantedByEffectId: string): Promise<Character> {
    // Validate that the subclass is available for this character's class
    const subclassDefinition = this.contentRepository.getSubclassDefinition(subclassId);
    if (!subclassDefinition) {
      throw new Error(`Subclass not found: ${subclassId}`);
    }

    if (subclassDefinition.parentClassId !== character.classId) {
      throw new Error(`Subclass ${subclassId} is not available for class ${character.classId}`);
    }

    // Check if character has the appropriate subclass choice effect
    const hasSubclassChoiceEffect = character.grantedEffects.some(grant => 
      grant.effect.type === 'subclass_choice'
    );

    if (!hasSubclassChoiceEffect) {
      throw new Error(`Character does not have a subclass choice effect at their current level`);
    }

    // Check if already have a subclass selection for this effect
    const existingSubclassSelection = character.selectedFeatures?.find(
      f => f.type === 'subclass' && f.grantedByEffectId === grantedByEffectId
    );
    if (existingSubclassSelection) {
      throw new Error('Subclass has already been selected for this effect');
    }

    // Create the selected subclass record
    const selectedSubclass: SelectedSubclass = {
      type: 'subclass',
      subclassId,
      selectedAt: new Date(),
      grantedByEffectId
    };

    // Update character with selected subclass
    const updatedCharacter = {
      ...character,
      subclassId: subclassId,
      selectedFeatures: [...(character.selectedFeatures || []), selectedSubclass]
    };

    await this.characterService.updateCharacter(updatedCharacter);

    // Sync any missing subclass features
    await this.syncCharacterFeatures();

    return this.characterService.getCurrentCharacter()!;
  }

  /**
   * Get available subclass choice effects for a character at their current level
   */
  getAvailableSubclassChoices(character: Character): SubclassChoiceFeatureEffect[] {
    // Find all subclass choice effects the character has been granted
    const subclassChoiceEffects = character.grantedEffects
      .filter(grant => grant.effect.type === 'subclass_choice')
      .map(grant => grant.effect as SubclassChoiceFeatureEffect);
    
    // Filter out subclass choices that have already been made
    return subclassChoiceEffects.filter(effect => {
      const hasSelection = character.selectedFeatures?.some(
        f => f.type === 'subclass' && f.grantedByEffectId === effect.id
      );
      return !hasSelection;
    });
  }

  /**
   * Get available subclasses for a character's class
   */
  getAvailableSubclassesForCharacter(character: Character): SubclassDefinition[] {
    return this.contentRepository.getSubclassesForClass(character.classId);
  }

  /**
   * Check if character can choose a subclass
   */
  canChooseSubclass(character: Character): boolean {
    return this.getAvailableSubclassChoices(character).length > 0;
  }

  /**
   * Check if character has pending subclass selections to make
   */
  hasPendingSubclassSelections(character: Character): boolean {
    return this.getAvailableSubclassChoices(character).length > 0;
  }

  /**
   * Get available attribute boost choices for a character
   */
  getAvailableAttributeBoostChoices(character: Character): AttributeBoostFeatureEffect[] {
    // Find all attribute boost effects the character has been granted
    const attributeBoostEffects = character.grantedEffects
      .filter(grant => grant.effect.type === 'attribute_boost')
      .map(grant => grant.effect as AttributeBoostFeatureEffect);
    
    // Filter out attribute boosts that have already been made
    return attributeBoostEffects.filter(effect => {
      const hasSelection = character.selectedFeatures?.some(
        f => f.type === 'attribute_boost' && f.grantedByEffectId === effect.id
      );
      return !hasSelection;
    });
  }

  /**
   * Select an attribute boost for a character
   */
  async selectAttributeBoost(character: Character, effectId: string, attribute: AttributeName, amount: number): Promise<Character> {
    const effect = character.grantedEffects.find(grant => grant.effect.id === effectId)?.effect as AttributeBoostFeatureEffect;
    if (!effect || effect.type !== 'attribute_boost') {
      throw new Error(`Attribute boost effect ${effectId} not found`);
    }

    if (!effect.allowedAttributes.includes(attribute)) {
      throw new Error(`Attribute ${attribute} is not allowed for this boost`);
    }

    // Create the selection record
    const selection: SelectedAttributeBoost = {
      type: 'attribute_boost',
      grantedByEffectId: effectId,
      attribute,
      amount,
      selectedAt: new Date()
    };

    // Add the selection and apply the attribute boost
    const updatedCharacter = {
      ...character,
      selectedFeatures: [...character.selectedFeatures, selection],
      _attributes: {
        ...character._attributes,
        [attribute]: character._attributes[attribute] + amount
      }
    };

    // Save to storage
    await this.characterService.updateCharacter(updatedCharacter);
    return updatedCharacter;
  }

  /**
   * Check if character has pending attribute boost selection
   */
  hasAttributeBoostSelectionAvailable(character: Character): boolean {
    return this.getAvailableAttributeBoostChoices(character).length > 0;
  }

  /**
   * Check if character needs to catch up on missing features
   */
  async syncCharacterFeatures(): Promise<ClassFeatureGrant[]> {
    let character = this.characterService.character;
    if (!character) {
      throw new Error('No character loaded');
    }

    const missingFeatures = this.getMissingFeatures(character);
    const grantedFeatures: ClassFeatureGrant[] = [];

    for (const feature of missingFeatures) {
      const featureGrant = await this.grantFeature(character, feature, feature.level);
      grantedFeatures.push(featureGrant);
      
      // Get the updated character after granting the feature
      character = this.characterService.getCurrentCharacter();
      if (!character) {
        throw new Error('Character became null after granting feature');
      }
    }

    return grantedFeatures;
  }

  /**
   * Apply the effects of a feature to a character using the shared effect service
   */
  private async applyFeatureEffects(character: Character, feature: ClassFeature): Promise<Character> {
    const sourceType = character.subclassId && this.isSubclassFeature(feature) ? 'subclass' : 'class';
    const sourceId = sourceType === 'subclass' ? character.subclassId! : character.classId;
    
    return await this.featureEffectService.applyEffects(
      character, 
      feature.effects, 
      feature.id, 
      sourceType, 
      sourceId, 
      feature.level
    );
  }

  /**
   * Check if a feature belongs to a subclass
   */
  private isSubclassFeature(feature: ClassFeature): boolean {
    if (!feature.id) return false;
    
    // Check if this feature exists in any subclass
    const allSubclasses = this.contentRepository.getAllSubclasses();
    return allSubclasses.some((subclass: SubclassDefinition) => 
      subclass.features.some((subFeature: ClassFeature) => subFeature.id === feature.id)
    );
  }

  /**
   * Grant a pick feature from pool feature - this just records that the choice is available
   */
  private async grantPickFeatureFromPoolFeature(character: Character, feature: ClassFeature, effect: PickFeatureFromPoolFeatureEffect): Promise<Character> {
    // For pick feature from pool features, we don't automatically grant anything
    // The feature simply unlocks the ability to make choices from the specified pool
    // The actual selection happens through UI interaction
    return character;
  }

  /**
   * Get feature pool by ID
   */
  getFeaturePool(classId: string, poolId: string): FeaturePool | undefined {
    const classDefinition = this.contentRepository.getClassDefinition(classId);
    return classDefinition?.featurePools?.find((pool: FeaturePool) => pool.id === poolId);
  }

  /**
   * Get available pool features that can be selected by a character.
   * 
   * This returns the actual ClassFeature objects from a specific pool that haven't been selected yet.
   * Used when displaying what features a player can choose from within a specific pool.
   * 
   * @param character - The character making the selection
   * @param poolId - The ID of the specific feature pool to get features from
   * @returns Array of ClassFeature objects that haven't been selected yet from this pool
   */
  getAvailablePoolFeatures(character: Character, poolId: string): ClassFeature[] {
    const pool = this.getFeaturePool(character.classId, poolId);
    if (!pool) {
      return [];
    }

    // Filter out features that have already been selected
    const selectedPoolFeatures = (character.selectedFeatures || [])
      .filter((f): f is SelectedPoolFeature => f.type === 'pool_feature');
    
    const selectedFeatureIds = new Set(
      selectedPoolFeatures
        .filter(selected => selected.poolId === poolId)
        .map(selected => selected.featureId)
    );

    return pool.features.filter(feature => {
      return !selectedFeatureIds.has(feature.id);
    });
  }

  /**
   * Get pick feature from pool features that are available for a character.
   * 
   * This returns PickFeatureFromPoolFeatureEffect objects (the "chooser" effects) that still have selections remaining.
   * These are the features that grant the ability to pick from a pool, not the pool contents themselves.
   * Used to show which pool selections the player still needs to make.
   * 
   * @param character - The character to check for available selections
   * @returns Array of PickFeatureFromPoolFeatureEffect objects that have remaining selections to make
   */
  getAvailablePoolSelections(character: Character): PickFeatureFromPoolFeatureEffect[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const pickEffects: PickFeatureFromPoolFeatureEffect[] = [];
    
    // Find all pick_feature_from_pool effects
    for (const feature of expectedFeatures) {
      const effects = feature.effects.filter(e => e.type === 'pick_feature_from_pool') as PickFeatureFromPoolFeatureEffect[];
      pickEffects.push(...effects);
    }
    
    // Filter out effects where all selections have been made
    return pickEffects.filter(pickEffect => {
      const remaining = this.getRemainingPoolSelections(character, pickEffect);
      return remaining > 0;
    });
  }

  /**
   * Select a feature from a pool
   */
  async selectPoolFeature(character: Character, poolId: string, selectedFeature: ClassFeature, grantedByFeatureId: string): Promise<Character> {
    // Check if the feature is available for selection
    const availableFeatures = this.getAvailablePoolFeatures(character, poolId);
    
    if (!availableFeatures.some(f => f.id === selectedFeature.id)) {
      throw new Error(`Feature "${selectedFeature.name}" is not available for selection from pool "${poolId}"`);
    }

    // Create the selected pool feature record
    const selectedPoolFeature: SelectedPoolFeature = {
      type: 'pool_feature',
      poolId,
      featureId: selectedFeature.id,
      feature: selectedFeature,
      selectedAt: new Date(),
      grantedByEffectId: grantedByFeatureId
    };

    // Add to character's selected features
    const updatedCharacter = {
      ...character,
      selectedFeatures: [...(character.selectedFeatures || []), selectedPoolFeature]
    };

    // Apply the feature effects
    let finalCharacter = await this.applyFeatureEffects(updatedCharacter, selectedFeature);

    await this.characterService.updateCharacter(finalCharacter);
    return finalCharacter;
  }


  /**
   * Check if character has pending pool selections to make.
   * 
   * This is a convenience method that checks if there are any PickFeatureFromPoolFeatureEffect 
   * features with remaining selections. Returns true if the player needs to make selections.
   * 
   * @param character - The character to check
   * @returns True if there are pool selections remaining, false otherwise
   */
  hasPendingPoolSelections(character: Character): boolean {
    const availableSelections = this.getAvailablePoolSelections(character);
    return availableSelections.length > 0;
  }

  /**
   * Get count of remaining selections for a specific pool selection feature.
   * 
   * This calculates how many more times a player can select from a specific pool.
   * For example, if a PickFeatureFromPoolFeatureEffect allows 2 choices and the player has made 1,
   * this returns 1.
   * 
   * @param character - The character making selections
   * @param pickFeatureFromPoolEffect - The specific PickFeatureFromPoolFeatureEffect to check
   * @returns Number of remaining selections allowed (0 if all selections have been made)
   */
  getRemainingPoolSelections(character: Character, pickFeatureFromPoolEffect: PickFeatureFromPoolFeatureEffect): number {
    const grantedByEffectId = pickFeatureFromPoolEffect.id;
    
    const selectedPoolFeatures = (character.selectedFeatures || [])
      .filter((f): f is SelectedPoolFeature => f.type === 'pool_feature');
    
    const currentSelections = selectedPoolFeatures.filter(
      selected => selected.grantedByEffectId === grantedByEffectId
    ).length;
    
    return Math.max(0, pickFeatureFromPoolEffect.choicesAllowed - currentSelections);
  }

  /**
   * Get all granted features for the given character
   */
  getAllGrantedFeatures(character: Character): ClassFeature[] {
    const grantedFeatures = this.getExpectedFeaturesForCharacter(character);
    const selectedFeatures = (character.selectedFeatures || [])
      .filter((f: SelectedFeature) => f.type === 'pool_feature')
      .map((f: SelectedFeature) => (f as SelectedPoolFeature).feature);
    
    return [...grantedFeatures, ...selectedFeatures];
  }
}