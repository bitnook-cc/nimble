import { ResourceCost, SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { ResourceInstance } from "@/lib/schemas/resources";
import { getCharacterService } from "../services/service-factory";

/**
 * Check if a character has enough resources to cast a spell
 * @param resources - The character's current resources (from CharacterService.getResources())
 * @param spell - The spell to check
 */
export function hasEnoughResourcesForSpell(
  resources: ResourceInstance[],
  spell: SpellAbilityDefinition,
): boolean {
  if (!spell.resourceCost) return true;

  const resource = resources.find((r) => r.definition.id === spell.resourceCost!.resourceId);

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

  const resource = resources.find((r) => r.definition.id === spell.resourceCost!.resourceId);

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
  const resourceName = getCharacterService().getResourceName(resourceCost.resourceId);
  
  if (resourceCost.type === "fixed") {
    return `${resourceCost.amount} ${resourceName}`;
  } else {
    // If maxAmount is not specified, show as "X+" instead of a range
    return resourceCost.maxAmount 
      ? `${resourceCost.minAmount}-${resourceCost.maxAmount} ${resourceName}`
      : `${resourceCost.minAmount}+ ${resourceName}`;
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

/**
 * Get tier color classes for spell display
 */
export function getSpellTierColor(tier: number): string {
  if (tier === 0) return "bg-gray-100 text-gray-800 border-gray-200"; // Cantrips
  if (tier === 1) return "bg-green-100 text-green-800 border-green-200";
  if (tier <= 3) return "bg-blue-100 text-blue-800 border-blue-200";
  if (tier <= 6) return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-red-100 text-red-800 border-red-200";
}
