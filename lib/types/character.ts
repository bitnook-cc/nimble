import { Ability } from "./abilities";
import { AncestryTrait } from "./ancestry";
import { BackgroundTrait } from "./background";
import { ArmorProficiency, ClassFeature, WeaponProficiency } from "./class";
import { FeatureEffectGrant } from "./feature-effects";
import { Inventory } from "./inventory";
import { ResourceInstance } from "./resources";

export type AttributeName = "strength" | "dexterity" | "intelligence" | "will";

export interface Attributes {
  strength: number;
  dexterity: number;
  intelligence: number;
  will: number;
}

export type SaveAdvantageType = "advantage" | "disadvantage" | "normal";

export type SaveAdvantageMap = Partial<Record<AttributeName, SaveAdvantageType>>;

export interface Skill {
  name: string;
  associatedAttribute: AttributeName;
  modifier: number;
}

// Base interface for all feature selections (now tracks by effect ID)
export interface BaseSelectedFeature {
  grantedByEffectId: string; // ID of the effect that granted this selection
  selectedAt: Date; // When this selection was made
}

// Feature pool selection
export interface SelectedPoolFeature extends BaseSelectedFeature {
  type: "pool_feature";
  poolId: string; // ID of the pool the feature was selected from
  featureId: string; // Unique ID of the selected feature within the pool
  feature: ClassFeature; // The actual feature that was selected
}

// Spell school selection
export interface SelectedSpellSchool extends BaseSelectedFeature {
  type: "spell_school";
  schoolId: string; // ID of the selected spell school
}

// Attribute boost selection
export interface SelectedAttributeBoost extends BaseSelectedFeature {
  type: "attribute_boost";
  attribute: AttributeName; // Which attribute was boosted
  amount: number; // How much the boost was
}

// Utility spell selection
export interface SelectedUtilitySpells extends BaseSelectedFeature {
  type: "utility_spells";
  spellIds: string[]; // IDs of the selected utility spells
  fromSchools: string[]; // Which schools these spells came from
}

// Subclass selection
export interface SelectedSubclass extends BaseSelectedFeature {
  type: "subclass";
  subclassId: string; // ID of the selected subclass
}

// Union type for all selected features
export type SelectedFeature =
  | SelectedPoolFeature
  | SelectedSpellSchool
  | SelectedAttributeBoost
  | SelectedUtilitySpells
  | SelectedSubclass;

export interface ActionTracker {
  current: number; // Currently available actions
  base: number; // Base actions per turn (default 3)
  bonus: number; // Additional permanent actions gained
}

export type HitDieSize = 4 | 6 | 8 | 10 | 12;

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
  ancestry: AncestryTrait; // Character's ancestry with granted features
  background: BackgroundTrait; // Character's background with granted features
  level: number; // Character level (starting at 1)
  classId: string; // Character's class (e.g., 'fighter', 'wizard')
  subclassId?: string; // Character's subclass (e.g., 'fighter-champion', 'wizard-evocation')
  grantedFeatures: string[]; // IDs of class features already granted to this character (DEPRECATED - transitioning to grantedEffects)
  selectedFeatures: SelectedFeature[]; // All feature selections made by the character
  grantedEffects: FeatureEffectGrant[]; // All effects granted to this character from all sources
  spellTierAccess: number; // Highest tier of spells character can access (1-9, 0 for no spell access)
  proficiencies: Proficiencies; // Armor and weapon proficiencies
  _attributes: Attributes; // Private: Use CharacterService.getAttributes() instead
  saveAdvantages: SaveAdvantageMap; // Permanent advantage/disadvantage on saves
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  _hitDice: HitDice; // Private: Use CharacterService.getHitDice() instead
  wounds: Wounds; // Wounds sustained from reaching 0 HP
  resources: ResourceInstance[]; // Character's resources (mana, fury, etc.)
  config: CharacterConfiguration; // Character configuration settings
  _initiative: Skill; // Private: Use CharacterService.getInitiative() instead
  speed: number; // Character's movement speed
  actionTracker: ActionTracker;
  inEncounter: boolean; // Whether currently in an encounter/combat
  _skills: Skills; // Private: Use CharacterService.getSkills() instead
  inventory: Inventory;
  abilities: Ability[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCharacterData {
  name: string;
  ancestry: AncestryTrait;
  background: BackgroundTrait;
  level: number;
  classId: string;
  subclassId?: string;
  grantedFeatures: string[];
  grantedEffects: FeatureEffectGrant[]; // All effects granted to this character from all sources
  selectedFeatures: SelectedFeature[]; // All feature selections made by the character
  spellTierAccess: number; // Highest tier of spells character can access (1-9, 0 for no spell access)
  proficiencies: Proficiencies;
  _attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    will: number;
  };
  saveAdvantages: SaveAdvantageMap;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  _hitDice: HitDice;
  wounds: Wounds;
  resources: ResourceInstance[];
  config: CharacterConfiguration;
  _initiative: Skill;
  speed: number;
  actionTracker: ActionTracker;
  inEncounter: boolean;
  _skills: Skills;
  inventory: Inventory;
  abilities: Ability[];
}

export type SkillName = keyof Skills;

export type Skills = Record<string, Skill>;
