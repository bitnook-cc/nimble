import {
  AttributeBoostEffectSelection,
  AttributeName,
  Character,
  EffectSelection,
  PoolFeatureEffectSelection,
  SubclassEffectSelection,
} from "../schemas/character";
import {
  ClassDefinition,
  FeaturePool,
  SubclassDefinition,
} from "../schemas/class";
import {
  ClassFeature,
  AttributeBoostFeatureEffect,
  PickFeatureFromPoolFeatureEffect,
  SubclassChoiceFeatureEffect,
} from "../schemas/features";
import { ContentRepositoryService } from "./content-repository-service";
import { ICharacterService, IClassService } from "./interfaces";

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
    const subclassId = this.characterService.getSubclassId();
    if (!subclassId) return null;
    return this.contentRepository.getSubclassDefinition(subclassId);
  }

  /**
   * Get all features that should be available to a character at their current level
   */
  getExpectedFeaturesForCharacter(character: Character): ClassFeature[] {
    const classFeatures = this.contentRepository.getAllClassFeaturesUpToLevel(
      character.classId,
      character.level,
    );

    // Add subclass features if character has a subclass
    const subclassId = this.characterService.getSubclassId();
    if (subclassId) {
      const subclassFeatures = this.contentRepository.getAllSubclassFeaturesUpToLevel(
        subclassId,
        character.level,
      );
      return [...classFeatures, ...subclassFeatures];
    }

    return classFeatures;
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
  generateFeatureId(
    classId: string,
    level: number,
    featureName: string,
    subclassId?: string,
  ): string {
    const prefix = subclassId || classId;
    return `${prefix}-${level}-${featureName.toLowerCase().replace(/\s+/g, "-")}`;
  }

  /**
   * Generate a feature ID for a subclass feature (DEPRECATED - transitioning to effect-level tracking)
   */
  generateSubclassFeatureId(subclassId: string, level: number, featureName: string): string {
    return this.generateFeatureId("", level, featureName, subclassId);
  }

  /**
   * Select a subclass for a character (now using effect-based tracking)
   */
  async selectSubclass(
    character: Character,
    subclassId: string,
    grantedByEffectId: string,
  ): Promise<Character> {
    // Validate that the subclass is available for this character's class
    const subclassDefinition = this.contentRepository.getSubclassDefinition(subclassId);
    if (!subclassDefinition) {
      throw new Error(`Subclass not found: ${subclassId}`);
    }

    if (subclassDefinition.parentClassId !== character.classId) {
      throw new Error(`Subclass ${subclassId} is not available for class ${character.classId}`);
    }

    // Check if character has the appropriate subclass choice effect
    const hasSubclassChoiceEffect = this.characterService.getAllActiveEffects().some(
      (effect) => effect.type === "subclass_choice" && effect.id === grantedByEffectId,
    );

    if (!hasSubclassChoiceEffect) {
      throw new Error(`Character does not have a subclass choice effect with id ${grantedByEffectId}`);
    }

    // Check if already have a subclass selection for this effect
    const existingSubclassSelection = character.effectSelections?.find(
      (f) => f.type === "subclass" && f.grantedByEffectId === grantedByEffectId,
    );
    if (existingSubclassSelection) {
      throw new Error("Subclass has already been selected for this effect");
    }

    // Create the selected subclass record
    const selectedSubclass: SubclassEffectSelection = {
      type: "subclass",
      subclassId,
      grantedByEffectId,
    };

    // Update character with selected subclass
    const updatedCharacter = {
      ...character,
      effectSelections: [...(character.effectSelections || []), selectedSubclass],
    };

    await this.characterService.updateCharacter(updatedCharacter);

    return this.characterService.getCurrentCharacter()!;
  }

  /**
   * Get available subclass choice effects for a character at their current level
   */
  getAvailableSubclassChoices(character: Character): SubclassChoiceFeatureEffect[] {
    // Find all subclass choice effects from active features
    const subclassChoiceEffects = this.characterService.getAllActiveEffects()
      .filter((effect): effect is SubclassChoiceFeatureEffect => effect.type === "subclass_choice");

    // Filter out subclass choices that have already been made
    return subclassChoiceEffects.filter((effect) => {
      const hasSelection = character.effectSelections?.some(
        (f) => f.type === "subclass" && f.grantedByEffectId === effect.id,
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
    // Find all attribute boost effects from active features
    const attributeBoostEffects = this.characterService.getAllActiveEffects()
      .filter((effect): effect is AttributeBoostFeatureEffect => effect.type === "attribute_boost");

    // Filter out attribute boosts that have already been made
    return attributeBoostEffects.filter((effect) => {
      const hasSelection = character.effectSelections?.some(
        (f) => f.type === "attribute_boost" && f.grantedByEffectId === effect.id,
      );
      return !hasSelection;
    });
  }

  /**
   * Select an attribute boost for a character
   */
  async selectAttributeBoost(
    character: Character,
    effectId: string,
    attribute: AttributeName,
    amount: number,
  ): Promise<Character> {
    const effect = this.characterService.getAllActiveEffects()
      .find((e) => e.id === effectId) as AttributeBoostFeatureEffect;
    if (!effect || effect.type !== "attribute_boost") {
      throw new Error(`Attribute boost effect ${effectId} not found`);
    }

    if (!effect.allowedAttributes.includes(attribute)) {
      throw new Error(`Attribute ${attribute} is not allowed for this boost`);
    }

    // Create the selection record
    const selection: AttributeBoostEffectSelection = {
      type: "attribute_boost",
      grantedByEffectId: effectId,
      attribute,
      amount,
    };

    // Add the selection (attributes will be calculated dynamically)
    const updatedCharacter = {
      ...character,
      effectSelections: [...character.effectSelections, selection],
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
   * Check if a feature belongs to a subclass
   */
  private isSubclassFeature(feature: ClassFeature): boolean {
    if (!feature.id) return false;

    // Check if this feature exists in any subclass
    const allSubclasses = this.contentRepository.getAllSubclasses();
    return allSubclasses.some((subclass: SubclassDefinition) =>
      subclass.features.some((subFeature: ClassFeature) => subFeature.id === feature.id),
    );
  }

  /**
   * Get feature pool by ID
   * @deprecated Use getFeaturePoolById for consistency with new API
   */
  getFeaturePool(classId: string, poolId: string): FeaturePool | undefined {
    const pool = this.contentRepository.getFeaturePool(poolId);
    return pool || undefined;
  }

  /**
   * Get feature pool by ID only (new simplified API)
   */
  getFeaturePoolById(poolId: string): FeaturePool | null {
    return this.contentRepository.getFeaturePool(poolId);
  }

  /**
   * Get available pool features that can be selected.
   *
   * This returns the actual ClassFeature objects from a specific pool that haven't been selected yet.
   * Used when displaying what features a player can choose from within a specific pool.
   *
   * @param classId - The class ID to get the pool from
   * @param poolId - The ID of the specific feature pool to get features from
   * @param effectSelections - The current effect selections to check against
   * @returns Array of ClassFeature objects that haven't been selected yet from this pool
   */
  getAvailablePoolFeatures(
    classId: string,
    poolId: string,
    effectSelections: EffectSelection[] = [],
  ): ClassFeature[] {
    const pool = this.contentRepository.getFeaturePool(poolId);
    if (!pool) {
      return [];
    }

    // Filter out features that have already been selected
    const selectedPoolFeatures = effectSelections.filter(
      (f): f is PoolFeatureEffectSelection => f.type === "pool_feature",
    );

    const selectedFeatureIds = new Set(
      selectedPoolFeatures
        .filter((selected) => selected.poolId === poolId)
        .map((selected) => selected.feature.id),
    );

    return pool.features.filter((feature) => {
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
      const effects = feature.effects.filter(
        (e) => e.type === "pick_feature_from_pool",
      ) as PickFeatureFromPoolFeatureEffect[];
      pickEffects.push(...effects);
    }

    // Filter out effects where all selections have been made
    return pickEffects.filter((pickEffect) => {
      const remaining = this.getRemainingPoolSelections(character, pickEffect);
      return remaining > 0;
    });
  }

  /**
   * Select a feature from a pool
   */
  async selectPoolFeature(
    character: Character,
    poolId: string,
    selectedFeature: ClassFeature,
    grantedByFeatureId: string,
  ): Promise<Character> {
    // Check if the feature is available for selection
    const availableFeatures = this.getAvailablePoolFeatures(
      character.classId,
      poolId,
      character.effectSelections,
    );

    if (!availableFeatures.some((f) => f.id === selectedFeature.id)) {
      throw new Error(
        `Feature "${selectedFeature.name}" is not available for selection from pool "${poolId}"`,
      );
    }

    // Create the selected pool feature record
    const selectedPoolFeature: PoolFeatureEffectSelection = {
      type: "pool_feature",
      poolId,
      feature: selectedFeature,
      grantedByEffectId: grantedByFeatureId,
    };

    // Add to character's effect selections
    const updatedCharacter = {
      ...character,
      effectSelections: [...(character.effectSelections || []), selectedPoolFeature],
    };

    // Update character (effects will be applied dynamically)
    let finalCharacter = updatedCharacter;

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
  getRemainingPoolSelections(
    character: Character,
    pickFeatureFromPoolEffect: PickFeatureFromPoolFeatureEffect,
  ): number {
    const grantedByEffectId = pickFeatureFromPoolEffect.id;

    const selectedPoolFeatures = (character.effectSelections || []).filter(
      (f): f is PoolFeatureEffectSelection => f.type === "pool_feature",
    );

    const currentSelections = selectedPoolFeatures.filter(
      (selected) => selected.grantedByEffectId === grantedByEffectId,
    ).length;

    return Math.max(0, pickFeatureFromPoolEffect.choicesAllowed - currentSelections);
  }
}
