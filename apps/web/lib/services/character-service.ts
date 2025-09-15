import { AbilityDefinition } from "../schemas/abilities";
import {
  ActionTracker,
  AttributeBoostTraitSelection,
  AttributeName,
  Attributes,
  Character,
  CharacterConfiguration,
  TraitSelection,
  PoolFeatureTraitSelection,
  Skill,
  Skills,
  SpellSchoolTraitSelection,
  SubclassTraitSelection,
  UtilitySpellsTraitSelection,
} from "../schemas/character";
import {
  CharacterFeature,
  ClassFeature,
  FeatureTrait,
  StatBonusFeatureTrait,
} from "../schemas/features";
import { ArmorItem, EquippableItem, Item, WeaponItem } from "../schemas/inventory";
import { ResourceDefinition, ResourceInstance } from "../schemas/resources";
import { StatBonus } from "../schemas/stat-bonus";
import { calculateFlexibleValue } from "../types/flexible-value";
// Import for backward compatibility singleton
import { ContentRepositoryService } from "./content-repository-service";
import { diceService } from "./dice-service";
import { DicePoolService } from "./dice-pool-service";
import { featureSelectionService } from "./feature-selection-service";
import { FormulaEvaluatorService } from "./formula-evaluator-service";
import { IAbilityService, IActivityLog, ICharacterService, ICharacterStorage } from "./interfaces";
import { resourceService } from "./resource-service";
import {
  getAncestryService,
  getBackgroundService,
  getClassService,
  getSettingsService,
} from "./service-factory";

// Character event types
export type CharacterEventType = "created" | "switched" | "deleted" | "updated";

export interface CharacterEvent {
  type: CharacterEventType;
  characterId: string;
  character?: Character;
}

/**
 * Character Service with Dependency Injection
 * Manages character state without tight coupling to concrete implementations
 */
export class CharacterService implements ICharacterService {
  private _character: Character | null = null;
  private eventListeners: Map<CharacterEventType, ((event: CharacterEvent) => void)[]> = new Map();

  constructor(
    private storageService: ICharacterStorage,
    private logService: IActivityLog,
    private abilityService: IAbilityService,
  ) {}

  // Public getter for character
  get character(): Character | null {
    return this._character;
  }

  getAllActiveFeatures(): CharacterFeature[] {
    if (!this._character) return [];

    const classService = getClassService();
    const ancestryService = getAncestryService();
    const backgroundService = getBackgroundService();

    const features: CharacterFeature[] = [];

    const classFeatures = classService.getExpectedFeaturesForCharacter(this._character);
    for (const feature of classFeatures) {
      features.push(feature);
    }

    const ancestryFeatures = ancestryService.getExpectedFeaturesForCharacter(this._character);
    for (const feature of ancestryFeatures) {
      features.push(feature);
    }

    const backgroundFeatures = backgroundService.getExpectedFeaturesForCharacter(this._character);
    for (const feature of backgroundFeatures) {
      features.push(feature);
    }

    const selectedFeatures = this.getSelectedPoolFeatures();

    // Get features from equipped items
    const itemFeatures = this.getEquippedItems()
      .filter(
        (item): item is WeaponItem | ArmorItem => item.type === "weapon" || item.type === "armor",
      )
      .flatMap((item) => (item.feature ? [item.feature] : []));

    return [...features, ...selectedFeatures, ...itemFeatures];
  }

  getAllActiveTraits(): FeatureTrait[] {
    return this.getAllActiveFeatures().flatMap((f) => f.traits);
  }

  /**
   * Get detailed information about ability overrides
   * Returns a map of ability IDs to their override information
   */
  getAbilityOverrideInfo(): Map<
    string,
    { currentLevel: number; overriddenLevels: number[]; isManual: boolean }
  > {
    const allFeatures = this.getAllActiveFeatures();
    const abilitiesByIdAndLevel = new Map<
      string,
      Array<{ level: number; ability: any; isManual: boolean }>
    >();

    // Collect all abilities from traits grouped by ID
    for (const feature of allFeatures) {
      const level = (feature as any).level || 0;
      for (const effect of feature.traits) {
        if (effect.type === "ability") {
          const ability = (effect as any).ability;
          if (ability && ability.id) {
            if (!abilitiesByIdAndLevel.has(ability.id)) {
              abilitiesByIdAndLevel.set(ability.id, []);
            }
            abilitiesByIdAndLevel.get(ability.id)!.push({ level, ability, isManual: false });
          }
        }
      }
    }

    // Check for manually added abilities
    if (this._character) {
      for (const ability of this._character._abilities || []) {
        if (ability.id && abilitiesByIdAndLevel.has(ability.id)) {
          // Manual ability overrides all effect-granted versions
          abilitiesByIdAndLevel.get(ability.id)!.push({ level: 999, ability, isManual: true });
        }
      }
    }

    // Build override info for abilities that appear at multiple levels
    const overrideInfo = new Map<
      string,
      { currentLevel: number; overriddenLevels: number[]; isManual: boolean }
    >();

    for (const [abilityId, instances] of abilitiesByIdAndLevel) {
      if (instances.length > 1) {
        // Sort by level descending (manual = 999 will be first)
        instances.sort((a, b) => b.level - a.level);
        const current = instances[0];
        const overriddenLevels = instances
          .slice(1)
          .filter((i) => !i.isManual)
          .map((i) => i.level);

        if (overriddenLevels.length > 0) {
          overrideInfo.set(abilityId, {
            currentLevel: current.isManual ? 0 : current.level,
            overriddenLevels,
            isManual: current.isManual,
          });
        }
      }
    }

    return overrideInfo;
  }

  // Dynamic stat calculation methods

  /**
   * Get all stat bonuses from class features, ancestry features, background features, and equipped items
   */
  private getAllStatBonuses(): StatBonus[] {
    if (!this._character) return [];

    return this.getAllActiveTraits()
      .map((effect) => {
        if (effect.type === "stat_bonus") {
          return (effect as StatBonusFeatureTrait).statBonus;
        }
        return null;
      })
      .filter((bonus): bonus is StatBonus => bonus !== null);
  }

  /**
   * Get all equipped weapons from the character's inventory
   */
  private getEquippedWeapons(): WeaponItem[] {
    if (!this._character) return [];

    return this._character.inventory.items.filter(
      (item): item is WeaponItem => item.type === "weapon" && item.equipped === true,
    );
  }

  /**
   * Get all equipped armor from the character's inventory
   */
  private getEquippedArmor(): ArmorItem[] {
    if (!this._character) return [];

    return this._character.inventory.items.filter(
      (item): item is ArmorItem => item.type === "armor" && item.equipped === true,
    );
  }

