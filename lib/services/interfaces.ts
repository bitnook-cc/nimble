import {
  AbilityDefinition,
  AbilityRoll,
  ActionAbilityDefinition,
  SpellAbilityDefinition,
  UsableAbilityDefinition,
} from "../types/abilities";
import { AncestryDefinition } from "../types/ancestry";
import { BackgroundDefinition } from "../types/background";
import {
  ActionTracker,
  Attributes,
  Character,
  CharacterConfiguration,
  CharacterFeature,
  EffectSelection,
  HitDice,
  Skill,
  Skills,
} from "../types/character";
import { ClassFeature, ClassFeatureGrant, FeaturePool } from "../types/class";
import { PickFeatureFromPoolFeatureEffect } from "../types/feature-effects";
import { Item } from "../types/inventory";
import { LogEntry, SingleDie } from "../types/log-entries";
import { ResourceDefinition, ResourceInstance } from "../types/resources";
import { CreateCompleteCharacterOptions } from "./character-creation-service";
import { CharacterEvent, CharacterEventType } from "./character-service";

/**
 * Character Storage Interface
 * Handles persistence and retrieval of character data
 */
export interface ICharacterStorage {
  getCharacter(id: string): Promise<Character | null>;
  getAllCharacters(): Promise<Character[]>;
  createCharacter(character: Character): Promise<Character>;
  updateCharacter(character: Character): Promise<void>;
  deleteCharacter(id: string): Promise<void>;
  updateLastPlayed(id: string): Promise<void>;
}

/**
 * Activity Log Interface
 * Handles logging of character actions and dice rolls
 */
export interface IActivityLog {
  getLogEntries(): Promise<LogEntry[]>;
  addLogEntry(entry: LogEntry): Promise<void>;
  clearLogEntries(): Promise<void>;
  createDiceRollEntry(
    dice: SingleDie[],
    droppedDice: SingleDie[] | undefined,
    modifier: number,
    total: number,
    description: string,
    rollExpression: string,
    advantageLevel?: number,
    isMiss?: boolean,
    criticalHits?: number,
  ): LogEntry;
  createHealingEntry(amount: number): LogEntry;
  createDamageEntry(amount: number, targetType: "hp" | "temp_hp"): LogEntry;
  createTempHPEntry(amount: number, previousAmount?: number): LogEntry;
  createResourceEntry(
    resourceId: string,
    amount: number,
    type: "spent" | "restored",
    currentAmount: number,
    maxAmount: number,
  ): LogEntry;
  createAbilityUsageEntry(
    abilityName: string,
    frequency: string,
    currentUses: number,
    maxUses: number,
  ): LogEntry;
  createInitiativeEntry(rollTotal: number, actionsGranted: number): LogEntry;
  createSafeRestEntry(
    healingAmount: number,
    hitDiceRestored: number,
    woundsRemoved: number,
    abilitiesReset: number,
  ): LogEntry;
  createCatchBreathEntry(
    hitDiceSpent: number,
    healingAmount: number,
    abilitiesReset: number,
  ): LogEntry;
  createMakeCampEntry(
    healingAmount: number,
    hitDiceRestored: number,
    abilitiesReset: number,
  ): LogEntry;
  createSpellCastEntry(
    spellName: string,
    school: string,
    tier: number,
    actionCost: number,
    resourceCost?: { resourceId: string; resourceName: string; amount: number },
  ): LogEntry;
}

/**
 * Ability Service Interface
 * Handles ability management and usage
 */
export interface IAbilityService {
  resetAbilities(
    abilities: AbilityDefinition[],
    frequency: "per_turn" | "per_encounter" | "per_safe_rest",
    character: Character,
  ): Map<string, number>;
  checkCanUseAbility(
    ability: ActionAbilityDefinition | SpellAbilityDefinition,
    character: Character,
    variableResourceAmount?: number,
  ): boolean;
  getResourceCostAmount(ability: UsableAbilityDefinition, variableResourceAmount?: number): number;
  calculateAbilityRollModifier(roll: AbilityRoll, character: Character): number;
  calculateMaxUses(ability: ActionAbilityDefinition, character: Character): number;
}

/**
 * Character Service Interface
 * Manages character state and business logic
 */
