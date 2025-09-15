import {
  AbilityDefinition,
  ActionAbilityDefinition,
  SpellAbilityDefinition,
} from "../schemas/abilities";
import { LogEntry } from "../schemas/activity-log";
import { AncestryDefinition } from "../schemas/ancestry";
import { BackgroundDefinition } from "../schemas/background";
import {
  ActionTracker,
  AttributeName,
  Attributes,
  Character,
  CharacterConfiguration,
  HitDice,
  PoolFeatureTraitSelection,
  Skill,
  Skills,
  TraitSelection,
  UtilitySpellsTraitSelection,
} from "../schemas/character";
import { ClassDefinition, FeaturePool } from "../schemas/class";
import { DicePoolDefinition, DicePoolInstance } from "../schemas/dice-pools";
import {
  CharacterFeature,
  ClassFeature,
  PickFeatureFromPoolFeatureTrait,
} from "../schemas/features";
import { Item } from "../schemas/inventory";
import { ResourceDefinition, ResourceInstance } from "../schemas/resources";
import { CreateCompleteCharacterOptions } from "../services/character-creation-service";
import { CharacterEvent, CharacterEventType } from "../services/character-service";
import { DiceFormulaResult } from "./dice-service";

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
  replaceAllCharacters(characters: Character[]): Promise<void>;
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
    description: string,
    rollResult: DiceFormulaResult,
    advantageLevel?: number,
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
  createInitiativeEntry(actionsGranted: number, rollExpression?: string, diceData?: any): LogEntry;
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
    ability: AbilityDefinition,
    character: Character,
    variableResourceAmount?: number,
  ): boolean;
  getResourceCostAmount(ability: AbilityDefinition, variableResourceAmount?: number): number;
  calculateMaxUses(ability: ActionAbilityDefinition): number;
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
  getAllActiveTraits(): import("../schemas/features").FeatureTrait[];
  getAbilities(): AbilityDefinition[];
  getAbilityOverrideInfo(): Map<
    string,
    { currentLevel: number; overriddenLevels: number[]; isManual: boolean }
  >;
  getSpellSchools(): string[];
  getSpellScalingLevel(): number;
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
    weapon: import("../schemas/inventory").WeaponItem,
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
  getResourceDefinition(resourceId: string): ResourceDefinition | undefined;
  getResourceName(resourceId: string): string;
  getResources(): ResourceInstance[];
  getResourceValue(resourceId: string): number;
  setResourceValue(resourceId: string, value: number): Promise<void>;
  spendResource(resourceId: string, amount: number): Promise<void>;
  restoreResource(resourceId: string, amount: number): Promise<void>;
  getResourceMaxValue(resourceId: string): number;
  getResourceMinValue(resourceId: string): number;
  getSpeed(): number;
  getDicePoolDefinitions(): DicePoolDefinition[];
  getDicePools(): DicePoolInstance[];
  getAvailableTraitSelections(): any; // Return type defined in feature-selection-service

  // Selection methods
  selectSubclass(subclassId: string, grantedByTraitId: string): Promise<void>;
  updatePoolSelectionsForTrait(
    traitId: string,
    selections: PoolFeatureTraitSelection[],
  ): Promise<void>;
  selectSpellSchool(schoolId: string, grantedByTraitId: string): Promise<void>;
  clearSpellSchoolSelections(grantedByTraitId: string): Promise<void>;
  selectAttributeBoost(
    attribute: AttributeName,
    amount: number,
    grantedByTraitId: string,
  ): Promise<void>;
  updateUtilitySelectionsForTrait(
    traitId: string,
    newSelections: UtilitySpellsTraitSelection[],
  ): Promise<void>;
}

/**
 * Class Service Interface
 * Handles class features and progression
 */
export interface IClassService {
  getCharacterClass(character: Character): ClassDefinition | null;
  getExpectedFeaturesForCharacter(character: Character): ClassFeature[];
  selectSubclass(
    character: Character,
    subclassId: string,
    grantedByFeatureId: string,
  ): Promise<Character>;
  canChooseSubclass(character: Character): boolean;
  getAvailableSubclassChoices(
    character: Character,
  ): import("../schemas/features").SubclassChoiceFeatureTrait[];
  getAvailableSubclassesForCharacter(
    character: Character,
  ): import("../schemas/class").SubclassDefinition[];
  hasPendingSubclassSelections(character: Character): boolean;
  getFeaturePool(classId: string, poolId: string): FeaturePool | undefined;
  getFeaturePoolById(poolId: string): FeaturePool | null;
  getAvailablePoolFeatures(
    classId: string,
    poolId: string,
    traitSelections?: TraitSelection[],
  ): ClassFeature[];
  getAvailablePoolSelections(character: Character): PickFeatureFromPoolFeatureTrait[];
  getRemainingPoolSelections(
    character: Character,
    pickFeatureFromPoolFeature: PickFeatureFromPoolFeatureTrait,
  ): number;
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
