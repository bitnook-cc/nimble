import { ResourceCost, SpellAbilityDefinition } from "@/lib/types/abilities";
import { ResourceInstance } from "@/lib/types/resources";

/**
 * Check if a character has enough resources to cast a spell
 * @param resources - The character's current resources (from CharacterService.getResources())
 * @param spell - The spell to check
 */
export function hasEnoughResourcesForSpell(resources: ResourceInstance[], spell: SpellAbilityDefinition): boolean {
  if (!spell.resourceCost) return true;

  const resource = resources.find(
    (r) => r.definition.id === spell.resourceCost!.resourceId,
  );

  if (!resource) return false;

  if (spell.resourceCost.type === "fixed") {
    return resource.current >= spell.resourceCost.amount;
  } else {
    return resource.current >= spell.resourceCost.minAmount;
  }
}

/**
 * Get a message describing why a spell can't be cast due to insufficient resources
 * @param resources - The character's current resources (from CharacterService.getResources())
 * @param spell - The spell to check
 */
export function getInsufficientResourceMessage(
  resources: ResourceInstance[],
  spell: SpellAbilityDefinition,
): string | null {
  if (!spell.resourceCost) return null;

  const resource = resources.find(
    (r) => r.definition.id === spell.resourceCost!.resourceId,
  );

  if (!resource) return "Missing required resource";

  if (spell.resourceCost.type === "fixed") {
    if (resource.current < spell.resourceCost.amount) {
      return `Insufficient ${resource.definition.name} (${resource.current}/${spell.resourceCost.amount} required)`;
    }
  } else {
    if (resource.current < spell.resourceCost.minAmount) {
      return `Insufficient ${resource.definition.name} (${resource.current}/${spell.resourceCost.minAmount} minimum required)`;
    }
  }

  return null;
}

/**
 * Format resource cost for display
 */
export function formatResourceCost(resourceCost: ResourceCost): string {
  if (resourceCost.type === "fixed") {
    return `${resourceCost.amount} ${resourceCost.resourceId}`;
  } else {
    return `${resourceCost.minAmount}-${resourceCost.maxAmount} ${resourceCost.resourceId}`;
  }
}

/**
 * Format action cost for display
 */
export function formatActionCost(actionCost: number | undefined): string {
  if (actionCost === undefined) return "";
  if (actionCost === 0) return "Free Action";
  if (actionCost === 1) return "Action";
  return `${actionCost} Actions`;
}