export interface ICharacterService {
  character: Character | null;
  subscribeToEvent(
    eventType: CharacterEventType,
    listener: (event: CharacterEvent) => void,
  ): () => void;
  getCurrentCharacter(): Character | null;
  loadCharacter(characterId: string): Promise<Character | null>;
  updateCharacter(character: Character): Promise<void>;
  getAllActiveFeatures(): CharacterFeature[];
  getAllActiveEffects(): import("../types/feature-effects").FeatureEffect[];
  getAbilities(): AbilityDefinition[];
  getSpellSchools(): string[];
  getSubclassId(): string | null;
  applyDamage(amount: number, targetType?: "hp" | "temp_hp"): Promise<void>;
  applyHealing(amount: number): Promise<void>;
  applyTemporaryHP(amount: number): Promise<void>;
  updateHitPoints(current: number, max: number, temporary: number): Promise<void>;
  updateWounds(current: number, max: number): Promise<void>;
  updateActionTracker(actionTracker: ActionTracker): Promise<void>;
  updateAbilities(abilities: AbilityDefinition[]): Promise<void>;
  startEncounter(initiativeRoll: number): Promise<void>;
  performSafeRest(): Promise<void>;
  performCatchBreath(): Promise<void>;
  performMakeCamp(): Promise<void>;
  endEncounter(): Promise<void>;
  endTurn(): Promise<void>;
  performAttack(
    weaponName: string,
    damage: string,
    attributeModifier: number,
    advantageLevel: number,
  ): Promise<void>;
  performUseAbility(abilityId: string, variableResourceAmount?: number): Promise<void>;
  updateCharacterFields(updates: Partial<Character>): Promise<void>;
  updateCharacterConfiguration(config: CharacterConfiguration): Promise<void>;
  deleteCharacterById(characterId: string): Promise<void>;
  notifyCharacterCreated(character: Character): void;
  addItemToInventory(item: Item): Promise<void>;

  // Dynamic stat calculation methods
  getAttributes(): Attributes;
  getSkills(): Skills;
  getSkillValue(skillName: string): Skill | null;
  getInitiative(): Skill;
  getHitDice(): HitDice;
  getMaxWounds(): number;
  getArmorValue(): number;
  getResourceDefinitions(): ResourceDefinition[];
  getResources(): ResourceInstance[];
  getResourceValue(resourceId: string): number;
  setResourceValue(resourceId: string, value: number): Promise<void>;
  getResourceMaxValue(resourceId: string): number;
  getResourceMinValue(resourceId: string): number;
  getSpeed(): number;
}

/**
 * Class Service Interface
 * Handles class features and progression
 */
export interface IClassService {
  getExpectedFeaturesForCharacter(character: Character): ClassFeature[];
  levelUpCharacter(targetLevel: number): Promise<ClassFeatureGrant[]>;
  selectSubclass(
    character: Character,
    subclassId: string,
    grantedByFeatureId: string,
  ): Promise<Character>;
  canChooseSubclass(character: Character): boolean;
  getAvailableSubclassChoices(
    character: Character,
  ): import("../types/feature-effects").SubclassChoiceFeatureEffect[];
  getAvailableSubclassesForCharacter(
    character: Character,
  ): import("../types/class").SubclassDefinition[];
  hasPendingSubclassSelections(character: Character): boolean;
  getFeaturePool(classId: string, poolId: string): FeaturePool | undefined;
  getAvailablePoolFeatures(
    classId: string,
    poolId: string,
    effectSelections?: EffectSelection[],
  ): ClassFeature[];
  getAvailablePoolSelections(character: Character): PickFeatureFromPoolFeatureEffect[];
  selectPoolFeature(
    character: Character,
    poolId: string,
    selectedFeature: ClassFeature,
    grantedByFeatureId: string,
  ): Promise<Character>;
  getRemainingPoolSelections(
    character: Character,
    pickFeatureFromPoolFeature: PickFeatureFromPoolFeatureEffect,
  ): number;
  generateFeatureId(
    classId: string,
    level: number,
    featureName: string,
    subclassId?: string,
  ): string;
}

/**
 * Ancestry Service Interface
 * Handles ancestry features and traits
 */
export interface IAncestryService {
  getCharacterAncestry(character: Character): AncestryDefinition | null;
  getExpectedFeaturesForCharacter(character: Character): CharacterFeature[];
  getAvailableAncestries(): AncestryDefinition[];
  addCustomAncestry(ancestry: AncestryDefinition): Promise<void>;
  removeCustomAncestry(ancestryId: string): Promise<void>;
}

/**
 * Background Service Interface
 * Handles background features and traits
 */
export interface IBackgroundService {
  getCharacterBackground(character: Character): BackgroundDefinition | null;
  getExpectedFeaturesForCharacter(character: Character): CharacterFeature[];
  getAvailableBackgrounds(): BackgroundDefinition[];
  addCustomBackground(background: BackgroundDefinition): Promise<void>;
  removeCustomBackground(backgroundId: string): Promise<void>;
  validateBackgroundDefinition(background: Partial<BackgroundDefinition>): boolean;
}

/**
 * Character Creation Service Interface
 * Handles character creation and initialization
 */
export interface ICharacterCreation {
  quickCreateCharacter(options: QuickCreateOptions): Promise<Character>;
  createCompleteCharacter(options: CreateCompleteCharacterOptions): Promise<Character>; // Using any temporarily to avoid circular dependency
  applyStartingEquipment(characterId: string, equipmentIds: string[]): Promise<void>;
  getClassStartingEquipment(classId: string): string[];
}

export interface QuickCreateOptions {
  name?: string; // Optional - will be generated if not provided
  ancestryId?: string; // Optional - will be random if not provided
  backgroundId?: string; // Optional - will be random if not provided
  classId: string;
  level?: number;
  attributes?: Attributes;
}
