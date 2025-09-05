import { Character } from '../types/character';
import { AbilityFeatureEffect, AttributeBoostFeatureEffect, FeatureEffect, FeatureEffectGrant, ProficiencyFeatureEffect, ResistanceFeatureEffect, ResourceFeatureEffect, SpellSchoolFeatureEffect, SpellTierAccessFeatureEffect, StatBonusFeatureEffect } from '../types/feature-effects';
import { ICharacterService } from './interfaces';
import { ResourceService } from './resource-service';
import { AbilityService } from './ability-service';

export interface FeatureEffectServiceInterface {
  applyEffects(character: Character, effects: FeatureEffect[], parentFeatureId: string, sourceType: 'class' | 'subclass' | 'ancestry' | 'background', sourceId: string, level?: number): Promise<Character>;
  generateEffectId(parentFeatureId: string, effectIndex: number): string;
  generateEffectGrant(effect: FeatureEffect, parentFeatureId: string, sourceType: 'class' | 'subclass' | 'ancestry' | 'background', sourceId: string, level?: number): FeatureEffectGrant;
}

/**
 * Shared service for processing feature effects from all content types (classes, ancestries, backgrounds)
 */
export class FeatureEffectService implements FeatureEffectServiceInterface {
  private characterService: ICharacterService;
  private resourceService: ResourceService;
  private abilityService: AbilityService;

  constructor(characterService: ICharacterService, resourceService: ResourceService, abilityService: AbilityService) {
    this.characterService = characterService;
    this.resourceService = resourceService;
    this.abilityService = abilityService;
  }

  /**
   * Apply all effects from a feature to a character
   */
  async applyEffects(
    character: Character, 
    effects: FeatureEffect[], 
    parentFeatureId: string, 
    sourceType: 'class' | 'subclass' | 'ancestry' | 'background', 
    sourceId: string, 
    level?: number
  ): Promise<Character> {
    let updatedCharacter = { ...character };

    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      const effectId = this.generateEffectId(parentFeatureId, i);
      
      // Generate effect with proper ID
      const effectWithId = { ...effect, id: effectId };
      
      // Apply the individual effect
      updatedCharacter = await this.applyEffect(updatedCharacter, effectWithId, parentFeatureId, sourceType, sourceId, level);
    }

