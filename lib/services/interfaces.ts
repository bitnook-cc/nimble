import { Character, ActionTracker, CharacterConfiguration, Attributes, Skills, Skill, HitDice } from '../types/character';
import { Ability, ActionAbility, SpellAbility, AbilityRoll } from '../types/abilities';
import { LogEntry, SingleDie } from '../types/log-entries';
import { Item } from '../types/inventory';
import { ClassFeatureGrant, ClassFeature, PickFeatureFromPoolFeature, FeaturePool } from '../types/class';
import { ResourceInstance } from '../types/resources';
import { AncestryDefinition, AncestryFeature, AncestryTrait } from '../types/ancestry';
import { BackgroundDefinition, BackgroundFeature, BackgroundTrait } from '../types/background';
import { CharacterEventType, CharacterEvent } from './character-service';

/**
 * Character Storage Interface
 * Handles persistence and retrieval of character data
 */
export interface ICharacterStorage {
  getCharacter(id: string): Promise<Character | null>;
  getAllCharacters(): Promise<Character[]>;
  createCharacter(characterData: Partial<Character>, id?: string): Promise<Character>;
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
    advantageLevel?: number,
    isMiss?: boolean,
    criticalHits?: number
  ): LogEntry;
  createHealingEntry(amount: number): LogEntry;
  createDamageEntry(amount: number, targetType: 'hp' | 'temp_hp'): LogEntry;
  createTempHPEntry(amount: number, previousAmount?: number): LogEntry;
  createResourceEntry(resourceId: string, amount: number, type: 'spent' | 'restored', currentAmount: number, maxAmount: number): LogEntry;
  createAbilityUsageEntry(abilityName: string, frequency: string, currentUses: number, maxUses: number): LogEntry;
  createInitiativeEntry(rollTotal: number, actionsGranted: number): LogEntry;
  createSafeRestEntry(healingAmount: number, hitDiceRestored: number, woundsRemoved: number, abilitiesReset: number): LogEntry;
  createCatchBreathEntry(hitDiceSpent: number, healingAmount: number, abilitiesReset: number): LogEntry;
  createMakeCampEntry(healingAmount: number, hitDiceRestored: number, abilitiesReset: number): LogEntry;
  createSpellCastEntry(spellName: string, school: string, tier: number, actionCost: number, resourceCost?: { resourceId: string; resourceName: string; amount: number }): LogEntry;
}

/**
 * Ability Service Interface
 * Handles ability management and usage
 */
export interface IAbilityService {
  resetAbilities(abilities: Ability[], frequency: 'per_turn' | 'per_encounter' | 'per_safe_rest', character: Character): Ability[];
  useAbility(abilities: Ability[], abilityId: string, availableActions?: number, inEncounter?: boolean, availableResources?: ResourceInstance[], variableResourceAmount?: number): { success: boolean; updatedAbilities: Ability[]; usedAbility: ActionAbility | SpellAbility | null; actionsRequired?: number; resourceCost?: { resourceId: string; amount: number }; insufficientResource?: string };
  calculateAbilityRollModifier(roll: AbilityRoll, character: Character): number;
  recalculateAbilityUses(abilities: Ability[], character: Character): Ability[];
  calculateMaxUses(ability: ActionAbility, character: Character): number;
}

/**
 * Character Service Interface
 * Manages character state and business logic
 */
export interface ICharacterService {
  character: Character | null;
  subscribeToEvent(eventType: CharacterEventType, listener: (event: CharacterEvent) => void): () => void;
  getCurrentCharacter(): Character | null;
  loadCharacter(characterId: string): Promise<Character | null>;
  updateCharacter(character: Character): Promise<void>;
  applyDamage(amount: number, targetType?: 'hp' | 'temp_hp'): Promise<void>;
  applyHealing(amount: number): Promise<void>;
  applyTemporaryHP(amount: number): Promise<void>;
  updateHitPoints(current: number, max: number, temporary: number): Promise<void>;
  updateWounds(current: number, max: number): Promise<void>;
  updateActionTracker(actionTracker: ActionTracker): Promise<void>;
  updateAbilities(abilities: Ability[]): Promise<void>;
  startEncounter(initiativeRoll: number): Promise<void>;
  performSafeRest(): Promise<void>;
  performCatchBreath(): Promise<void>;
  performMakeCamp(): Promise<void>;
  endEncounter(): Promise<void>;
  endTurn(): Promise<void>;
  performAttack(weaponName: string, damage: string, attributeModifier: number, advantageLevel: number): Promise<void>;
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
  getResourceMaxValue(resourceId: string): number;
  getResourceMinValue(resourceId: string): number;
}

