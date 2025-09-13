// Import and re-export all character-related types from schemas
import type {
  ActionTracker,
  AttributeBoostTraitSelection,
  // Basic types
  AttributeName,
  Attributes,
  // Trait selection types
  BaseTraitSelection,
  // Character types
  Character,
  CharacterConfiguration,
  CreateCharacterData,
  TraitSelection,
  HitDice,
  HitDieSize,
  HitPoints,
  PoolFeatureTraitSelection,
  Proficiencies,
  SaveAdvantageMap,
  SaveAdvantageType,
  Skill,
  SkillName,
  Skills,
  SpellSchoolTraitSelection,
  SubclassTraitSelection,
  UtilitySpellsTraitSelection,
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

  // Trait selection types
  BaseTraitSelection,
  PoolFeatureTraitSelection,
  SpellSchoolTraitSelection,
  AttributeBoostTraitSelection,
  UtilitySpellsTraitSelection,
  SubclassTraitSelection,
  TraitSelection,

  // Character types
  Character,
  CreateCharacterData,
  CharacterFeature,
};
