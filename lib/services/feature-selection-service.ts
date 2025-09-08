import {
  Character,
  AttributeBoostEffectSelection,
  PoolFeatureEffectSelection,
  SpellSchoolEffectSelection,
  SubclassEffectSelection,
  UtilitySpellsEffectSelection,
} from "../schemas/character";
import { 
  FeatureEffect,
  PickFeatureFromPoolFeatureEffect,
  SubclassChoiceFeatureEffect,
  SpellSchoolChoiceFeatureEffect,
  AttributeBoostFeatureEffect,
  UtilitySpellsFeatureEffect
} from "../schemas/features";
import { ContentRepositoryService } from "./content-repository-service";
import { getCharacterService } from "./service-factory";

export interface AvailableEffectSelections {
  poolSelections: Array<{ effect: PickFeatureFromPoolFeatureEffect; effectId: string }>;
  subclassChoices: Array<{ effect: SubclassChoiceFeatureEffect; effectId: string }>;
  spellSchoolSelections: Array<{ effect: SpellSchoolChoiceFeatureEffect; effectId: string }>;
  attributeBoosts: Array<{ effect: AttributeBoostFeatureEffect; effectId: string }>;
  utilitySpellSelections: Array<{ effect: UtilitySpellsFeatureEffect; effectId: string }>;
}

/**
 * Service for handling complex feature selection logic
 * Centralizes the logic for determining what selections are available and how to apply them
 */
export class FeatureSelectionService {
  private static instance: FeatureSelectionService;

  private constructor() {}

  static getInstance(): FeatureSelectionService {
    if (!FeatureSelectionService.instance) {
      FeatureSelectionService.instance = new FeatureSelectionService();
    }
    return FeatureSelectionService.instance;
  }

  /**
   * Get all available effect selections that need to be made
   * This includes selections from all sources (class, ancestry, background, etc.)
   */
  getAvailableEffectSelections(character: Character, allEffects: FeatureEffect[]): AvailableEffectSelections {
    const result: AvailableEffectSelections = {
      poolSelections: [],
      subclassChoices: [],
      spellSchoolSelections: [],
      attributeBoosts: [],
      utilitySpellSelections: []
    };

    for (const effect of allEffects) {
      // Create unique effect ID for tracking selections
      const effectId = effect.id || `effect-${Math.random().toString(36).substr(2, 9)}`;
      
      switch (effect.type) {
        case "pick_feature_from_pool": {
          const pickEffect = effect as PickFeatureFromPoolFeatureEffect;
          const remaining = this.getRemainingPoolSelections(character, pickEffect, effectId);
          if (remaining > 0) {
            result.poolSelections.push({ effect: pickEffect, effectId });
          }
          break;
        }
        
        case "subclass_choice": {
          // Check if subclass not already selected
          const characterService = getCharacterService();
          if (!characterService.getSubclassId()) {
            result.subclassChoices.push({ effect: effect as SubclassChoiceFeatureEffect, effectId });
          }
          break;
        }
        
        case "spell_school_choice": {
          const pickEffect = effect as SpellSchoolChoiceFeatureEffect;
          const remaining = this.getRemainingSpellSchoolSelections(character, pickEffect, effectId);
          if (remaining > 0) {
            result.spellSchoolSelections.push({ effect: pickEffect, effectId });
          }
          break;
        }
        
        case "attribute_boost": {
          const boostEffect = effect as AttributeBoostFeatureEffect;
          const remaining = this.getRemainingAttributeBoosts(character, boostEffect, effectId);
          if (remaining > 0) {
            result.attributeBoosts.push({ effect: boostEffect, effectId });
          }
          break;
        }
        
        case "utility_spells": {
          const pickEffect = effect as UtilitySpellsFeatureEffect;
          const hasSelection = character.effectSelections.some(
            s => s.type === "utility_spells" && s.grantedByEffectId === effectId
          );
          if (!hasSelection) {
            result.utilitySpellSelections.push({ effect: pickEffect, effectId });
          }
          break;
        }
      }
    }

    return result;
  }

  /**
   * Get remaining pool selections for a specific effect
   */
  private getRemainingPoolSelections(
    character: Character, 
    effect: PickFeatureFromPoolFeatureEffect, 
    effectId: string
  ): number {
    const selections = character.effectSelections.filter(
      s => s.type === "pool_feature" && s.grantedByEffectId === effectId
    );
    return Math.max(0, effect.choicesAllowed - selections.length);
  }

