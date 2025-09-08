import { AbilityDefinition } from "../schemas/abilities";
import { ArmorProficiency, ClassFeature, WeaponProficiency } from "./class";
import { FeatureEffect } from "./feature-effects";
import { Inventory } from "./inventory";
import { ResourceDefinition, ResourceValue } from "./resources";

// Import types from schemas
import type { 
  AttributeName, 
  Attributes, 
  Skill,
  SaveAdvantageType,
  SaveAdvantageMap,
  HitDieSize
} from "../schemas/character";

// Re-export for backward compatibility
export type { 
  AttributeName, 
  Attributes, 
  Skill,
  SaveAdvantageType,
  SaveAdvantageMap,
  HitDieSize
};


export interface CharacterFeature {
  id: string; // Unique identifier for the feature
  name: string;
  description: string;
  effects: FeatureEffect[]; // Array of effects this feature provides
}

// Base interface for all effect selections (now tracks by effect ID)
export interface BaseEffectSelection {
  grantedByEffectId: string; // ID of the effect that granted this selection
}

// Feature pool selection
export interface PoolFeatureEffectSelection extends BaseEffectSelection {
  type: "pool_feature";
  poolId: string; // ID of the pool the feature was selected from
  featureId: string; // Unique ID of the selected feature within the pool
  feature: ClassFeature; // The actual feature that was selected
}

// Spell school selection
export interface SpellSchoolEffectSelection extends BaseEffectSelection {
  type: "spell_school";
  schoolId: string; // ID of the selected spell school
}

// Attribute boost selection
export interface AttributeBoostEffectSelection extends BaseEffectSelection {
  type: "attribute_boost";
  attribute: AttributeName; // Which attribute was boosted
  amount: number; // How much the boost was
}

// Utility spell selection
export interface UtilitySpellsEffectSelection extends BaseEffectSelection {
  type: "utility_spells";
  spellIds: string[]; // IDs of the selected utility spells
  fromSchools: string[]; // Which schools these spells came from
}

// Subclass selection
export interface SubclassEffectSelection extends BaseEffectSelection {
  type: "subclass";
  subclassId: string; // ID of the selected subclass
}

// Union type for all effect selections
export type EffectSelection =
  | PoolFeatureEffectSelection
  | SpellSchoolEffectSelection
  | AttributeBoostEffectSelection
  | UtilitySpellsEffectSelection
  | SubclassEffectSelection;

export interface ActionTracker {
  current: number; // Currently available actions
  base: number; // Base actions per turn (default 3)
  bonus: number; // Additional permanent actions gained
}

export interface HitDice {
  size: HitDieSize; // Die size (d4, d6, d8, d10, d12)
  current: number; // Currently available hit dice
  max: number; // Maximum hit dice (equals level)
}

export interface Wounds {
  current: number; // Current wounds sustained
  max: number; // Maximum wounds before death (default 6)
}

export interface Proficiencies {
  armor: ArmorProficiency[]; // Armor types character is proficient with
  weapons: WeaponProficiency[]; // Weapon categories character is proficient with
}

export interface CharacterConfiguration {
  maxWounds: number; // Maximum wounds before death (default 6)
  maxInventorySize: number; // Base inventory size before strength bonus (default 10)
}

export interface Character {
  id: string;
  name: string;
  ancestryId: string; // Character's ancestry ID
  backgroundId: string; // Character's background ID
  level: number; // Character level (starting at 1)
  classId: string; // Character's class (e.g., 'fighter', 'wizard')
  effectSelections: EffectSelection[]; // All effect selections made by the character
  _spellTierAccess: number; // Highest tier of spells character can access (1-9, 0 for no spell access)
  _proficiencies: Proficiencies; // Armor and weapon proficiencies
  _attributes: Attributes; // Private: Use CharacterService.getAttributes() instead
  _initiative: Skill; // Private: Use CharacterService.getInitiative() instead
  _skills: Skills; // Private: Use CharacterService.getSkills() instead
  _abilities: AbilityDefinition[];
  _abilityUses: Map<string, number>; // Tracks current uses of abilities by ability ID
  _hitDice: HitDice; // Private: Use CharacterService.getHitDice() instead
  saveAdvantages: SaveAdvantageMap; // Permanent advantage/disadvantage on saves
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  wounds: Wounds; // Wounds sustained from reaching 0 HP
  _resourceDefinitions: ResourceDefinition[]; // Base resource definitions directly granted to character
  _resourceValues: Map<string, ResourceValue>; // Current values for resources (key is resource ID)
  config: CharacterConfiguration; // Character configuration settings
  speed: number; // Character's movement speed
  actionTracker: ActionTracker;
  inEncounter: boolean; // Whether currently in an encounter/combat

  inventory: Inventory;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCharacterData {
  name: string;
  ancestryId: string;
  backgroundId: string;
  level: number;
  classId: string;
  subclassId?: string;
  effectSelections: EffectSelection[]; // All effect selections made by the character
  _spellTierAccess: number; // Highest tier of spells character can access (1-9, 0 for no spell access)
  _proficiencies: Proficiencies;
  _attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    will: number;
  };
  _initiative: Skill;
  _skills: Skills;
  _abilities: AbilityDefinition[];
  _abilityUses: Map<string, number>;
  _hitDice: HitDice;
  saveAdvantages: SaveAdvantageMap;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  wounds: Wounds;
  _resourceDefinitions: ResourceDefinition[];
  _resourceValues: Map<string, ResourceValue>;
  config: CharacterConfiguration;

  speed: number;
  actionTracker: ActionTracker;
  inEncounter: boolean;

  inventory: Inventory;
}

export type SkillName = keyof Skills;

export type Skills = Record<string, Skill>;
