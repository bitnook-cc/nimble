// Import and re-export all character-related types from schemas
import type {
  // Basic types
  AttributeName,
  Attributes,
  Skill,
  Skills,
  SkillName,
  SaveAdvantageType,
  SaveAdvantageMap,
  HitDieSize,
  HitPoints,
  ActionTracker,
  HitDice,
  Wounds,
  CharacterConfiguration,
  Proficiencies,
  
  // Effect selection types
  BaseEffectSelection,
  PoolFeatureEffectSelection,
  SpellSchoolEffectSelection,
  AttributeBoostEffectSelection,
  UtilitySpellsEffectSelection,
  SubclassEffectSelection,
  EffectSelection,
  
  // Character types
  Character,
  CreateCharacterData,
} from "../schemas/character";

import type { CharacterFeature } from "../schemas/features";

// Re-export all types for backward compatibility
export type {
  // Basic types
  AttributeName,
  Attributes,
  Skill,
  Skills,
  SkillName,
  SaveAdvantageType,
  SaveAdvantageMap,
  HitDieSize,
  HitPoints,
  ActionTracker,
  HitDice,
  Wounds,
  CharacterConfiguration,
  Proficiencies,
  
  // Effect selection types
  BaseEffectSelection,
  PoolFeatureEffectSelection,
  SpellSchoolEffectSelection,
  AttributeBoostEffectSelection,
  UtilitySpellsEffectSelection,
  SubclassEffectSelection,
  EffectSelection,
  
  // Character types
  Character,
  CreateCharacterData,
  CharacterFeature,
};