    return updatedCharacter;
  }

  /**
   * Apply a single effect to a character
   */
  private async applyEffect(
    character: Character,
    effect: FeatureEffect,
    parentFeatureId: string,
    sourceType: 'class' | 'subclass' | 'ancestry' | 'background',
    sourceId: string,
    level?: number
  ): Promise<Character> {
    let updatedCharacter = { ...character };

    // Create effect grant for tracking
    const effectGrant = this.generateEffectGrant(effect, parentFeatureId, sourceType, sourceId, level);
    
    // Add to granted effects
    updatedCharacter.grantedEffects = [...updatedCharacter.grantedEffects, effectGrant];

    // Apply effect based on type
    switch (effect.type) {
      case 'ability':
        updatedCharacter = await this.applyAbilityEffect(updatedCharacter, effect);
        break;
      case 'attribute_boost':
        updatedCharacter = this.applyAttributeBoostEffect(updatedCharacter, effect);
        break;
      case 'stat_bonus':
        updatedCharacter = this.applyStatBonusEffect(updatedCharacter, effect);
        break;
      case 'proficiency':
        updatedCharacter = this.applyProficiencyEffect(updatedCharacter, effect);
        break;
      case 'spell_school':
        updatedCharacter = this.applySpellSchoolEffect(updatedCharacter, effect);
        break;
      case 'spell_tier_access':
        updatedCharacter = this.applySpellTierAccessEffect(updatedCharacter, effect);
        break;
      case 'resource':
        updatedCharacter = this.applyResourceEffect(updatedCharacter, effect);
        break;
      case 'resistance':
        updatedCharacter = this.applyResistanceEffect(updatedCharacter, effect);
        break;
      case 'spell_school_choice':
      case 'utility_spells':
      case 'subclass_choice':
      case 'pick_feature_from_pool':
        // These effects require user choice and are handled by UI components
        // They don't modify the character directly but create selection opportunities
        break;
      default:
        console.warn(`Unknown effect type: ${(effect as any).type}`);
    }

    return updatedCharacter;
  }

  /**
   * Generate a globally unique effect ID
   */
  generateEffectId(parentFeatureId: string, effectIndex: number): string {
    return `${parentFeatureId}-${effectIndex}`;
  }

  /**
   * Generate an effect grant for tracking
   */
  generateEffectGrant(
    effect: FeatureEffect,
    parentFeatureId: string,
    sourceType: 'class' | 'subclass' | 'ancestry' | 'background',
    sourceId: string,
    level?: number
  ): FeatureEffectGrant {
    return {
      effectId: effect.id,
      parentFeatureId,
      sourceType,
      sourceId,
      level,
      effect
    };
  }

  /**
   * Apply ability effect - grant a new ability
   */
  private async applyAbilityEffect(character: Character, effect: AbilityFeatureEffect): Promise<Character> {   
    return {
      ...character,
      abilities: [
        ...character.abilities.filter(a => a.id !== effect.ability.id), // Remove existing ability of same id
        effect.ability
      ]
    };
  }

  /**
   * Apply stat bonus effect - apply ongoing bonuses from passive features
   */
  private applyStatBonusEffect(character: Character, effect: StatBonusFeatureEffect): Character {
    if (effect.type !== 'stat_bonus') return character;

    const updatedAttributes = { ...character._attributes };
    
    if (effect.statBonus.attributes) {
      Object.entries(effect.statBonus.attributes).forEach(([attrName, bonus]) => {
        (updatedAttributes as any)[attrName] += bonus;
      });
    }

    return {
      ...character,
      _attributes: updatedAttributes
    };
  }

  /**
   * Apply proficiency effect - grant new proficiencies
   */
  private applyProficiencyEffect(character: Character, effect: ProficiencyFeatureEffect): Character {
    const updatedProficiencies = { ...character.proficiencies };
    
    for (const prof of effect.proficiencies) {
      switch (prof.type) {
        case 'skill':
          // Skills are handled through the _skills property
          // This would need to be updated through CharacterService.getSkills()
          break;
        case 'save':
          // Save proficiencies affect the saveAdvantages
          // This could be expanded to track save proficiency bonuses
          break;
        case 'tool':
        case 'language':
          // These could be tracked in a separate proficiencies system
          break;
      }
    }

    return {
      ...character,
      proficiencies: updatedProficiencies
    };
  }

  /**
   * Apply spell school effect - grant access to a spell school
   */
  private applySpellSchoolEffect(character: Character, effect: SpellSchoolFeatureEffect): Character {   
    // Spell school access is tracked through the character's class features
    // This effect doesn't directly modify character state but enables spell access
    return character;
  }

  /**
   * Apply spell tier access effect - increase max spell tier
   */
  private applySpellTierAccessEffect(character: Character, effect: SpellTierAccessFeatureEffect): Character {
    return {
      ...character,
      spellTierAccess: Math.max(character.spellTierAccess, effect.maxTier)
    };
  }

  /**
   * Apply resource effect - grant a new resource
   */
  private applyResourceEffect(character: Character, effect: ResourceFeatureEffect): Character {
    const newResource = this.resourceService.createResourceInstanceForCharacter(
      effect.resourceDefinition,
      character,
      undefined,
      character.resources.length
    );
    
    return {
      ...character,
      resources: [
        ...character.resources.filter(r => r.definition.id !== newResource.definition.id), // Remove existing of same type
        newResource
      ]
    };
  }

  /**
   * Apply resistance effect - grant damage/condition resistances
   */
  private applyResistanceEffect(character: Character, effect: ResistanceFeatureEffect): Character {    
    // Resistances could be tracked in a separate traits/features system
    return character;
  }

  /**
   * Apply attribute boost effect - requires user choice (handled by UI)
   */
  private applyAttributeBoostEffect(character: Character, effect: AttributeBoostFeatureEffect): Character {
    if (effect.type !== 'attribute_boost') return character;
    
    // AttributeBoost effects require user choice and are handled by UI components
    // They don't modify the character directly but create selection opportunities
    return character;
  }

}