import { Character, SelectedFeature, SelectedPoolFeature, SelectedSubclass } from '../types/character';
import { ClassDefinition, ClassFeature, ClassFeatureGrant, AbilityFeature, StatBoostFeature, ProficiencyFeature, SpellSchoolFeature, SpellSchoolChoiceFeature, UtilitySpellsFeature, SpellTierAccessFeature, ResourceFeature, SubclassChoiceFeature, SubclassDefinition, PickFeatureFromPoolFeature, FeaturePool } from '../types/class';
import { ResourceInstance, createResourceInstance } from '../types/resources';
// Removed direct subclass imports - now using ContentRepositoryService
import { SpellAbility } from '../types/abilities';
import { IClassService, ICharacterService } from './interfaces';
import { ContentRepositoryService } from './content-repository-service';

/**
 * Class Service with Dependency Injection
 * Manages class features and progression without tight coupling
 */
export class ClassService implements IClassService {
  private contentRepository: ContentRepositoryService;

  constructor(private characterService: ICharacterService) {
    this.contentRepository = ContentRepositoryService.getInstance();
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
   */
  getMissingFeatures(character: Character): ClassFeature[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const grantedFeatureIds = new Set(character.grantedFeatures);
    
    return expectedFeatures.filter(feature => {
      // Generate feature ID based on whether it's from class or subclass
      let featureId: string;
      
      // Check if this feature comes from a subclass
      if (character.subclassId) {
        const subclassFeatures = this.contentRepository.getAllSubclassFeaturesUpToLevel(character.subclassId, character.level);
        const isSubclassFeature = subclassFeatures.some(sf => sf.name === feature.name && sf.level === feature.level);
        
        if (isSubclassFeature) {
          featureId = this.generateSubclassFeatureId(character.subclassId, feature.level, feature.name);
        } else {
          featureId = this.generateFeatureId(character.classId, feature.level, feature.name);
        }
      } else {
        featureId = this.generateFeatureId(character.classId, feature.level, feature.name);
      }
      
      return !grantedFeatureIds.has(featureId);
    });
  }

  /**
   * Get features that are granted for a specific level
   */
  getFeaturesForLevel(classId: string, level: number): ClassFeature[] {
    return this.contentRepository.getClassFeaturesForLevel(classId, level);
  }

  /**
   * Generate a unique ID for a class feature grant
   */
  generateFeatureId(classId: string, level: number, featureName: string, subclassId?: string): string {
    const prefix = subclassId || classId;
    return `${prefix}-${level}-${featureName.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Generate a feature ID for a subclass feature
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
        ...character.hitDice,
        size: classDef.hitDieSize,
        max: targetLevel,
        current: Math.min(character.hitDice.current + (targetLevel - character.level), targetLevel)
      }
    };

    await this.characterService.updateCharacter(updatedCharacter);
    return newFeatures;
  }

  /**
   * Grant a specific feature to a character
   */
  async grantFeature(character: Character, feature: ClassFeature, level: number): Promise<ClassFeatureGrant> {
    // Check if this feature comes from a subclass
    let featureId: string;
    let sourceClassId: string;
    
    if (character.subclassId) {
      const subclassFeatures = this.contentRepository.getAllSubclassFeaturesUpToLevel(character.subclassId, character.level);
      const isSubclassFeature = subclassFeatures.some(sf => sf.id === feature.id);
      
      if (isSubclassFeature) {
        featureId = this.generateSubclassFeatureId(character.subclassId, level, feature.name);
        sourceClassId = character.subclassId;
      } else {
        featureId = this.generateFeatureId(character.classId, level, feature.name);
        sourceClassId = character.classId;
      }
    } else {
      featureId = this.generateFeatureId(character.classId, level, feature.name);
      sourceClassId = character.classId;
    }
    
    // Create the feature grant record
    const featureGrant: ClassFeatureGrant = {
      featureId,
      classId: sourceClassId,
      level,
      feature,
      grantedAt: new Date()
    };

    // Add to character's granted features
    const updatedGrantedFeatures = [...character.grantedFeatures, featureId];

    // Apply the feature effects
    let updatedCharacter = {
      ...character,
      grantedFeatures: updatedGrantedFeatures
    };

    // Apply feature effects
    updatedCharacter = await this.applyFeatureEffects(updatedCharacter, feature);

    await this.characterService.updateCharacter(updatedCharacter);
    return featureGrant;
  }

  /**
   * Grant an ability-type feature (adds ability to character's abilities)
   */
  private async grantAbilityFeature(character: Character, feature: AbilityFeature): Promise<Character> {
    // Check if ability already exists to avoid duplicates
    const existingAbility = character.abilities.find(ability => ability.id === feature.ability.id);
    if (existingAbility) {
      // If ability already exists, don't add it again
      return character;
    }

    // Add the ability directly to character's abilities
    const updatedAbilities = [...character.abilities, feature.ability];

    return {
      ...character,
      abilities: updatedAbilities
    };
  }

  /**
   * Grant a stat boost feature (increases character attributes)
   */
  private async grantStatBoostFeature(character: Character, feature: StatBoostFeature): Promise<Character> {
    let updatedAttributes = { ...character.attributes };

    // Apply each stat boost
    for (const boost of feature.statBoosts) {
      updatedAttributes[boost.attribute] = Math.min(
        10, // Cap at maximum attribute value
        updatedAttributes[boost.attribute] + boost.amount
      );
    }

    return {
      ...character,
      attributes: updatedAttributes
    };
  }

  /**
   * Grant a proficiency feature (adds proficiencies to character)
   */
  private async grantProficiencyFeature(character: Character, feature: ProficiencyFeature): Promise<Character> {
    // For now, proficiencies are just recorded as granted features
    // In the future, we could add a proficiencies system to the character model
    return character;
  }

  /**
   * Synchronize character spells based on their spell school access and tier access
   */
  private syncCharacterSpells(character: Character): Character {
    // Find all spell school features the character has been granted
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const spellSchoolFeatures = expectedFeatures.filter(f => f.type === 'spell_school') as SpellSchoolFeature[];
    
    // Get all spells the character should have access to
    const eligibleSpells: SpellAbility[] = [];
    
    for (const schoolFeature of spellSchoolFeatures) {
      const schoolSpells = this.contentRepository.getSpellsBySchool(schoolFeature.spellSchool.schoolId);
      
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
   * Grant spell school feature (adds spellcasting capabilities and syncs spells)
   */
  private async grantSpellSchoolFeature(character: Character, feature: SpellSchoolFeature): Promise<Character> {
    // Sync spells after granting the school access
    return this.syncCharacterSpells(character);
  }

  /**
   * Grant spell school choice feature (allows player to choose a spell school)
   */
  private async grantSpellSchoolChoiceFeature(character: Character, feature: SpellSchoolChoiceFeature): Promise<Character> {
    // This feature enables a choice - the actual selection happens through UI interaction
    // The feature is recorded in grantedFeatures to track that the choice is available
    return character;
  }

  /**
   * Grant utility spells feature (grants access to utility spells from specified schools)
   */
  private async grantUtilitySpellsFeature(character: Character, feature: UtilitySpellsFeature): Promise<Character> {
    // Collect all utility spells from the specified schools
    const utilitySpells: SpellAbility[] = [];
    
    for (const schoolId of feature.schools) {
      const schoolUtilitySpells = this.contentRepository.getUtilitySpellsForSchool(schoolId);
      
      if (feature.spellsPerSchool && feature.spellsPerSchool < schoolUtilitySpells.length) {
        // Only grant a subset of utility spells - this would require UI selection
        // For now, grant the first N spells
        utilitySpells.push(...schoolUtilitySpells.slice(0, feature.spellsPerSchool));
      } else {
        // Grant all utility spells from the school
        utilitySpells.push(...schoolUtilitySpells);
      }
    }
    
    // Add utility spells to character's abilities
    if (utilitySpells.length > 0) {
      const currentAbilities = character.abilities || [];
      // Filter out spells that are already in the character's abilities
      const newSpells = utilitySpells.filter(spell => 
        !currentAbilities.some(existing => 
          existing.type === 'spell' && existing.id === spell.id
        )
      );
      
      return {
        ...character,
        abilities: [...currentAbilities, ...newSpells]
      };
    }
    
    return character;
  }

  /**
   * Grant spell tier access feature (increases max spell tier and syncs spells)
   */
  private async grantSpellTierAccessFeature(character: Character, feature: SpellTierAccessFeature): Promise<Character> {
    // Update the character's spell tier access to the highest tier they can now access
    const newSpellTierAccess = Math.max(character.spellTierAccess, feature.maxTier);
    
    const updatedCharacter = {
      ...character,
      spellTierAccess: newSpellTierAccess
    };
    
    // Sync spells after updating tier access
    return this.syncCharacterSpells(updatedCharacter);
  }

  /**
   * Grant resource feature (adds new resources like Ki Points, etc.)
   */
  private async grantResourceFeature(character: Character, feature: ResourceFeature): Promise<Character> {
    const { resourceDefinition, startingAmount } = feature;
    
    // Check if resource already exists to avoid duplicates
    const existingResource = character.resources.find(r => r.definition.id === resourceDefinition.id);
    if (existingResource) {
      // If resource already exists, don't add it again
      return character;
    }

    // Create a resource instance from the definition
    const resourceInstance = createResourceInstance(
      resourceDefinition,
      startingAmount, // Use provided starting amount or default to maxValue
      character.resources.length + 1 // Sort order
    );

    // Add the resource to character's resources
    const updatedResources = [...character.resources, resourceInstance];

    return {
      ...character,
      resources: updatedResources
    };
  }

  /**
   * Grant subclass choice feature (records that player can choose a subclass)
   */
  private async grantSubclassChoiceFeature(character: Character, feature: SubclassChoiceFeature): Promise<Character> {
    // Subclass choice features are recorded as granted but don't modify the character directly
    // The actual subclass selection happens separately via selectSubclass method
    return character;
  }

  /**
   * Select a subclass for a character
   */
  async selectSubclass(character: Character, subclassId: string, grantedByFeatureId: string): Promise<Character> {
    // Validate that the subclass is available for this character's class
    const subclassDefinition = this.contentRepository.getSubclassDefinition(subclassId);
    if (!subclassDefinition) {
      throw new Error(`Subclass not found: ${subclassId}`);
    }

    if (subclassDefinition.parentClassId !== character.classId) {
      throw new Error(`Subclass ${subclassId} is not available for class ${character.classId}`);
    }

    // Check if character has the appropriate subclass choice feature
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const hasSubclassChoice = expectedFeatures.some(feature => 
      feature.type === 'subclass_choice'
    );

    if (!hasSubclassChoice) {
      throw new Error(`Character does not have a subclass choice feature at their current level`);
    }

    // Check if already have a subclass selection
    const existingSubclassSelection = character.selectedFeatures?.find(
      f => f.type === 'subclass' && f.grantedByFeatureId === grantedByFeatureId
    );
    if (existingSubclassSelection) {
      throw new Error('Subclass has already been selected for this feature');
    }

    // Create the selected subclass record
    const selectedSubclass: SelectedSubclass = {
      type: 'subclass',
      subclassId,
      selectedAt: new Date(),
      grantedByFeatureId
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
   * Get available subclass choices for a character at their current level
   */
  getAvailableSubclassChoices(character: Character): SubclassChoiceFeature[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const subclassChoices = expectedFeatures.filter(feature => feature.type === 'subclass_choice') as SubclassChoiceFeature[];
    
    // Filter out subclass choices that have already been made
    return subclassChoices.filter(choice => {
      const grantedByFeatureId = this.generateFeatureId(character.classId, choice.level, choice.name);
      const hasSelection = character.selectedFeatures?.some(
        f => f.type === 'subclass' && f.grantedByFeatureId === grantedByFeatureId
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
   * Apply the effects of a feature to a character
   */
  private async applyFeatureEffects(character: Character, feature: ClassFeature): Promise<Character> {
    switch (feature.type) {
      case 'ability':
        return await this.grantAbilityFeature(character, feature);
      case 'stat_boost':
        return await this.grantStatBoostFeature(character, feature);
      case 'proficiency':
        return await this.grantProficiencyFeature(character, feature);
      case 'spell_school':
        return await this.grantSpellSchoolFeature(character, feature);
      case 'spell_school_choice':
        return await this.grantSpellSchoolChoiceFeature(character, feature);
      case 'utility_spells':
        return await this.grantUtilitySpellsFeature(character, feature);
      case 'spell_tier_access':
        return await this.grantSpellTierAccessFeature(character, feature);
      case 'resource':
        return await this.grantResourceFeature(character, feature);
      case 'subclass_choice':
        return await this.grantSubclassChoiceFeature(character, feature);
      case 'pick_feature_from_pool':
        return await this.grantPickFeatureFromPoolFeature(character, feature);
      case 'passive_feature':
        // Passive features don't need special handling beyond being recorded
        return character;
      default:
        return character;
    }
  }

  /**
   * Grant a pick feature from pool feature - this just records that the choice is available
   */
  private async grantPickFeatureFromPoolFeature(character: Character, feature: PickFeatureFromPoolFeature): Promise<Character> {
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
   * This returns PickFeatureFromPoolFeature objects (the "chooser" features) that still have selections remaining.
   * These are the features that grant the ability to pick from a pool, not the pool contents themselves.
   * Used to show which pool selections the player still needs to make.
   * 
   * @param character - The character to check for available selections
   * @returns Array of PickFeatureFromPoolFeature objects that have remaining selections to make
   */
  getAvailablePoolSelections(character: Character): PickFeatureFromPoolFeature[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const pickFeatures = expectedFeatures.filter(feature => feature.type === 'pick_feature_from_pool') as PickFeatureFromPoolFeature[];
    
    // Filter out features where all selections have been made
    return pickFeatures.filter(pickFeature => {
      const remaining = this.getRemainingPoolSelections(character, pickFeature);
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
      grantedByFeatureId
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
   * This is a convenience method that checks if there are any PickFeatureFromPoolFeature 
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
   * For example, if a PickFeatureFromPoolFeature allows 2 choices and the player has made 1,
   * this returns 1.
   * 
   * @param character - The character making selections
   * @param pickFeatureFromPoolFeature - The specific PickFeatureFromPoolFeature to check
   * @returns Number of remaining selections allowed (0 if all selections have been made)
   */
  getRemainingPoolSelections(character: Character, pickFeatureFromPoolFeature: PickFeatureFromPoolFeature): number {
    const grantedByFeatureId = this.generateFeatureId(character.classId, pickFeatureFromPoolFeature.level, pickFeatureFromPoolFeature.name);
    
    const selectedPoolFeatures = (character.selectedFeatures || [])
      .filter((f): f is SelectedPoolFeature => f.type === 'pool_feature');
    
    const currentSelections = selectedPoolFeatures.filter(
      selected => selected.grantedByFeatureId === grantedByFeatureId
    ).length;
    
    return Math.max(0, pickFeatureFromPoolFeature.choicesAllowed - currentSelections);
  }
}