  /**
   * Get all equipped items (weapons and armor) from the character's inventory
   */
  private getEquippedItems(): EquippableItem[] {
    if (!this._character) return [];

    return this._character.inventory.items.filter(
      (item): item is EquippableItem =>
        (item.type === "weapon" || item.type === "armor") && item.equipped === true,
    );
  }

  /**
   * Log ability usage to the activity log
   */
  private async logAbilityUsage(
    ability: AbilityDefinition,
    actionsUsed: number,
    resourceAmount: number,
  ): Promise<void> {
    if (!this._character) return;

    if (ability.type !== "action" && ability.type !== "spell") return;

    // Log the ability usage - create different entries for spells vs actions
    if (ability.type === "spell") {
      const resourceCostInfo = ability.resourceCost
        ? {
            resourceId: ability.resourceCost.resourceId,
            resourceName:
              this.getResourceDefinitions().find((r) => r.id === ability.resourceCost!.resourceId)
                ?.name || ability.resourceCost.resourceId,
            amount: resourceAmount,
          }
        : undefined;

      const spellLogEntry = this.logService.createSpellCastEntry(
        ability.name,
        ability.school,
        ability.tier,
        actionsUsed,
        resourceCostInfo,
      );
      await this.logService.addLogEntry(spellLogEntry);
    } else if (ability.type === "action") {
      const currentUses = this._character._abilityUses.get(ability.id) || 0;
      const maxUses = ability.maxUses ? this.abilityService.calculateMaxUses(ability) : 0;
      const logEntry = this.logService.createAbilityUsageEntry(
        ability.name,
        ability.frequency,
        currentUses,
        maxUses,
      );
      await this.logService.addLogEntry(logEntry);
    }

    // Handle ability roll if it has one
    if (ability.diceFormula) {
      let effectiveFormula = ability.diceFormula;
      
      // Apply spell scaling if this is a spell with scaling bonus
      if (ability.type === "spell") {
        const formulaEvaluator = new FormulaEvaluatorService();
        let totalBonus = 0;
        
        // Apply scaling bonus
        if (ability.scalingBonus) {
          const scalingMultiplier = this.getSpellScalingLevel();
          if (scalingMultiplier > 0) {
            const cleanScalingBonus = ability.scalingBonus.replace(/^[+-]/, '');
            const scalingBonusValue = formulaEvaluator.evaluateFormula(cleanScalingBonus);
            totalBonus += scalingBonusValue * scalingMultiplier;
          }
        }
        
        // Apply upcast bonus if extra resources were spent
        if (ability.upcastBonus && ability.resourceCost?.type === "fixed" && resourceAmount > ability.resourceCost.amount) {
          const extraResource = resourceAmount - ability.resourceCost.amount;
          const cleanUpcastBonus = ability.upcastBonus.replace(/^[+-]/, '');
          const upcastBonusValue = formulaEvaluator.evaluateFormula(cleanUpcastBonus);
          totalBonus += upcastBonusValue * extraResource;
        }
        
        // Add the total bonus to the effective formula
        if (totalBonus !== 0) {
          const sign = totalBonus > 0 ? '+' : '';
          effectiveFormula = `${ability.diceFormula}${sign}${totalBonus}`;
        }
      }
      
      // Use dice formula service for rich display
      const rollResult = diceService.evaluateDiceFormula(effectiveFormula, {
        advantageLevel: 0, // No advantage for ability rolls by default
        allowCriticals: true, // Abilities can crit
        allowFumbles: true, // Abilities can fumble
      });

      // Build the roll description with bonus breakdown
      let rollDescription = `${ability.name} ability roll`;
      if (ability.type === "spell") {
        const bonusBreakdown = [];
        
        // Check for scaling
        if (ability.scalingBonus) {
          const scalingMultiplier = this.getSpellScalingLevel();
          if (scalingMultiplier > 0) {
            bonusBreakdown.push(`Scaled ×${scalingMultiplier}`);
          }
        }
        
        // Check for upcasting
        if (ability.resourceCost?.type === "fixed" && resourceAmount > ability.resourceCost.amount) {
          const extraResource = resourceAmount - ability.resourceCost.amount;
          bonusBreakdown.push(`Upcast +${extraResource}`);
        }
        
        if (bonusBreakdown.length > 0) {
          rollDescription += ` (${bonusBreakdown.join(', ')})`;
        }
      }
      
      const rollLogEntry = this.logService.createDiceRollEntry(
        rollDescription,
        rollResult,
        0, // No advantage for ability rolls by default
      );

      await this.logService.addLogEntry(rollLogEntry);
    }
  }

  /**
   * Get all spell schools available to the character
   * Includes both directly granted schools and selected schools
   */
  getSpellSchools(): string[] {
    if (!this._character) return [];

    const schools = new Set<string>();

    // Get schools from direct spell_school traits
    const schoolEffects = this.getAllActiveTraits().filter(
      (effect) => effect.type === "spell_school",
    );

    for (const effect of schoolEffects) {
      if (effect.schoolId) {
        schools.add(effect.schoolId);
      }
    }

    // Get schools from spell_school selections
    const selectedSchools = this.getSelectedSpellSchoolIds();
    for (const schoolId of selectedSchools) {
      schools.add(schoolId);
    }

    return Array.from(schools);
  }

  /**
   * Get all spells available from the character's spell schools
   */
  private getSpellsFromSchools(): AbilityDefinition[] {
    const schools = this.getSpellSchools();
    const maxTier = this.getSpellTierAccess();
    if (schools.length === 0) return [];

    const contentRepository = ContentRepositoryService.getInstance();
    const allSpells: AbilityDefinition[] = [];

    for (const schoolId of schools) {
      // Only get combat spells (utility spells need to be explicitly selected)
      const spells = contentRepository.getCombatSpellsForSchool(schoolId);
      if (spells) {
        // Filter spells by tier access
        const accessibleSpells = spells.filter((spell: any) => spell.tier <= maxTier);
        allSpells.push(...accessibleSpells);
      }
    }
    return allSpells;
  }

