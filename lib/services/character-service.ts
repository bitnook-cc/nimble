import { Character, ActionTracker, CharacterConfiguration } from '../types/character';
import { Ability, ActionAbility, SpellAbility } from '../types/abilities';
import { DiceType } from '../types/dice';
import { Item } from '../types/inventory';
import { ICharacterService, ICharacterStorage, IActivityLog, IAbilityService, IClassService, IAncestryService, IBackgroundService } from './interfaces';
import { resourceService } from './resource-service';
import { getDiceService, getSettingsService, getClassService, getAncestryService, getBackgroundService } from './service-factory';

// Character event types
export type CharacterEventType = 'created' | 'switched' | 'deleted' | 'updated';

export interface CharacterEvent {
  type: CharacterEventType;
  characterId: string;
  character?: Character;
}

// Import for backward compatibility singleton
import { characterStorageService } from './character-storage-service';
import { activityLogService } from './activity-log-service';
import { abilityService } from './ability-service';

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
    private abilityService: IAbilityService
  ) {}

  // Public getter for character
  get character(): Character | null {
    return this._character;
  }


  // Event Management
  subscribeToEvent(eventType: CharacterEventType, listener: (event: CharacterEvent) => void): () => void {
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
      listeners.forEach(listener => listener(event));
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
          type: 'switched',
          characterId,
          character
        });
      }
      
      this._character = character;
      
      // Update settings with new active character
      const settingsService = getSettingsService();
      const settings = await settingsService.getSettings();
      const newSettings = { ...settings, activeCharacterId: characterId };
      await settingsService.saveSettings(newSettings);
      
      // Sync any missing features
      await this.syncCharacterFeatures();
      
      this.notifyCharacterChanged();
    }
    return character;
  }

  private notifyCharacterChanged(): void {
    if (this.character) {
      // Emit update event
      this.emitEvent({
        type: 'updated',
        characterId: this.character.id,
        character: this.character
      });
    }
  }

  /**
   * Sync all character features (class, ancestry, background)
   */
  private async syncCharacterFeatures(): Promise<void> {
    if (!this._character) return;

    const classService = getClassService();
    const ancestryService = getAncestryService();
    const backgroundService = getBackgroundService();

    // Sync class features
    await classService.syncCharacterFeatures();

    // Sync ancestry features
    await ancestryService.grantAncestryFeatures(this._character.id);

    // Sync background features
    await backgroundService.grantBackgroundFeatures(this._character.id);

    // Reload character to get updated features
    const updatedCharacter = await this.storageService.getCharacter(this._character.id);
    if (updatedCharacter) {
      this._character = updatedCharacter;
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
  async applyDamage(amount: number, targetType?: 'hp' | 'temp_hp'): Promise<void> {
    if (!this._character) return;

    let remainingDamage = amount;
    let newTemporary = this._character.hitPoints.temporary;
    let newCurrent = this._character.hitPoints.current;
    let actualTargetType: 'hp' | 'temp_hp' = 'hp';

    // Temp HP absorbs damage first (unless specifically targeting regular HP)
    if (targetType !== 'hp' && this._character.hitPoints.temporary > 0) {
      if (remainingDamage >= this._character.hitPoints.temporary) {
        remainingDamage -= this._character.hitPoints.temporary;
        newTemporary = 0;
        actualTargetType = remainingDamage > 0 ? 'hp' : 'temp_hp';
      } else {
        newTemporary = this._character.hitPoints.temporary - remainingDamage;
        remainingDamage = 0;
        actualTargetType = 'temp_hp';
      }
    }

    // Apply remaining damage to regular HP
    if (remainingDamage > 0) {
      newCurrent = Math.max(0, this._character.hitPoints.current - remainingDamage);
      actualTargetType = 'hp';
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
      wounds: shouldGainWound && this._character.wounds.current < this._character.wounds.max
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
    await this.logService.addLogEntry(
      this.logService.createDamageEntry(amount, actualTargetType)
    );
  }

  /**
   * Apply healing to the character
   */
  async applyHealing(amount: number): Promise<void> {
    if (!this._character) return;

    const newCurrent = Math.min(
      this._character.hitPoints.max, 
      this._character.hitPoints.current + amount
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
    await this.logService.addLogEntry(
      this.logService.createHealingEntry(amount)
    );
  }

  /**
   * Apply temporary HP to the character
   */
  async applyTemporaryHP(amount: number): Promise<void> {
    if (!this._character) return;

    const previousTempHp = this._character.hitPoints.temporary > 0 
      ? this._character.hitPoints.temporary 
      : undefined;
    
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
    await this.logService.addLogEntry(
      this.logService.createTempHPEntry(amount, previousTempHp)
    );
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
  async updateAbilities(abilities: Ability[]): Promise<void> {
    if (!this._character) return;

    this._character = {
      ...this._character,
      abilities,
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();
  }


  /**
   * Perform safe rest - restore HP, hit dice, remove wound, reset abilities and resources
   */
  async performSafeRest(): Promise<void> {
    if (!this._character) return;

    // Reset all abilities (safe rest resets everything)
    let resetAbilities = this.abilityService.resetAbilities(this._character.abilities, 'per_turn', this._character);
    resetAbilities = this.abilityService.resetAbilities(resetAbilities, 'per_encounter', this._character);
    resetAbilities = this.abilityService.resetAbilities(resetAbilities, 'per_safe_rest', this._character);

    // Reset resources that reset on safe rest
    const resourceEntries = resourceService.resetResourcesByCondition(this._character, 'safe_rest');

    // Calculate what was restored for logging
    const healingAmount = this._character.hitPoints.max - this._character.hitPoints.current;
    const hitDiceRestored = this._character.hitDice.max - this._character.hitDice.current;
    const woundsRemoved = this._character.wounds.current > 0 ? 1 : 0;
    const abilitiesReset = this._character.abilities.filter(ability => 
      ability.type === 'action' && 
      ability.frequency !== 'at_will' && 
      ability.currentUses !== ability.maxUses
    ).length;

    // Update character with full restoration
    this._character = {
      ...this._character,
      hitPoints: {
        ...this._character.hitPoints,
        current: this._character.hitPoints.max, // Full HP restoration
        temporary: 0, // Clear temporary HP
      },
      hitDice: {
        ...this._character.hitDice,
        current: this._character.hitDice.max, // Restore all hit dice
      },
      wounds: {
        ...this._character.wounds,
        current: Math.max(0, this._character.wounds.current - 1), // Remove one wound
      },
      abilities: resetAbilities,
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
        abilitiesReset
      )
    );

    // Log resource resets
    for (const entry of resourceEntries) {
      const logEntry = resourceService.createResourceLogEntry(entry, this._character!);
      await this.logService.addLogEntry(logEntry);
    }
  }

  /**
   * Perform catch breath (short rest) - roll a hit die + strength to heal
   */
  async performCatchBreath(): Promise<void> {
    if (!this._character) return;

    // Can't rest without hit dice
    if (this._character.hitDice.current <= 0) {
      await this.logService.addLogEntry(
        this.logService.createCatchBreathEntry(0, 0, 0)
      );
      return;
    }

    // Roll the hit die using dice service
    const diceService = getDiceService();
    const hitDieSize = this._character.hitDice.size;
    const strengthMod = this._character.attributes.strength;
    
    const rollResult = diceService.rollBasicDice(1, hitDieSize as DiceType, 0); // No advantage/disadvantage
    const dieRoll = rollResult.dice[0].result;
    const totalHealing = Math.max(1, dieRoll + strengthMod); // Minimum 1 HP

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
      hitDice: {
        ...this._character.hitDice,
        current: this._character.hitDice.current - 1, // Spend one hit die
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
    await this.logService.addLogEntry(
      this.logService.createCatchBreathEntry(1, actualHealing, 0)
    );

    // Also log the dice roll for transparency using proper dice service result
    await this.logService.addLogEntry(
      this.logService.createDiceRollEntry(
        rollResult.dice,
        rollResult.droppedDice,
        strengthMod,
        totalHealing,
        `Catch Breath (d${hitDieSize} + ${strengthMod} STR = ${totalHealing} healing)`
      )
    );
  }

  /**
   * Perform make camp (long rest) - restore max hit die + strength HP
   */
  async performMakeCamp(): Promise<void> {
    if (!this._character) return;

    // Can't rest without hit dice
    if (this._character.hitDice.current <= 0) {
      return;
    }

    // Calculate healing: max hit die + strength
    const hitDieSize = this._character.hitDice.size;
    const strengthMod = this._character.attributes.strength;
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
      hitDice: {
        ...this._character.hitDice,
        current: this._character.hitDice.current - 1, // Use one hit die
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
    await this.logService.addLogEntry(
      this.logService.createMakeCampEntry(actualHealing, 0, 0)
    );
  }

  /**
   * End encounter - reset per-encounter abilities, action tracker, and resources
   */
  async endEncounter(): Promise<void> {
    if (!this._character) return;

    // Reset both per-encounter and per-turn abilities when encounter ends
    let resetAbilities = this.abilityService.resetAbilities(this._character.abilities, 'per_encounter', this._character);
    resetAbilities = this.abilityService.resetAbilities(resetAbilities, 'per_turn', this._character);

    // Reset resources that reset on encounter end
    const resourceEntries = resourceService.resetResourcesByCondition(this._character, 'encounter_end');

    this._character = {
      ...this._character,
      inEncounter: false,
      actionTracker: {
        ...this._character.actionTracker,
        current: this._character.actionTracker.base,
        bonus: 0
      },
      abilities: resetAbilities
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log resource resets
    for (const entry of resourceEntries) {
      const logEntry = resourceService.createResourceLogEntry(entry, this._character!);
      await this.logService.addLogEntry(logEntry);
    }
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
    const resetAbilities = this.abilityService.resetAbilities(this._character.abilities, 'per_turn', this._character);
    
    // Reset resources that reset on turn end
    const resourceEntries = resourceService.resetResourcesByCondition(this._character, 'turn_end');
    
    this._character = {
      ...this._character,
      actionTracker: {
        ...this._character.actionTracker,
        current: this._character.actionTracker.base,
        bonus: 0
      },
      abilities: resetAbilities
    };

    await this.saveCharacter();
    this.notifyCharacterChanged();

    // Log resource resets
    for (const entry of resourceEntries) {
      const logEntry = resourceService.createResourceLogEntry(entry, this._character!);
      await this.logService.addLogEntry(logEntry);
    }
  }

  /**
   * Perform weapon attack with automatic action deduction
   */
  async performAttack(weaponName: string, damage: string, attributeModifier: number, advantageLevel: number): Promise<void> {
    if (!this._character) return;

    // Check if we have enough actions for weapon attacks (always cost 1 action)
    if (this._character.inEncounter && this._character.actionTracker.current < 1) {
      console.error("Not enough actions to attack (need 1, have " + this._character.actionTracker.current + ")");
      return;
    }

    try {
      // Roll the attack using dice service
      const diceService = getDiceService();
      const rollResult = diceService.rollAttack(damage, attributeModifier, advantageLevel);
      
      // Log the attack
      const logEntry = this.logService.createDiceRollEntry(
        rollResult.dice,
        rollResult.droppedDice,
        attributeModifier,
        rollResult.total,
        `${weaponName} attack`,
        advantageLevel,
        rollResult.isMiss,
        rollResult.criticalHits
      );
      await this.logService.addLogEntry(logEntry);

      // Deduct action if in encounter (weapons always cost 1 action)
      if (this._character.inEncounter) {
        this._character = {
          ...this._character,
          actionTracker: {
            ...this._character.actionTracker,
            current: this._character.actionTracker.current - 1
          }
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

    try {
      const result = this.abilityService.useAbility(
        this._character.abilities, 
        abilityId, 
        this._character.actionTracker.current, 
        this._character.inEncounter,
        this._character.resources,
        variableResourceAmount
      );
      
      if (!result.success || !result.usedAbility) {
        if (result.actionsRequired && this._character.inEncounter && this._character.actionTracker.current < result.actionsRequired) {
          console.error(`Failed to use ability: not enough actions (need ${result.actionsRequired}, have ${this._character.actionTracker.current})`);
        } else if (result.insufficientResource) {
          console.error(`Failed to use ability: insufficient ${result.insufficientResource}`);
        } else {
          console.error("Failed to use ability: ability not found or no uses remaining");
        }
        return;
      }

      // Update character with new abilities state and deduct actions if needed
      const actionsToDeduct = result.actionsRequired || 0;
      const updatedActionTracker = this._character.inEncounter && actionsToDeduct > 0 ? {
        ...this._character.actionTracker,
        current: this._character.actionTracker.current - actionsToDeduct
      } : this._character.actionTracker;

      // Update resources if the ability consumed any
      let updatedResources = this._character.resources;
      if (result.resourceCost) {
        updatedResources = this._character.resources.map(resource => {
          if (resource.definition.id === result.resourceCost!.resourceId) {
            return {
              ...resource,
              current: resource.current - result.resourceCost!.amount
            };
          }
          return resource;
        });
      }

      this._character = { 
        ...this._character, 
        abilities: result.updatedAbilities,
        actionTracker: updatedActionTracker,
        resources: updatedResources
      };

      await this.saveCharacter();
      this.notifyCharacterChanged();

      // Log the ability usage - create different entries for spells vs actions
      if (result.usedAbility.type === 'spell') {
        const spellAbility = result.usedAbility as SpellAbility;
        const resourceCostInfo = result.resourceCost ? {
          resourceId: result.resourceCost.resourceId,
          resourceName: this._character.resources.find(r => r.definition.id === result.resourceCost!.resourceId)?.definition.name || result.resourceCost.resourceId,
          amount: result.resourceCost.amount
        } : undefined;
        
        const spellLogEntry = this.logService.createSpellCastEntry(
          spellAbility.name,
          spellAbility.school,
          spellAbility.tier,
          result.actionsRequired || 0,
          resourceCostInfo
        );
        await this.logService.addLogEntry(spellLogEntry);
      } else {
        const actionAbility = result.usedAbility as ActionAbility;
        const maxUses = actionAbility.maxUses 
          ? this.abilityService.calculateMaxUses(actionAbility, this._character!)
          : 0;
        const logEntry = this.logService.createAbilityUsageEntry(
          actionAbility.name,
          actionAbility.frequency,
          actionAbility.currentUses || 0,
          maxUses
        );
        await this.logService.addLogEntry(logEntry);
      }

      // Handle ability roll if it has one
      if (result.usedAbility.roll) {
        const roll = result.usedAbility.roll;
        const totalModifier = this.abilityService.calculateAbilityRollModifier(roll, this._character);
        
        // Use the dice service to perform the roll
        const diceService = getDiceService();
        const diceString = `${roll.dice.count}d${roll.dice.sides}`;
        const rollResult = diceService.rollAttack(diceString, totalModifier, 0);
        const rollLogEntry = this.logService.createDiceRollEntry(
          rollResult.dice,
          rollResult.droppedDice,
          totalModifier,
          rollResult.total,
          `${result.usedAbility.name} ability roll`,
          0 // No advantage for ability rolls by default
        );
        await this.logService.addLogEntry(rollLogEntry);
      }
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

    // If attributes were updated, recalculate inventory max size based on strength
    if (updates.attributes) {
      const newStrength = updates.attributes.strength ?? this._character.attributes.strength;
      updatedCharacter = {
        ...updatedCharacter,
        inventory: {
          ...updatedCharacter.inventory,
          maxSize: 10 + newStrength,
        },
      };
    }

    // If attributes or level changed, recalculate formula-based ability uses
    if (updates.attributes || updates.level) {
      const recalculatedAbilities = this.abilityService.recalculateAbilityUses(
        updatedCharacter.abilities,
        updatedCharacter
      );
      updatedCharacter = {
        ...updatedCharacter,
        abilities: recalculatedAbilities,
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
      type: 'deleted',
      characterId
    });
  }

  notifyCharacterCreated(character: Character): void {
    // Emit create event (character creation happens in creation service)
    this.emitEvent({
      type: 'created',
      characterId: character.id,
      character
    });
  }
}

// Export a singleton instance for backward compatibility
// This is deprecated - use the service factory instead
export const characterService = new CharacterService(
  characterStorageService,
  activityLogService,
  abilityService
);