  /**
   * Get remaining spell school selections for a specific effect
   */
  private getRemainingSpellSchoolSelections(
    character: Character,
    effect: SpellSchoolChoiceFeatureEffect, 
    effectId: string
  ): number {
    const selections = character.effectSelections.filter(
      s => s.type === "spell_school" && s.grantedByEffectId === effectId
    );
    const numberOfChoices = effect.numberOfChoices || 1;
    return Math.max(0, numberOfChoices - selections.length);
  }

  /**
   * Get remaining attribute boost selections for a specific effect
   */
  private getRemainingAttributeBoosts(
    character: Character,
    effect: AttributeBoostFeatureEffect, 
    effectId: string
  ): number {
    const selections = character.effectSelections.filter(
      s => s.type === "attribute_boost" && s.grantedByEffectId === effectId
    );
    // Attribute boosts are single selection (one attribute gets the boost)
    return Math.max(0, 1 - selections.length);
  }

  /**
   * Get the total number of utility spells to select for an effect
   */
  getUtilitySpellSelectionCount(effect: UtilitySpellsFeatureEffect, availableSchools: string[]): number {
    if (effect.selectionMode === "per_school") {
      const spellsPerSchool = effect.spellsPerSchool || 1;
      return availableSchools.length * spellsPerSchool;
    } else {
      // "total" mode
      return effect.totalSpells || 1;
    }
  }

  /**
   * Get available spell schools for utility spell selection
   * Falls back to all character schools if not specified
   */
  getAvailableSchoolsForUtilitySpells(
    effect: UtilitySpellsFeatureEffect, 
    character: Character
  ): string[] {
    if (effect.schools && effect.schools.length > 0) {
      return effect.schools;
    }
    
    // Fall back to all character's spell schools
    const characterService = getCharacterService();
    return characterService.getSpellSchools();
  }

  /**
   * Get available utility spells for selection
   */
  getAvailableUtilitySpells(
    effect: UtilitySpellsFeatureEffect,
    character: Character
  ) {
    const contentRepository = ContentRepositoryService.getInstance();
    const availableSchools = this.getAvailableSchoolsForUtilitySpells(effect, character);
    
    const allSpells = availableSchools.flatMap(schoolId => {
      const spells = contentRepository.getSpellsBySchool(schoolId);
      return spells?.filter(s => 
        s.category === "utility" && 
        s.tier <= character._spellTierAccess
      ) || [];
    });
    
    // Remove duplicates by spell ID
    const uniqueSpells = new Map();
    for (const spell of allSpells) {
      if (!uniqueSpells.has(spell.id)) {
        uniqueSpells.set(spell.id, spell);
      }
    }
    
    return Array.from(uniqueSpells.values());
  }

  /**
   * Validate utility spell selection
   */
  validateUtilitySpellSelection(
    effect: UtilitySpellsFeatureEffect,
    selectedSpellIds: string[],
    character: Character
  ): boolean {
    const availableSchools = this.getAvailableSchoolsForUtilitySpells(effect, character);
    const expectedCount = this.getUtilitySpellSelectionCount(effect, availableSchools);
    
    if (selectedSpellIds.length !== expectedCount) {
      return false;
    }
    
    // If per_school mode, validate distribution
    if (effect.selectionMode === "per_school") {
      const spellsPerSchool = effect.spellsPerSchool || 1;
      const contentRepository = ContentRepositoryService.getInstance();
      
      // Count spells per school
      const schoolCounts = new Map<string, number>();
      for (const spellId of selectedSpellIds) {
        // Find which school this spell belongs to
        for (const schoolId of availableSchools) {
          const spells = contentRepository.getSpellsBySchool(schoolId);
          if (spells?.some(s => s.id === spellId)) {
            schoolCounts.set(schoolId, (schoolCounts.get(schoolId) || 0) + 1);
            break;
          }
        }
      }
      
      // Verify each school has the correct count
      for (const schoolId of availableSchools) {
        if ((schoolCounts.get(schoolId) || 0) !== spellsPerSchool) {
          return false;
        }
      }
    }
    
    return true;
  }
}

export const featureSelectionService = FeatureSelectionService.getInstance();