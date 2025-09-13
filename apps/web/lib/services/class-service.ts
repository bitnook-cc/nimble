import {
  AttributeBoostTraitSelection,
  AttributeName,
  Character,
  TraitSelection,
  PoolFeatureTraitSelection,
  SubclassTraitSelection,
} from "../schemas/character";
import { ClassDefinition, FeaturePool, SubclassDefinition } from "../schemas/class";
import {
  AttributeBoostFeatureTrait,
  ClassFeature,
  PickFeatureFromPoolFeatureTrait,
  SubclassChoiceFeatureTrait,
} from "../schemas/features";
import { ContentRepositoryService } from "./content-repository-service";
import { ICharacterService, IClassService } from "./interfaces";

/**
 * Class Service with Dependency Injection
 * Manages class features and progression without tight coupling
 */
export class ClassService implements IClassService {
  constructor(private characterService: ICharacterService) {}

  /**
   * Get the class definition for a character
   */
  getCharacterClass(character: Character): ClassDefinition | null {
    return ContentRepositoryService.getInstance().getClassDefinition(character.classId);
  }

  /**
   * Get all features that should be available to a character at their current level
   */
  getExpectedFeaturesForCharacter(character: Character): ClassFeature[] {
    const classFeatures = ContentRepositoryService.getInstance().getAllClassFeaturesUpToLevel(
      character.classId,
      character.level,
    );

    // Add subclass features if character has a subclass
    const subclassId = this.characterService.getSubclassId();
    if (subclassId) {
      const subclassFeatures =
        ContentRepositoryService.getInstance().getAllSubclassFeaturesUpToLevel(
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
    return ContentRepositoryService.getInstance().getClassFeaturesForLevel(classId, level);
  }

  /**
   * Select a subclass for a character (now using effect-based tracking)
   */
  async selectSubclass(
    character: Character,
    subclassId: string,
    grantedByTraitId: string,
  ): Promise<Character> {
    // Validate that the subclass is available for this character's class
    const subclassDefinition =
      ContentRepositoryService.getInstance().getSubclassDefinition(subclassId);
    if (!subclassDefinition) {
      throw new Error(`Subclass not found: ${subclassId}`);
    }

    if (subclassDefinition.parentClassId !== character.classId) {
      throw new Error(`Subclass ${subclassId} is not available for class ${character.classId}`);
    }

    // Check if character has the appropriate subclass choice effect
    const hasSubclassChoiceEffect = this.characterService
      .getAllActiveTraits()
      .some((trait) => trait.type === "subclass_choice" && trait.id === grantedByTraitId);

    if (!hasSubclassChoiceEffect) {
      throw new Error(
        `Character does not have a subclass choice effect with id ${grantedByTraitId}`,
      );
    }

    // Check if already have a subclass selection for this effect
    const existingSubclassSelection = character.traitSelections?.find(
      (f) => f.type === "subclass" && f.grantedByTraitId === grantedByTraitId,
    );
    if (existingSubclassSelection) {
      throw new Error("Subclass has already been selected for this effect");
    }

    // Create the selected subclass record
    const selectedSubclass: SubclassTraitSelection = {
      type: "subclass",
      subclassId,
      grantedByTraitId,
    };

    // Update character with selected subclass
    const updatedCharacter = {
      ...character,
      traitSelections: [...(character.traitSelections || []), selectedSubclass],
    };

    await this.characterService.updateCharacter(updatedCharacter);

    return this.characterService.getCurrentCharacter()!;
  }

  /**
   * Get available subclass choice traits for a character at their current level
   */
  getAvailableSubclassChoices(character: Character): SubclassChoiceFeatureTrait[] {
    // Find all subclass choice traits from active features
    const subclassChoiceEffects = this.characterService
      .getAllActiveTraits()
      .filter((trait): trait is SubclassChoiceFeatureTrait => trait.type === "subclass_choice");

    // Filter out subclass choices that have already been made
    return subclassChoiceEffects.filter((trait) => {
      const hasSelection = character.traitSelections?.some(
        (f) => f.type === "subclass" && f.grantedByTraitId === trait.id,
      );
      return !hasSelection;
    });
  }

  /**
   * Get available subclasses for a character's class
   */
  getAvailableSubclassesForCharacter(character: Character): SubclassDefinition[] {
    return ContentRepositoryService.getInstance().getSubclassesForClass(character.classId);
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
  getAvailableAttributeBoostChoices(character: Character): AttributeBoostFeatureTrait[] {
    // Find all attribute boost traits from active features
    const attributeBoostEffects = this.characterService
      .getAllActiveTraits()
      .filter((trait): trait is AttributeBoostFeatureTrait => trait.type === "attribute_boost");

    // Filter out attribute boosts that have already been made
    return attributeBoostEffects.filter((trait) => {
      const hasSelection = character.traitSelections?.some(
        (f) => f.type === "attribute_boost" && f.grantedByTraitId === trait.id,
      );
      return !hasSelection;
    });
  }

  /**
   * Select an attribute boost for a character
   */
  async selectAttributeBoost(
    character: Character,
    traitId: string,
    attribute: AttributeName,
    amount: number,
  ): Promise<Character> {
    const effect = this.characterService
      .getAllActiveTraits()
      .find((trait) => trait.id === traitId) as AttributeBoostFeatureTrait;
    if (!effect || effect.type !== "attribute_boost") {
      throw new Error(`Attribute boost effect ${traitId} not found`);
    }

    if (!effect.allowedAttributes.includes(attribute)) {
      throw new Error(`Attribute ${attribute} is not allowed for this boost`);
    }

    // Create the selection record
    const selection: AttributeBoostTraitSelection = {
      type: "attribute_boost",
      grantedByTraitId: traitId,
      attribute,
      amount,
    };

    // Add the selection (attributes will be calculated dynamically)
    const updatedCharacter = {
      ...character,
      traitSelections: [...character.traitSelections, selection],
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
   * Get feature pool by ID
   * @deprecated Use getFeaturePoolById for consistency with new API
   */
  getFeaturePool(classId: string, poolId: string): FeaturePool | undefined {
    const pool = ContentRepositoryService.getInstance().getFeaturePool(poolId);
    return pool || undefined;
  }

  /**
   * Get feature pool by ID only (new simplified API)
   */
  getFeaturePoolById(poolId: string): FeaturePool | null {
    return ContentRepositoryService.getInstance().getFeaturePool(poolId);
  }

  /**
   * Get available pool features that can be selected.
   *
   * This returns the actual ClassFeature objects from a specific pool that haven't been selected yet.
   * Used when displaying what features a player can choose from within a specific pool.
   *
   * @param classId - The class ID to get the pool from
   * @param poolId - The ID of the specific feature pool to get features from
   * @param traitSelections - The current effect selections to check against
   * @returns Array of ClassFeature objects that haven't been selected yet from this pool
   */
  getAvailablePoolFeatures(
    classId: string,
    poolId: string,
    traitSelections: TraitSelection[] = [],
  ): ClassFeature[] {
    const pool = ContentRepositoryService.getInstance().getFeaturePool(poolId);
    if (!pool) {
      return [];
    }

    // Filter out features that have already been selected
    const selectedPoolFeatures = traitSelections.filter(
      (f): f is PoolFeatureTraitSelection => f.type === "pool_feature",
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
   * This returns PickFeatureFromPoolFeatureTrait objects (the "chooser" traits) that still have selections remaining.
   * These are the features that grant the ability to pick from a pool, not the pool contents themselves.
   * Used to show which pool selections the player still needs to make.
   *
   * @param character - The character to check for available selections
   * @returns Array of PickFeatureFromPoolFeatureTrait objects that have remaining selections to make
   */
  getAvailablePoolSelections(character: Character): PickFeatureFromPoolFeatureTrait[] {
    const expectedFeatures = this.getExpectedFeaturesForCharacter(character);
    const pickEffects: PickFeatureFromPoolFeatureTrait[] = [];

    // Find all pick_feature_from_pool traits
    for (const feature of expectedFeatures) {
      const traits = feature.traits.filter(
        (e) => e.type === "pick_feature_from_pool",
      ) as PickFeatureFromPoolFeatureTrait[];
      pickEffects.push(...traits);
    }

    // Filter out traits where all selections have been made
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
      character.traitSelections,
    );

    if (!availableFeatures.some((f) => f.id === selectedFeature.id)) {
      throw new Error(
        `Feature "${selectedFeature.name}" is not available for selection from pool "${poolId}"`,
      );
    }

    // Create the selected pool feature record
    const selectedPoolFeature: PoolFeatureTraitSelection = {
      type: "pool_feature",
      poolId,
      feature: selectedFeature,
      grantedByTraitId: grantedByFeatureId,
    };

    // Add to character's effect selections
    const updatedCharacter = {
      ...character,
      traitSelections: [...(character.traitSelections || []), selectedPoolFeature],
    };

    // Update character (traits will be applied dynamically)
    let finalCharacter = updatedCharacter;

    await this.characterService.updateCharacter(finalCharacter);
    return finalCharacter;
  }

  /**
   * Check if character has pending pool selections to make.
   *
   * This is a convenience method that checks if there are any PickFeatureFromPoolFeatureTrait
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
   * For example, if a PickFeatureFromPoolFeatureTrait allows 2 choices and the player has made 1,
   * this returns 1.
   *
   * @param character - The character making selections
   * @param pickFeatureFromPoolEffect - The specific PickFeatureFromPoolFeatureTrait to check
   * @returns Number of remaining selections allowed (0 if all selections have been made)
   */
  getRemainingPoolSelections(
    character: Character,
    pickFeatureFromPoolEffect: PickFeatureFromPoolFeatureTrait,
  ): number {
    const grantedByTraitId = pickFeatureFromPoolEffect.id;

    const selectedPoolFeatures = (character.traitSelections || []).filter(
      (f): f is PoolFeatureTraitSelection => f.type === "pool_feature",
    );

    const currentSelections = selectedPoolFeatures.filter(
      (selected) => selected.grantedByTraitId === grantedByTraitId,
    ).length;

    return Math.max(0, pickFeatureFromPoolEffect.choicesAllowed - currentSelections);
  }
}
