// Import and re-export all character-related types from schemas
import type {
  ActionTracker,
  AttributeBoostEffectSelection,
  // Basic types
  AttributeName,
  Attributes,
  // Effect selection types
  BaseEffectSelection,
  // Character types
  Character,
  CharacterConfiguration,
  CreateCharacterData,
  EffectSelection,
  HitDice,
  HitDieSize,
  HitPoints,
  PoolFeatureEffectSelection,
  Proficiencies,
  SaveAdvantageMap,
  SaveAdvantageType,
  Skill,
  SkillName,
  Skills,
  SpellSchoolEffectSelection,
  SubclassEffectSelection,
  UtilitySpellsEffectSelection,
  Wounds,
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
