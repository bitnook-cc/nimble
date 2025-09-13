import {
  AbilityDefinition,
  ActionAbilityDefinition,
  SpellAbilityDefinition,
  UsableAbilityDefinition,
} from "../schemas/abilities";
import { Character } from "../schemas/character";
import { formulaEvaluatorService } from "./formula-evaluator-service";
import { getCharacterService } from "./service-factory";

export class AbilityService {
  /**
   * Calculate the actual max uses for an ability based on its maxUses definition
   */
  calculateMaxUses(ability: ActionAbilityDefinition): number {
    if (!ability.maxUses) return 0;

    if (ability.maxUses.type === "fixed") {
      return ability.maxUses.value;
    } else {
      return formulaEvaluatorService.evaluateFormula(ability.maxUses.expression);
    }
  }

  /**
   * Use an ability and return the updated abilities array
   */
  checkCanUseAbility(
    ability: ActionAbilityDefinition | SpellAbilityDefinition,
    character: Character,
    variableResourceAmount?: number,
  ): boolean {
    const actionCost = ability.actionCost || 0;

    // Check if we have enough actions during encounters
    if (
      character.inEncounter &&
      actionCost > 0 &&
      (character.actionTracker.current || 0) < actionCost
    ) {
      console.error(
        `Cannot use ability: not enough actions (need ${actionCost}, have ${character.actionTracker.current})`,
      );
      return false;
    }
    // Check resource requirements
    // Note: Resource checking is simplified here - the actual resource availability
    // should be checked by the caller using CharacterService.getResources()
    // This just validates the variable amount is within bounds
    if (ability.resourceCost && ability.resourceCost.type === "variable") {
      const resourceCost = ability.resourceCost;
      const requiredAmount = variableResourceAmount || resourceCost.minAmount;
      
      // Get the actual max amount - if not specified, use the resource's max value
      const resourceMaxValue = getCharacterService().getResourceMaxValue(resourceCost.resourceId);
      const effectiveMaxAmount = resourceCost.maxAmount ?? resourceMaxValue;

      // Validate variable amount is within bounds
      if (requiredAmount < resourceCost.minAmount || requiredAmount > effectiveMaxAmount) {
        console.error(
          `Cannot use ability: invalid resource amount (need ${requiredAmount}, min ${resourceCost.minAmount}, max ${effectiveMaxAmount})`,
        );
        return false;
      }
    }

    // Calculate resource cost if present
    let resourceCostInfo: { resourceId: string; amount: number } | undefined;
    if (ability.resourceCost) {
      const resourceCost = ability.resourceCost;
      let requiredAmount: number;

      if (resourceCost.type === "fixed") {
        requiredAmount = resourceCost.amount;
      } else {
        requiredAmount = variableResourceAmount || resourceCost.minAmount;
      }

      resourceCostInfo = { resourceId: resourceCost.resourceId, amount: requiredAmount };
    }

    // Spells are always available (like at-will abilities)
    if (ability.type === "spell") {
      return true;
    }

    // At-will action abilities can be used if action cost is satisfied
    if (ability.type === "action" && ability.frequency === "at_will") {
      return true;
    }

    const currentUses = character._abilityUses.get(ability.id) || 0;
    const maxUses = this.calculateMaxUses(ability);

    // For limited-use action abilities, check uses remaining
    if (ability.type === "action" && currentUses && currentUses >= maxUses) {
      console.error(`Cannot use ability: no uses remaining (used ${currentUses}, max ${maxUses})`);
      return false;
    }

    return true;
  }

  getResourceCostAmount(ability: UsableAbilityDefinition, variableResourceAmount?: number): number {
    if (!ability.resourceCost) return 0;

    if (ability.resourceCost.type === "fixed") {
      return ability.resourceCost.amount;
    } else {
      // Variable cost - use provided amount or default to minimum
      return variableResourceAmount || ability.resourceCost.minAmount;
    }
  }

  /**
   * Reset abilities based on frequency
   */
  resetAbilities(
    abilities: AbilityDefinition[],
    frequency: "per_turn" | "per_encounter" | "per_safe_rest",
    character: Character,
  ): Map<string, number> {
    const resetMap = new Map(
      abilities
        .filter(
          (ability) =>
            ability.type === "action" && ability.frequency === frequency && ability.maxUses,
        )
        .map((ability) => [ability.id, 0]),
    );

    return new Map([...character._abilityUses, ...resetMap]);
  }

  /**
   * Add a new ability to the abilities collection
   */
  addAbility(abilities: AbilityDefinition[], newAbility: AbilityDefinition): AbilityDefinition[] {
    return [...abilities, newAbility];
  }

  /**
   * Remove an ability from the abilities collection
   */
  removeAbility(abilities: AbilityDefinition[], abilityId: string): AbilityDefinition[] {
    return abilities.filter((ability) => ability.id !== abilityId);
  }

  /**
   * Update an existing ability
   */
  updateAbility(
    abilities: AbilityDefinition[],
    updatedAbility: AbilityDefinition,
  ): AbilityDefinition[] {
    return abilities.map((ability) =>
      ability.id === updatedAbility.id ? updatedAbility : ability,
    );
  }

  /**
   * Get all action abilities (filtered from freeform)
   */
  getActionAbilities(abilities: AbilityDefinition[]): ActionAbilityDefinition[] {
    return abilities.filter(
      (ability): ability is ActionAbilityDefinition => ability.type === "action",
    );
  }

  /**
   * Get all spell abilities
   */
  getSpellAbilities(abilities: AbilityDefinition[]): SpellAbilityDefinition[] {
    return abilities.filter(
      (ability): ability is SpellAbilityDefinition => ability.type === "spell",
    );
  }

  /**
   * Get all usable abilities (action and spell types)
   */
  getUsableAbilities(
    abilities: AbilityDefinition[],
  ): (ActionAbilityDefinition | SpellAbilityDefinition)[] {
    return abilities.filter(
      (ability): ability is ActionAbilityDefinition | SpellAbilityDefinition =>
        ability.type === "action" || ability.type === "spell",
    );
  }
}

export const abilityService = new AbilityService();