  /**
   * Get all abilities including spells from all sources
   */
  getAbilities(): AbilityDefinition[] {
    if (!this._character) return [];

    // Track abilities with their source priority and level
    // Priority: manually added (highest) > higher level traits > lower level traits
    const abilitiesWithPriority = new Map<
      string,
      { ability: AbilityDefinition; priority: number; level: number }
    >();

    // 1. Get abilities from traits (non-spell abilities) with level tracking
    const allFeatures = this.getAllActiveFeatures();
    for (const feature of allFeatures) {
      const level = (feature as any).level || 0; // ClassFeature has level, others default to 0
      for (const effect of feature.traits) {
        if (effect.type === "ability") {
          const ability = (effect as any).ability;
          if (ability && ability.type !== "spell") {
            const existing = abilitiesWithPriority.get(ability.id);
            // Priority 1000 + level for effect-granted abilities
            const priority = 1000 + level;
            if (!existing || priority > existing.priority) {
              abilitiesWithPriority.set(ability.id, { ability, priority, level });
            }
          }
        }
      }
    }

    // 2. Get base abilities from character (includes directly granted spells)
    // These have highest priority (10000) as they are manually added
    for (const ability of this._character._abilities || []) {
      if (ability.id) {
        abilitiesWithPriority.set(ability.id, { ability, priority: 10000, level: 0 });
      }
    }

    // Collect the final abilities list
    const abilities: AbilityDefinition[] = Array.from(abilitiesWithPriority.values()).map(
      (item) => item.ability,
    );

    // 3. Get spells from spell schools
    const schoolSpells = this.getSpellsFromSchools();
    abilities.push(...schoolSpells);

    // 4. Get selected utility spells
    const utilitySpellIds = this.getSelectedUtilitySpellIds();
    const contentRepository = ContentRepositoryService.getInstance();

    for (const spellId of utilitySpellIds) {
      // Utility spells would need to be looked up by ID
      // This would require ContentRepository to have a getSpellById method
      // For now, we'll need to search through all schools
      const allSchools = contentRepository.getAllSpellSchools();
      for (const school of allSchools) {
        const spells = contentRepository.getSpellsBySchool(school.id);
        const spell = spells?.find((s: any) => s.id === spellId);
        if (spell) {
          abilities.push(spell);
          break;
        }
      }
    }

    // Remove duplicates for spells (in case same spell comes from multiple sources)
    const uniqueAbilities = new Map<string, AbilityDefinition>();
    for (const ability of abilities) {
      if (ability.id && !uniqueAbilities.has(ability.id)) {
        uniqueAbilities.set(ability.id, ability);
      }
    }

    return Array.from(uniqueAbilities.values());
  }

  /**
   * Get the maximum spell tier access based on traits
   */
  getSpellTierAccess(): number {
    if (!this._character) return 0;

    // Start with base spell tier access
    let maxTier = this._character._spellTierAccess || 0;

    // Check for spell tier access traits
    const tierEffects = this.getAllActiveTraits().filter(
      (effect) => effect.type === "spell_tier_access",
    );

    for (const effect of tierEffects) {
      const tierEffect = effect as any;
      if (tierEffect.maxTier > maxTier) {
        maxTier = tierEffect.maxTier;
      }
    }

    return maxTier;
  }

  /**
   * Get the spell scaling multiplier based on traits
   */
  getSpellScalingLevel(): number {
    if (!this._character) return 0;

    // Start with base spell scaling multiplier
    let scalingMultiplier = this._character._spellScalingLevel || 0;

    // Check for spell scaling traits - only highest applies
    const scalingEffects = this.getAllActiveTraits().filter(
      (effect) => effect.type === "spell_scaling",
    );

    for (const effect of scalingEffects) {
      const scalingEffect = effect as any;
      if (scalingEffect.multiplier > scalingMultiplier) {
        scalingMultiplier = scalingEffect.multiplier;
      }
    }

    return scalingMultiplier;
  }

  /**
   * Get the character's ancestry definition
   */
  getAncestry() {
    if (!this._character) return null;
    const ancestryService = getAncestryService();
    return ancestryService.getCharacterAncestry(this._character);
  }

  /**
   * Get the character's background definition
   */
  getBackground() {
    if (!this._character) return null;
    const backgroundService = getBackgroundService();
    return backgroundService.getCharacterBackground(this._character);
  }

  /**
   * Get all proficiencies including those from traits
   */
  getProficiencies() {
    if (!this._character) return { armor: [], weapons: [] };

    // Start with base proficiencies
    const proficiencies = {
      armor: [...this._character._proficiencies.armor],
      weapons: [...this._character._proficiencies.weapons],
    };

    // Add proficiencies from traits
    const profEffects = this.getAllActiveTraits().filter(
      (effect) => effect.type === "proficiency",
    );

    // Would need to implement merging logic for proficiency traits
    // For now, just return base proficiencies
    return proficiencies;
  }

  /**
   * Get all features that were selected from pools
   */
  getSelectedFeatures() {
    return this.getSelectedPoolFeatures();
  }

  /**
   * Get all resource definitions available to the character
   * Includes both directly granted resources and resources from traits
   */
  getResourceDefinitions(): ResourceDefinition[] {
    if (!this._character) return [];

    const resources = new Map<string, ResourceDefinition>();

    // 1. Add base resource definitions from character
    for (const resource of this._character._resourceDefinitions || []) {
      resources.set(resource.id, resource);
    }

    // 2. Add resources from traits
    const resourceEffects = this.getAllActiveTraits().filter(
      (effect) => effect.type === "resource",
    );

    for (const effect of resourceEffects) {
      if (effect.resourceDefinition) {
        // Effects override base resources if they have the same ID
        resources.set(effect.resourceDefinition.id, effect.resourceDefinition);
      }
    }

    return Array.from(resources.values());
  }

  /**
   * Get a specific resource definition by ID
   */
  getResourceDefinition(resourceId: string): ResourceDefinition | undefined {
    return this.getResourceDefinitions().find((r) => r.id === resourceId);
  }

  /**
   * Get the display name for a resource by ID
   */
  getResourceName(resourceId: string): string {
    const definition = this.getResourceDefinition(resourceId);
    return definition?.name || resourceId;
  }

  /**
   * Get all resources as ResourceInstance objects with current values
   * This creates ResourceInstance objects on the fly based on definitions and stored values
   */
  getResources(): ResourceInstance[] {
    if (!this._character) return [];

    const definitions = this.getResourceDefinitions();
    const instances: ResourceInstance[] = [];

    for (let i = 0; i < definitions.length; i++) {
      const definition = definitions[i];
      // Use getResourceValue to get the current value with proper fallback logic
      const currentValue = this.getResourceValue(definition.id);

      instances.push({
        definition,
        current: currentValue,
        sortOrder: i + 1,
      });
    }

    return instances;
  }

  /**
   * Get the current value of a specific resource
   * Falls back to the resource's reset value if no value is stored
   */
  getResourceValue(resourceId: string): number {
    if (!this._character) return 0;

    // Check if we have a stored value
    const storedValue = this._character._resourceValues?.get(resourceId);
    if (storedValue !== undefined) {
      return resourceService.getNumericalValue(storedValue);
    }

    // No stored value - get the default from the resource definition
    const definition = this.getResourceDefinitions().find((d) => d.id === resourceId);
    if (!definition) return 0;

    // Get the initial value for this resource
    return resourceService.calculateInitialValue(definition);
  }