/**
 * Class Service Interface
 * Handles class features and progression
 */
export interface IClassService {
  getExpectedFeaturesForCharacter(character: Character): ClassFeature[];
  getMissingFeatures(character: Character): ClassFeature[];
  syncCharacterFeatures(): Promise<ClassFeatureGrant[]>;
  levelUpCharacter(targetLevel: number): Promise<ClassFeatureGrant[]>;
  selectSubclass(character: Character, subclassId: string, grantedByFeatureId: string): Promise<Character>;
  canChooseSubclass(character: Character): boolean;
  getAvailableSubclassChoices(character: Character): import('../types/class').SubclassChoiceFeature[];
  getAvailableSubclassesForCharacter(character: Character): import('../types/class').SubclassDefinition[];
  hasPendingSubclassSelections(character: Character): boolean;
  getFeaturePool(classId: string, poolId: string): FeaturePool | undefined;
  getAvailablePoolFeatures(character: Character, poolId: string): ClassFeature[];
  getAvailablePoolSelections(character: Character): PickFeatureFromPoolFeature[];
  selectPoolFeature(character: Character, poolId: string, selectedFeature: ClassFeature, grantedByFeatureId: string): Promise<Character>;
  getRemainingPoolSelections(character: Character, pickFeatureFromPoolFeature: PickFeatureFromPoolFeature): number;
  generateFeatureId(classId: string, level: number, featureName: string, subclassId?: string): string;
  getAllGrantedFeatures(character: Character): ClassFeature[];
}

/**
 * Ancestry Service Interface
 * Handles ancestry features and traits
 */
export interface IAncestryService {
  getCharacterAncestry(character: Character): AncestryDefinition | null;
  getExpectedFeaturesForCharacter(character: Character): AncestryFeature[];
  getMissingFeatures(character: Character): AncestryFeature[];
  grantAncestryFeatures(characterId: string): Promise<void>;
  createAncestryTrait(ancestryId: string): AncestryTrait;
  getAvailableAncestries(): AncestryDefinition[];
  addCustomAncestry(ancestry: AncestryDefinition): Promise<void>;
  removeCustomAncestry(ancestryId: string): Promise<void>;
  getAllGrantedFeatures(character: Character): AncestryFeature[];
}

/**
 * Background Service Interface
 * Handles background features and traits
 */
export interface IBackgroundService {
  getCharacterBackground(character: Character): BackgroundDefinition | null;
  getExpectedFeaturesForCharacter(character: Character): BackgroundFeature[];
  getMissingFeatures(character: Character): BackgroundFeature[];
  grantBackgroundFeatures(characterId: string): Promise<void>;
  createBackgroundTrait(backgroundId: string): BackgroundTrait;
  getAvailableBackgrounds(): BackgroundDefinition[];
  addCustomBackground(background: BackgroundDefinition): Promise<void>;
  removeCustomBackground(backgroundId: string): Promise<void>;
  validateBackgroundDefinition(background: Partial<BackgroundDefinition>): boolean;
  getAllGrantedFeatures(character: Character): BackgroundFeature[];
}

/**
 * Character Creation Service Interface
 * Handles character creation and initialization
 */
export interface ICharacterCreation {
  quickCreateCharacter(options: QuickCreateOptions): Promise<Character>;
  createCompleteCharacter(options: any): Promise<Character>; // Using any temporarily to avoid circular dependency
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