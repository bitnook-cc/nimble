"use client";

import { RefreshCw, Sword, Swords, Zap } from "lucide-react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { AbilityFrequency, ActionAbilityDefinition } from "@/lib/schemas/abilities";
import { Character } from "@/lib/schemas/character";
import { WeaponItem } from "@/lib/schemas/inventory";
import { abilityService } from "@/lib/services/ability-service";
import { getEquippedWeapons } from "@/lib/utils/equipment";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MarkdownRenderer } from "./ui/markdown-renderer";

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
  const { performAttack, performUseAbility, refreshAbility, getAbilities, getResources } =
    useCharacterService();
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

  const handleRefreshAbility = async (abilityId: string) => {
    try {
      await refreshAbility(abilityId);
    } catch (error) {
      console.error("Failed to refresh ability:", error);
    }
  };

  const getFrequencyBadge = (frequency: AbilityFrequency) => {
    const colors = {
      per_turn: "bg-green-100 text-green-800",
      per_encounter: "bg-blue-100 text-blue-800",
      per_safe_rest: "bg-orange-100 text-orange-800",
      at_will: "bg-purple-100 text-purple-800",
      manual: "bg-yellow-100 text-yellow-800",
    };
    const labels = {
      per_turn: "Per Turn",
      per_encounter: "Per Encounter",
      per_safe_rest: "Per Safe Rest",
      at_will: "At Will",
      manual: "Manual",
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
            <Swords className="w-5 h-5" />
            Weapons
          </h3>
          <Card>
            <CardContent className="p-0">
              {weapons.map((weapon, index) => {
                const weaponActionCost = 1; // Weapons always cost 1 action
                const insufficientActions =
                  character.inEncounter && character.actionTracker.current < weaponActionCost;
                const isDisabled = insufficientActions;

                return (
                  <div
                    key={weapon.id}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      index > 0 ? "border-t" : ""
                    } ${insufficientActions ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="shrink-0 mt-1">
                          <Sword className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{weapon.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {weapon.damage}
                            {weapon.properties && weapon.properties.length > 0 && (
                              <span> • {weapon.properties.join(", ")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAttack(weapon)}
                          disabled={isDisabled}
                          className="h-8"
                        >
                          <Sword className="w-3 h-3 sm:mr-2" />
                          <span className="hidden sm:inline">
                            {insufficientActions ? "No Actions" : "Attack"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
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
                      <MarkdownRenderer
                        content={ability.description}
                        className="mb-2 text-center"
                      />

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

                    <div className="flex gap-2">
                      <Button
                        variant={isDisabled ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleUseAbility(ability)}
                        disabled={isDisabled}
                        className="flex-1"
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
                      {ability.frequency === "manual" && ability.maxUses && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefreshAbility(ability.id)}
                          title="Refresh ability uses"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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