  /**
   * Set the current value of a specific resource
   */
  async setResourceValue(resourceId: string, value: number): Promise<void> {
    if (!this._character) return;

    // Get the resource definition
    const definitions = this.getResourceDefinitions();
    const definition = definitions.find((d) => d.id === resourceId);

    if (!definition) {
      console.warn(`Resource ${resourceId} not found on character`);
      return;
    }

    // Use ResourceService to update the value
    this._character._resourceValues = resourceService.updateResourceValue(
      resourceId,
      value,
      definition,
      this._character._resourceValues || new Map(),
    );

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Get the selected subclass ID from effect selections
   */
  getSubclassId(): string | null {
    if (!this._character) return null;

    const subclassSelection = this._character.traitSelections.find(
      (selection): selection is SubclassTraitSelection => selection.type === "subclass",
    );

    return subclassSelection?.subclassId || null;
  }

  /**
   * Get all selected pool features (actual ClassFeature objects) from effect selections
   */
  private getSelectedPoolFeatures(): ClassFeature[] {
    if (!this._character) return [];

    const poolSelections = this._character.traitSelections.filter(
      (selection): selection is PoolFeatureTraitSelection => selection.type === "pool_feature",
    );

    return poolSelections.map((selection) => selection.feature);
  }

  /**
   * Get all selected spell school IDs from effect selections
   */
  getSelectedSpellSchoolIds(): string[] {
    if (!this._character) return [];

    const spellSchoolSelections = this._character.traitSelections.filter(
      (selection): selection is SpellSchoolTraitSelection => selection.type === "spell_school",
    );

    return spellSchoolSelections.map((selection) => selection.schoolId);
  }

  /**
   * Get the sum of all selected attribute boosts as a single Attributes object
   */
  getSelectedAttributeBoostsTotal(): Attributes {
    if (!this._character) {
      return { strength: 0, dexterity: 0, intelligence: 0, will: 0 };
    }

    const attributeBoosts = this._character.traitSelections.filter(
      (selection): selection is AttributeBoostTraitSelection =>
        selection.type === "attribute_boost",
    );

    const result: Attributes = {
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      will: 0,
    };

    for (const boost of attributeBoosts) {
      result[boost.attribute] += boost.amount;
    }

    return result;
  }

  /**
   * Get all selected utility spell IDs from effect selections
   */
  getSelectedUtilitySpellIds(): string[] {
    if (!this._character) return [];

    const contentRepository = ContentRepositoryService.getInstance();
    const utilitySpellSelections = this._character.traitSelections.filter(
      (selection): selection is UtilitySpellsTraitSelection => selection.type === "utility_spells",
    );

    const spellIds: string[] = [];

    for (const selection of utilitySpellSelections) {
      if (selection.spellId) {
        // Regular selection with specific spell ID
        spellIds.push(selection.spellId);
      } else if (selection.schoolId) {
        // Full school selection - get all utility spells from this school
        const schoolSpells = contentRepository.getUtilitySpellsForSchool(selection.schoolId);
        if (schoolSpells) {
          // Filter to only tier 0 (utility) spells that are within character's tier access
          const utilitySpells = schoolSpells.filter(
            (spell) =>
              spell.category === "utility" && spell.tier <= this._character!._spellTierAccess,
          );
          spellIds.push(...utilitySpells.map((spell) => spell.id));
        }
      }
    }

    // Remove duplicates
    return [...new Set(spellIds)];
  }

  /**
   * Get computed attributes with bonuses applied
   */
  getAttributes(): Attributes {
    if (!this._character) throw new Error("No character loaded");

    const baseAttributes = this._character._attributes;
    const bonuses = this.getAllStatBonuses();

    const selectedBoosts = this.getSelectedAttributeBoostsTotal();

    const result: Attributes = {
      strength: baseAttributes.strength + selectedBoosts.strength,
      dexterity: baseAttributes.dexterity + selectedBoosts.dexterity,
      intelligence: baseAttributes.intelligence + selectedBoosts.intelligence,
      will: baseAttributes.will + selectedBoosts.will,
    };

    // Apply stat bonuses
    for (const bonus of bonuses) {
      if (bonus.attributes) {
        if (bonus.attributes.strength) {
          result.strength += calculateFlexibleValue(bonus.attributes.strength);
        }
        if (bonus.attributes.dexterity) {
          result.dexterity += calculateFlexibleValue(bonus.attributes.dexterity);
        }
        if (bonus.attributes.intelligence) {
          result.intelligence += calculateFlexibleValue(bonus.attributes.intelligence);
        }
        if (bonus.attributes.will) {
          result.will += calculateFlexibleValue(bonus.attributes.will);
        }
      }
    }

    return result;
  }

  /**
   * Get computed skills with bonuses applied
   */
  getSkills(): Skills {
    if (!this._character) throw new Error("No character loaded");

    const baseSkills = this._character._skills;
    const bonuses = this.getAllStatBonuses();
    const result: Skills = {};

    // Start with base skills
    for (const [skillName, skill] of Object.entries(baseSkills)) {
      result[skillName] = { ...skill };
    }

    // Apply skill bonuses
    for (const bonus of bonuses) {
      if (bonus.skillBonuses) {
        for (const [skillName, skillBonus] of Object.entries(bonus.skillBonuses)) {
          if (result[skillName] && skillBonus) {
            result[skillName].modifier += calculateFlexibleValue(skillBonus);
          }
        }
      }
    }

    return result;
  }

  /**
   * Get specific skill value with bonuses applied
   */
  getSkillValue(skillName: string): Skill | null {
    const skills = this.getSkills();
    return skills[skillName] || null;
  }

  /**
   * Get computed initiative with bonuses applied
   */
  getInitiative(): Skill {
    if (!this._character) throw new Error("No character loaded");

    const baseInitiative = this._character._initiative;
    const bonuses = this.getAllStatBonuses();

    let result: Skill = { ...baseInitiative };

    // Apply initiative bonuses
    for (const bonus of bonuses) {
      if (bonus.initiativeBonus) {
        result.modifier += calculateFlexibleValue(bonus.initiativeBonus);
      }
    }

    return result;
  }

  /**
   * Get computed hit dice with bonuses applied
   */
  getHitDice() {
    if (!this._character) throw new Error("No character loaded");

    const baseHitDice = this._character._hitDice;
    const bonuses = this.getAllStatBonuses();

    let result = { ...baseHitDice };

    // Apply hit dice bonuses
    for (const bonus of bonuses) {
      if (bonus.hitDiceBonus) {
        result.max += calculateFlexibleValue(bonus.hitDiceBonus);
      }
    }

    return result;
  }

  /**
   * Get computed max wounds with bonuses applied
   */
  getMaxWounds(): number {
    if (!this._character) throw new Error("No character loaded");

    const baseMaxWounds = this._character.config.maxWounds;
    const bonuses = this.getAllStatBonuses();

    let result = baseMaxWounds;

    // Apply max wounds bonuses
    for (const bonus of bonuses) {
      if (bonus.maxWoundsBonus) {
        result += calculateFlexibleValue(bonus.maxWoundsBonus);
      }
    }

    return Math.max(1, result); // Minimum 1 wound
  }

  /**
   * Get computed armor value with bonuses applied
   */
  getArmorValue(): number {
    if (!this._character) throw new Error("No character loaded");

    const attributes = this.getAttributes();
    const bonuses = this.getAllStatBonuses();

    // Start with base dexterity
    let armorValue = attributes.dexterity;

    // Add armor bonuses from equipped armor items
    const equippedArmor = this.getEquippedArmor();

    for (const armor of equippedArmor) {
      if (armor.armor) {
        armorValue += armor.armor;

        // Apply max dex bonus restriction if this is main armor
        if (
          armor.isMainArmor &&
          armor.maxDexBonus !== undefined &&
          attributes.dexterity > armor.maxDexBonus
        ) {
          armorValue = armorValue - (attributes.dexterity - armor.maxDexBonus);
        }
      }
    }

    // Apply additional armor bonuses from features
    for (const bonus of bonuses) {
      if (bonus.armorBonus) {
        armorValue += calculateFlexibleValue(bonus.armorBonus);
      }
    }

    return Math.max(0, armorValue);
  }

  /**
   * Get computed resource max value with bonuses applied
   */
  getResourceMaxValue(resourceId: string): number {
    if (!this._character) throw new Error("No character loaded");

    const resource = this.getResourceDefinitions().find((r) => r.id === resourceId);
    if (!resource) return 0;

    const baseMax = calculateFlexibleValue(resource.maxValue);
    const bonuses = this.getAllStatBonuses();

    let result = baseMax;

    // Apply resource max bonuses
    for (const bonus of bonuses) {
      if (bonus.resourceMaxBonuses && bonus.resourceMaxBonuses[resourceId]) {
        result += calculateFlexibleValue(bonus.resourceMaxBonuses[resourceId]);
      }
    }

    return Math.max(0, result);
  }

  /**
   * Get computed resource min value with bonuses applied
   */
  getResourceMinValue(resourceId: string): number {
    if (!this._character) throw new Error("No character loaded");

    const resource = this.getResourceDefinitions().find((r) => r.id === resourceId);
    if (!resource) return 0;

    const baseMin = calculateFlexibleValue(resource.minValue);
    const bonuses = this.getAllStatBonuses();

    let result = baseMin;

    // Apply resource min bonuses
    for (const bonus of bonuses) {
      if (bonus.resourceMinBonuses && bonus.resourceMinBonuses[resourceId]) {
        result += calculateFlexibleValue(bonus.resourceMinBonuses[resourceId]);
      }
    }

    return result;
  }

  /**
   * Get computed speed with bonuses applied
   */
  getSpeed(): number {
    if (!this._character) throw new Error("No character loaded");

    const baseSpeed = this._character.speed;
    const bonuses = this.getAllStatBonuses();

    let result = baseSpeed;

    // Apply speed bonuses
    for (const bonus of bonuses) {
      if (bonus.speedBonus) {
        result += calculateFlexibleValue(bonus.speedBonus);
      }
    }

    return Math.max(0, result); // Minimum 0 speed
  }

  // Event Management
  subscribeToEvent(
    eventType: CharacterEventType,
    listener: (event: CharacterEvent) => void,
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private emitEvent(event: CharacterEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  getCurrentCharacter(): Character | null {
    return this.character;
  }

  async loadCharacter(characterId: string): Promise<Character | null> {
    const character = await this.storageService.getCharacter(characterId);
    if (character) {
      if (this._character) {
        await this.storageService.updateLastPlayed(this._character.id);
        this.emitEvent({
          type: "switched",
          characterId,
          character,
        });
      }

      this._character = character;

      // Update settings with new active character
      const settingsService = getSettingsService();
      const settings = await settingsService.getSettings();
      const newSettings = { ...settings, activeCharacterId: characterId };
      await settingsService.saveSettings(newSettings);

      this.notifyCharacterChanged();
    }
    return character;
  }

  private notifyCharacterChanged(): void {
    if (this.character) {
      // Emit update event
      this.emitEvent({
        type: "updated",
        characterId: this.character.id,
        character: this.character,
      });
      
      // Also emit window event for external listeners (like sync button)
      window.dispatchEvent(new CustomEvent('character-updated', { 
        detail: { characterId: this.character.id } 
      }));
    }
  }

  private async saveCharacter(): Promise<void> {
    if (this.character) {
      await this.storageService.updateCharacter(this.character);
    }
  }

  // Game Logic Methods

  /**
   * Apply damage to the character, handling temporary HP and wound logic
   */
  async applyDamage(amount: number, targetType?: "hp" | "temp_hp"): Promise<void> {
    if (!this._character) return;

    let remainingDamage = amount;
    let newTemporary = this._character.hitPoints.temporary;
    let newCurrent = this._character.hitPoints.current;
    let actualTargetType: "hp" | "temp_hp" = "hp";

    // Temp HP absorbs damage first (unless specifically targeting regular HP)
    if (targetType !== "hp" && this._character.hitPoints.temporary > 0) {
      if (remainingDamage >= this._character.hitPoints.temporary) {
        remainingDamage -= this._character.hitPoints.temporary;
        newTemporary = 0;
        actualTargetType = remainingDamage > 0 ? "hp" : "temp_hp";
      } else {
        newTemporary = this._character.hitPoints.temporary - remainingDamage;
        remainingDamage = 0;
        actualTargetType = "temp_hp";
      }
    }

    // Apply remaining damage to regular HP
    if (remainingDamage > 0) {
      newCurrent = Math.max(0, this._character.hitPoints.current - remainingDamage);
      actualTargetType = "hp";
    }

    // Check if character should gain a wound (dropped to 0 HP from above 0)
    const shouldGainWound = this._character.hitPoints.current > 0 && newCurrent === 0;

    // Update character state
    this._character = {
      ...this._character,
      hitPoints: {
        ...this._character.hitPoints,
        current: newCurrent,
        temporary: newTemporary,
      },
      wounds:
        shouldGainWound && this._character.wounds.current < this._character.wounds.max
          ? {
              ...this._character.wounds,
              current: this._character.wounds.current + 1,
            }
          : this._character.wounds,
    };

    // Save and notify
    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log the damage
    await this.logService.addLogEntry(this.logService.createDamageEntry(amount, actualTargetType));
  }

  /**
   * Apply healing to the character
   */
  async applyHealing(amount: number): Promise<void> {
    if (!this._character) return;

    const newCurrent = Math.min(
      this._character.hitPoints.max,
      this._character.hitPoints.current + amount,
    );

    this._character = {
      ...this._character,
      hitPoints: {
        ...this._character.hitPoints,
        current: newCurrent,
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log the healing
    await this.logService.addLogEntry(this.logService.createHealingEntry(amount));
  }

  /**
   * Apply temporary HP to the character
   */
  async applyTemporaryHP(amount: number): Promise<void> {
    if (!this._character) return;

    const previousTempHp =
      this._character.hitPoints.temporary > 0 ? this._character.hitPoints.temporary : undefined;

    // Temp HP doesn't stack - take the higher value
    const newTemporary = Math.max(this._character.hitPoints.temporary, amount);

    this._character = {
      ...this._character,
      hitPoints: {
        ...this._character.hitPoints,
        temporary: newTemporary,
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log the temp HP gain
    await this.logService.addLogEntry(this.logService.createTempHPEntry(amount, previousTempHp));
  }

  /**
   * Update character's hit points (for direct HP changes like max HP adjustments)
   */
  async updateHitPoints(current: number, max: number, temporary: number): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      hitPoints: {
        current: Math.min(current, max), // Ensure current doesn't exceed max
        max,
        temporary,
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Manually adjust wounds (for wound management UI)
   */
  async updateWounds(current: number, max: number): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      wounds: {
        current: Math.max(0, Math.min(current, max)),
        max: Math.max(1, max),
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Update action tracker
   */
  async updateActionTracker(actionTracker: ActionTracker): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      actionTracker,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Update abilities
   */
  async updateAbilities(abilities: AbilityDefinition[]): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      _abilities: abilities,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Perform safe rest - restore HP, hit dice, remove wound, reset abilities and resources
   */
  async performSafeRest(): Promise<void> {
    if (!this._character) return;

    const abilities = this.getAbilities();

    // Reset all abilities (safe rest resets everything)
    const resetAbilities = new Map([
      ...this.abilityService.resetAbilities(abilities, "per_turn", this._character),
      ...this.abilityService.resetAbilities(abilities, "per_encounter", this._character),
      ...this.abilityService.resetAbilities(abilities, "per_safe_rest", this._character),
    ]);

    // Reset resources that reset on safe rest
    const resourceDefinitions = this.getResourceDefinitions();
    const newResourceValues = resourceService.resetResourcesByCondition(
      resourceDefinitions,
      this._character._resourceValues || new Map(),
      "safe_rest",
    );

    // Calculate what was restored for logging
    const healingAmount = this._character.hitPoints.max - this._character.hitPoints.current;
    const hitDiceRestored = this._character._hitDice.max - this._character._hitDice.current;
    const woundsRemoved = this._character.wounds.current > 0 ? 1 : 0;

    // Update character with full restoration
    this._character = {
      ...this._character,
      hitPoints: {
        ...this._character.hitPoints,
        current: this._character.hitPoints.max, // Full HP restoration
        temporary: 0, // Clear temporary HP
      },
      _hitDice: {
        ...this._character._hitDice,
        current: this._character._hitDice.max, // Restore all hit dice
      },
      wounds: {
        ...this._character.wounds,
        current: Math.max(0, this._character.wounds.current - 1), // Remove one wound
      },
      _abilityUses: new Map([...this._character._abilityUses, ...resetAbilities]),
      _resourceValues: newResourceValues,
      inEncounter: false, // Safe rest ends any encounter
      actionTracker: {
        ...this._character.actionTracker,
        current: this._character.actionTracker.base,
        bonus: 0,
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log the safe rest
    await this.logService.addLogEntry(
      this.logService.createSafeRestEntry(
        healingAmount,
        hitDiceRestored,
        woundsRemoved,
        resetAbilities.size,
      ),
    );
  }

  /**
   * Perform catch breath (short rest) - roll a hit die + strength to heal
   */
  async performCatchBreath(): Promise<void> {
    if (!this._character) return;

    // Can't rest without hit dice
    if (this._character._hitDice.current <= 0) {
      await this.logService.addLogEntry(this.logService.createCatchBreathEntry(0, 0, 0));
      return;
    }

    // Roll the hit die using dice formula service
    const hitDieSize = this._character._hitDice.size;
    const strengthMod = this.getAttributes().strength;

    // Build formula for catch breath
    const formula =
      strengthMod >= 0
        ? `1d${hitDieSize} + ${strengthMod}`
        : `1d${hitDieSize} - ${Math.abs(strengthMod)}`;

    const rollResult = diceService.evaluateDiceFormula(formula, {
      advantageLevel: 0,
      allowCriticals: false, // Healing doesn't crit
      allowFumbles: false, // Healing doesn't fumble
    });

    const totalHealing = Math.max(1, rollResult.total); // Minimum 1 HP

    // Calculate actual healing applied
    const currentHP = this._character.hitPoints.current;
    const maxHP = this._character.hitPoints.max;
    const actualHealing = Math.min(totalHealing, maxHP - currentHP);

    // Update character
    this._character = {
      ...this._character,
      hitPoints: {
        ...this._character.hitPoints,
        current: Math.min(maxHP, currentHP + actualHealing),
        temporary: 0, // Clear temporary HP on rest
      },
      _hitDice: {
        ...this._character._hitDice,
        current: this._character._hitDice.current - 1, // Spend one hit die
      },
      inEncounter: false, // Catch breath ends encounter
      actionTracker: {
        ...this._character.actionTracker,
        current: this._character.actionTracker.base,
        bonus: 0,
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log the catch breath with roll details
    await this.logService.addLogEntry(this.logService.createCatchBreathEntry(1, actualHealing, 0));

    // Also log the dice roll for transparency
    const diceLogEntry = this.logService.createDiceRollEntry(`Catch Breath healing`, rollResult, 0);
    await this.logService.addLogEntry(diceLogEntry);
  }

  /**
   * Perform make camp (long rest) - restore max hit die + strength HP
   */
  async performMakeCamp(): Promise<void> {
    if (!this._character) return;

    // Can't rest without hit dice
    if (this._character._hitDice.current <= 0) {
      return;
    }

    // Calculate healing: max hit die + strength
    const hitDieSize = this._character._hitDice.size;
    const strengthMod = this.getAttributes().strength;
    const totalHealing = Math.max(1, hitDieSize + strengthMod); // Minimum 1 HP

    // Calculate actual healing applied
    const currentHP = this._character.hitPoints.current;
    const maxHP = this._character.hitPoints.max;
    const actualHealing = Math.min(totalHealing, maxHP - currentHP);

    // Update character with make camp restoration
    this._character = {
      ...this._character,
      hitPoints: {
        ...this._character.hitPoints,
        current: Math.min(maxHP, currentHP + actualHealing),
        temporary: 0, // Clear temporary HP
      },
      _hitDice: {
        ...this._character._hitDice,
        current: this._character._hitDice.current - 1, // Use one hit die
      },
      inEncounter: false, // Make camp ends any encounter
      actionTracker: {
        ...this._character.actionTracker,
        current: this._character.actionTracker.base,
        bonus: 0,
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log the make camp (no hit dice restored, no abilities reset)
    await this.logService.addLogEntry(this.logService.createMakeCampEntry(actualHealing, 0, 0));
  }

  /**
   * End encounter - reset per-encounter abilities, action tracker, and resources
   */
  async endEncounter(): Promise<void> {
    if (!this._character) return;

    const abilities = this.getAbilities();

    // Reset both per-encounter and per-turn abilities when encounter ends
    const resetAbilities = new Map([
      ...this.abilityService.resetAbilities(abilities, "per_turn", this._character),
      ...this.abilityService.resetAbilities(abilities, "per_encounter", this._character),
    ]);

    // Reset resources that reset on encounter end
    const resourceDefinitions = this.getResourceDefinitions();
    const newResourceValues = resourceService.resetResourcesByCondition(
      resourceDefinitions,
      this._character._resourceValues || new Map(),
      "encounter_end",
    );

    // Reset dice pools that reset on encounter end
    const dicePoolService = DicePoolService.getInstance();
    const resetDicePools = dicePoolService.resetDicePools(
      this._character._dicePools || [],
      "encounter_end",
      this._character,
    );

    this._character = {
      ...this._character,
      inEncounter: false,
      actionTracker: {
        ...this._character.actionTracker,
        current: this._character.actionTracker.base,
        bonus: 0,
      },
      _abilityUses: new Map([...this._character._abilityUses, ...resetAbilities]),
      _resourceValues: newResourceValues,
      _dicePools: resetDicePools,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Start encounter with initiative roll result
   */
  async startEncounter(initiativeRoll: number): Promise<void> {
    if (!this._character) return;

    // Calculate actions based on initiative roll total (game rules)
    let actionsGranted: number;
    if (initiativeRoll < 10) {
      actionsGranted = 1;
    } else if (initiativeRoll <= 20) {
      actionsGranted = 2;
    } else {
      actionsGranted = 3;
    }

    // Update character to enter encounter mode with proper action tracker
    this._character = {
      ...this._character,
      inEncounter: true,
      actionTracker: {
        ...this._character.actionTracker,
        current: actionsGranted,
        base: 3,
        bonus: 0,
      },
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * End turn - reset per-turn abilities, action tracker, and resources
   */
  async endTurn(): Promise<void> {
    if (!this._character) return;

    // Reset per-turn abilities
    const resetAbilities = this.abilityService.resetAbilities(
      this.getAbilities(),
      "per_turn",
      this._character,
    );

    // Reset resources that reset on turn end
    const resourceDefinitions = this.getResourceDefinitions();
    const newResourceValues = resourceService.resetResourcesByCondition(
      resourceDefinitions,
      this._character._resourceValues || new Map(),
      "turn_end",
    );

    // Reset dice pools that reset on turn end
    const dicePoolService = DicePoolService.getInstance();
    const resetDicePools = dicePoolService.resetDicePools(
      this._character._dicePools || [],
      "turn_end",
      this._character,
    );

    this._character = {
      ...this._character,
      actionTracker: {
        ...this._character.actionTracker,
        current: this._character.actionTracker.base,
        bonus: 0,
      },
      _abilityUses: new Map([...this._character._abilityUses, ...resetAbilities]),
      _resourceValues: newResourceValues,
      _dicePools: resetDicePools,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Perform weapon attack with automatic action deduction
   */
  async performAttack(weapon: WeaponItem, advantageLevel: number): Promise<void> {
    if (!this._character) return;

    // Check if we have enough actions for weapon attacks (always cost 1 action)
    if (this._character.inEncounter && this._character.actionTracker.current < 1) {
      console.error(
        "Not enough actions to attack (need 1, have " + this._character.actionTracker.current + ")",
      );
      return;
    }

    // Validate weapon is equipped
    if (!weapon.equipped) {
      console.error(`Weapon ${weapon.name} is not equipped`);
      return;
    }

    try {
      // Use dice formula service to evaluate the damage formula
      // The formula should include any attribute modifiers directly (e.g., "1d6 + STR")
      const rollResult = diceService.evaluateDiceFormula(weapon.damage, {
        advantageLevel,
        allowCriticals: true,
        allowFumbles: true,
        vicious: weapon.vicious || false,
      });

      // Create a proper dice roll log entry
      const logDescription = `${weapon.name} attack`;

      // Create a dice roll entry using the activity log service
      const logEntry = this.logService.createDiceRollEntry(
        logDescription,
        rollResult,
        advantageLevel,
      );

      await this.logService.addLogEntry(logEntry);

      // Deduct action if in encounter (weapons always cost 1 action)
      if (this._character.inEncounter) {
        this._character = {
          ...this._character,
          actionTracker: {
            ...this._character.actionTracker,
            current: this._character.actionTracker.current - 1,
          },
        };

        await this.saveCharacter();
        this.notifyCharacterChanged();
      }
    } catch (error) {
      console.error("Failed to perform attack:", error);
    }
  }

  /**
   * Use ability with automatic action deduction and usage tracking
   */
  async performUseAbility(abilityId: string, variableResourceAmount?: number): Promise<void> {
    if (!this._character) return;

    const ability = this.getAbilities().find((a) => a.id === abilityId);

    if (!ability || (ability.type !== "action" && ability.type !== "spell")) {
      console.error(`Ability ${abilityId} not found or not usable`);
      return;
    }

    try {
      const canUseAbility = this.abilityService.checkCanUseAbility(
        ability,
        this._character,
        variableResourceAmount,
      );

      if (!canUseAbility) {
        return;
      }

      // Update character with new abilities state and deduct actions if needed
      const actionsToDeduct = ability.actionCost || 0;
      const updatedActionTracker =
        this._character.inEncounter && actionsToDeduct > 0
          ? {
              ...this._character.actionTracker,
              current: this._character.actionTracker.current - actionsToDeduct,
            }
          : this._character.actionTracker;

      // Update resources if the ability consumed any
      const resourceAmountUsed = this.abilityService.getResourceCostAmount(
        ability,
        variableResourceAmount,
      );
      if (resourceAmountUsed > 0 && ability.resourceCost) {
        const currentValue = this.getResourceValue(ability.resourceCost.resourceId);
        await this.setResourceValue(
          ability.resourceCost.resourceId,
          currentValue - resourceAmountUsed,
        );
      }

      const currentUses = this._character._abilityUses.get(ability.id) || 0;

      this._character = {
        ...this._character,
        actionTracker: updatedActionTracker,
        _abilityUses: new Map([...this._character._abilityUses, [ability.id, currentUses + 1]]),
      };

      await this.saveCharacter();
      this.notifyCharacterChanged();

      // Log the ability usage (pass variableResourceAmount for upcasting calculation)
      await this.logAbilityUsage(ability, actionsToDeduct, variableResourceAmount || resourceAmountUsed);
    } catch (error) {
      console.error("Failed to use ability:", error);
    }
  }

  /**
   * Generic character update method (for other properties)
   */
  async updateCharacterFields(updates: Partial<Character>): Promise<void> {
    if (!this._character) return;

    let updatedCharacter = {
      ...this._character,
      ...updates,
      updatedAt: new Date(),
    };

    // If attributes were updated, recalculate inventory max size based on computed strength
    if (updates._attributes) {
      const newStrength = this.getAttributes().strength;
      updatedCharacter = {
        ...updatedCharacter,
        inventory: {
          ...updatedCharacter.inventory,
          maxSize: 10 + newStrength,
        },
      };
    }

    this._character = updatedCharacter;

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Update character configuration (wounds, max HP, etc.)
   */
  async updateCharacterConfiguration(config: CharacterConfiguration): Promise<void> {
    if (!this._character) return;

    let updatedCharacter = {
      ...this._character,
      config,
      wounds: {
        ...this._character.wounds,
        max: config.maxWounds, // Update wounds max based on config
      },
    };

    this._character = updatedCharacter;

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Get all available effect selections that need to be made
   * This includes selections from all sources (class, ancestry, background, etc.)
   */
  getAvailableTraitSelections() {
    if (!this._character) {
      return {
        poolSelections: [],
        subclassChoices: [],
        spellSchoolSelections: [],
        attributeBoosts: [],
        utilitySpellSelections: [],
      };
    }

    // Delegate to the feature selection service
    const allEffects = this.getAllActiveTraits();
    return featureSelectionService.getAvailableTraitSelections(this._character, allEffects);
  }

  /**
   * Make or update a subclass selection
   */
  async selectSubclass(subclassId: string, grantedByTraitId: string): Promise<void> {
    if (!this._character) return;

    // Remove any existing subclass selection
    const updatedSelections: TraitSelection[] = this._character.traitSelections.filter(
      (s) => s.type !== "subclass",
    );

    // Add new selection
    updatedSelections.push({
      type: "subclass" as const,
      grantedByTraitId,
      subclassId,
    });

    this._character = {
      ...this._character,
      traitSelections: updatedSelections,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Clear pool feature selections for a specific effect
   */
  async clearPoolFeatureSelections(grantedByTraitId: string): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      traitSelections: this._character.traitSelections.filter(
        (s) => !(s.type === "pool_feature" && s.grantedByTraitId === grantedByTraitId),
      ),
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Update all pool selections for a given effect
   * This replaces all existing selections for the effect with new ones
   */
  async updatePoolSelectionsForTrait(
    traitId: string,
    selections: PoolFeatureTraitSelection[],
  ): Promise<void> {
    if (!this._character) return;

    // Remove all existing selections for this effect
    const otherSelections = this._character.traitSelections.filter(
      (s) => !(s.type === "pool_feature" && s.grantedByTraitId === traitId),
    );

    // Add the new selections
    this._character = {
      ...this._character,
      traitSelections: [...otherSelections, ...selections],
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Add a spell school selection
   */
  async selectSpellSchool(schoolId: string, grantedByTraitId: string): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      traitSelections: [
        ...this._character.traitSelections,
        {
          type: "spell_school",
          grantedByTraitId,
          schoolId,
        },
      ],
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Clear spell school selections for a specific effect
   */
  async clearSpellSchoolSelections(grantedByTraitId: string): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      traitSelections: this._character.traitSelections.filter(
        (s) => !(s.type === "spell_school" && s.grantedByTraitId === grantedByTraitId),
      ),
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Make or update an attribute boost selection
   */
  async selectAttributeBoost(
    attribute: AttributeName,
    amount: number,
    grantedByTraitId: string,
  ): Promise<void> {
    if (!this._character) return;

    // Remove any existing boost from this effect
    const updatedSelections = this._character.traitSelections.filter(
      (s) => !(s.type === "attribute_boost" && s.grantedByTraitId === grantedByTraitId),
    );

    // Add new selection
    updatedSelections.push({
      type: "attribute_boost",
      grantedByTraitId,
      attribute,
      amount,
    });

    this._character = {
      ...this._character,
      traitSelections: updatedSelections,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Update all utility spell selections for a specific effect
   * This replaces all existing selections for the effect with new ones
   */
  async updateUtilitySelectionsForTrait(
    traitId: string,
    newSelections: UtilitySpellsTraitSelection[],
  ): Promise<void> {
    if (!this._character) return;

    // Remove all existing selections for this effect
    const otherSelections = this._character.traitSelections.filter(
      (s) => !(s.type === "utility_spells" && s.grantedByTraitId === traitId),
    );

    // Add the new selections
    const updatedSelections = [...otherSelections, ...newSelections];

    this._character = {
      ...this._character,
      traitSelections: updatedSelections,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  /**
   * Public method to update the character (used by class service)
   */
  async updateCharacter(character: Character): Promise<void> {
    this._character = character;
    await this.saveCharacter();
    this.notifyCharacterChanged();
    // Update event is already emitted in notifyCharacterChanged
  }

  /**
   * Add an item to the character's inventory
   */
  async addItemToInventory(item: Item): Promise<void> {
    if (!this._character) return;

    const updatedInventory = {
      ...this._character.inventory,
      items: [...this._character.inventory.items, item],
    };

    const updatedCharacter = {
      ...this._character,
      inventory: updatedInventory,
    };

    this._character = updatedCharacter;
    await this.saveCharacter();
    this.notifyCharacterChanged();
  }

  // Character Lifecycle Operations

  async deleteCharacterById(characterId: string): Promise<void> {
    await this.storageService.deleteCharacter(characterId);

    // If we deleted the current character, clear it
    if (this._character?.id === characterId) {
      this._character = null;
    }

    // Check if any characters remain
    const remainingCharacters = await this.storageService.getAllCharacters();

    // If no characters remain, clear the active character from settings
    if (remainingCharacters.length === 0) {
      const settingsService = getSettingsService();
      await settingsService.clearActiveCharacter();
    }

    // Emit delete event
    this.emitEvent({
      type: "deleted",
      characterId,
    });
    
    // Also emit window event for external listeners
    window.dispatchEvent(new CustomEvent('character-deleted', { 
      detail: { characterId } 
    }));
  }

  notifyCharacterCreated(character: Character): void {
    // Emit create event (character creation happens in creation service)
    this.emitEvent({
      type: "created",
      characterId: character.id,
      character,
    });
    
    // Also emit window event for external listeners
    window.dispatchEvent(new CustomEvent('character-created', { 
      detail: { characterId: character.id } 
    }));
  }
}
