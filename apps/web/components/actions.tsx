"use client";

import { Sword, Zap } from "lucide-react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { AbilityFrequency, ActionAbilityDefinition } from "@/lib/schemas/abilities";
import { AttributeName, Character } from "@/lib/schemas/character";
import { WeaponItem } from "@/lib/schemas/inventory";
import { abilityService } from "@/lib/services/ability-service";
import { getEquippedWeapons } from "@/lib/utils/equipment";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Action types defined inline since actions.ts doesn't exist
type Action = WeaponAction | AbilityAction;
interface WeaponAction {
  type: "weapon";
  weapon: WeaponItem;
}
interface AbilityAction {
  type: "ability";
  ability: ActionAbilityDefinition;
}

interface ActionsProps {
  character: Character;
  onAttack: (
    weaponName: string,
    damage: string,
    attributeModifier: number,
    advantageLevel: number,
  ) => void;
  advantageLevel: number;
}

export function Actions({ character, onAttack, advantageLevel }: ActionsProps) {
  const { performAttack, performUseAbility, getAbilities, getResources } = useCharacterService();
  const abilities = getAbilities();
  const weapons = getEquippedWeapons(character.inventory.items);
  const actionAbilities = abilities.filter(
    (ability): ability is ActionAbilityDefinition => ability.type === "action",
  );

  const handleAttack = async (weapon: WeaponItem) => {
    // Check if we have enough actions for weapon attacks (always cost 1 action)
    if (character.inEncounter && character.actionTracker.current < 1) {
      console.error(
        "Not enough actions to attack (need 1, have " + character.actionTracker.current + ")",
      );
      return;
    }

    await performAttack(weapon, advantageLevel);
  };

  const handleUseAbility = async (ability: ActionAbilityDefinition) => {
    // For at-will abilities, allow usage regardless of currentUses
    // For other abilities, check if they have remaining uses
    const currentUses = character._abilityUses.get(ability.id) || 0;
    const maxUses = ability.maxUses ? abilityService.calculateMaxUses(ability) : 0;

    if (ability.frequency !== "at_will" && ability.maxUses && currentUses >= maxUses) {
      return;
    }

    // Check if we have enough actions for abilities with action costs
    const actionCost = ability.actionCost || 0;
    if (character.inEncounter && actionCost > 0 && character.actionTracker.current < actionCost) {
      console.error(
        `Not enough actions to use ability (need ${actionCost}, have ${character.actionTracker.current})`,
      );
      return;
    }

    try {
      await performUseAbility(ability.id);
    } catch (error) {
      console.error("Failed to use ability:", error);
    }
  };

  const getFrequencyBadge = (frequency: AbilityFrequency) => {
    const colors = {
      per_turn: "bg-green-100 text-green-800",
      per_encounter: "bg-blue-100 text-blue-800",
      per_safe_rest: "bg-orange-100 text-orange-800",
      at_will: "bg-purple-100 text-purple-800",
    };
    const labels = {
      per_turn: "Per Turn",
      per_encounter: "Per Encounter",
      per_safe_rest: "Per Safe Rest",
      at_will: "At Will",
    };

    return <Badge className={colors[frequency]}>{labels[frequency]}</Badge>;
  };

  if (weapons.length === 0 && actionAbilities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No equipped weapons or action abilities available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weapons Section */}
      {weapons.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sword className="w-5 h-5" />
            Weapons
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weapons.map((weapon) => {
              const weaponActionCost = 1; // Weapons always cost 1 action
              const insufficientActions =
                character.inEncounter && character.actionTracker.current < weaponActionCost;
              const isDisabled = insufficientActions;

              return (
                <Card key={weapon.id} className={insufficientActions ? "opacity-50" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-center text-base flex items-center justify-center gap-2">
                      <Sword className="w-4 h-4" />
                      {weapon.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center text-sm">
                      <div className="text-muted-foreground">{weapon.damage}</div>
                      {weapon.properties && weapon.properties.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {weapon.properties.join(", ")}
                        </div>
                      )}
                      {character.inEncounter && (
                        <div className="flex justify-center mt-2">
                          <Badge
                            variant="outline"
                            className={insufficientActions ? "text-red-600" : ""}
                          >
                            1 action
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAttack(weapon)}
                      disabled={isDisabled}
                      className="w-full"
                    >
                      <Sword className="w-4 h-4 mr-2" />
                      {insufficientActions ? "No Actions" : "Attack"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Abilities Section */}
      {actionAbilities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Abilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionAbilities.map((ability) => {
              const currentUses = character._abilityUses.get(ability.id) || 0;
              const maxUses = ability.maxUses ? abilityService.calculateMaxUses(ability) : 0;
              const remainingUses = maxUses - currentUses;
              const isUsed =
                ability.frequency !== "at_will" && ability.maxUses && currentUses >= maxUses;
              const actionCost = ability.actionCost || 0;
              const insufficientActions =
                character.inEncounter &&
                actionCost > 0 &&
                character.actionTracker.current < actionCost;

              // Check resource requirements
              const getResourceInfo = () => {
                if (!ability.resourceCost) return { canAfford: true, resourceName: null };

                const resources = getResources();
                const resource = resources.find(
                  (r) => r.definition.id === ability.resourceCost!.resourceId,
                );
                if (!resource)
                  return { canAfford: false, resourceName: ability.resourceCost.resourceId };

                const requiredAmount =
                  ability.resourceCost.type === "fixed"
                    ? ability.resourceCost.amount
                    : ability.resourceCost.minAmount;

                return {
                  canAfford: resource.current >= requiredAmount,
                  resourceName: resource.definition.name,
                };
              };

              const resourceInfo = getResourceInfo();
              const isDisabled = isUsed || insufficientActions || !resourceInfo.canAfford;

              return (
                <Card key={ability.id} className={isDisabled ? "opacity-50" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-center text-base flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      {ability.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center text-sm">
                      <div className="text-muted-foreground mb-2">{ability.description}</div>

                      {ability.diceFormula && (
                        <div className="mb-2 p-2 bg-muted/50 rounded text-sm">
                          <strong>Roll:</strong> {ability.diceFormula}
                        </div>
                      )}

                      <div className="flex justify-center gap-2 mb-2 flex-wrap">
                        {getFrequencyBadge(ability.frequency)}
                        {ability.frequency !== "at_will" && ability.maxUses && character && (
                          <Badge variant="secondary">
                            {remainingUses} / {maxUses} remaining
                          </Badge>
                        )}
                        {actionCost > 0 && (
                          <Badge
                            variant="outline"
                            className={insufficientActions ? "text-red-600" : ""}
                          >
                            {actionCost} action{actionCost !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {ability.resourceCost && (
                          <Badge
                            variant="outline"
                            className={resourceInfo.canAfford ? "text-blue-600" : "text-red-600"}
                          >
                            {ability.resourceCost.type === "fixed"
                              ? `${ability.resourceCost.amount} ${resourceInfo.resourceName}`
                              : ability.resourceCost.maxAmount
                                ? `${ability.resourceCost.minAmount}-${ability.resourceCost.maxAmount} ${resourceInfo.resourceName}`
                                : `${ability.resourceCost.minAmount}+ ${resourceInfo.resourceName}`}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant={isDisabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleUseAbility(ability)}
                      disabled={isDisabled}
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isUsed
                        ? "Used"
                        : insufficientActions
                          ? "No Actions"
                          : !resourceInfo.canAfford
                            ? `Need ${resourceInfo.resourceName}`
                            : "Use Ability"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
