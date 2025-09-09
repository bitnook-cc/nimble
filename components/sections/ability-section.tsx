"use client";

import {
  ChevronDown,
  ChevronRight,
  Edit,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { abilityService } from "@/lib/services/ability-service";
import {
  AbilityDefinition,
  AbilityFrequency,
  ActionAbilityDefinition,
} from "@/lib/schemas/abilities";
import { AttributeName } from "@/lib/schemas/character";
import { FlexibleValue } from "@/lib/schemas/flexible-value";
import { parseDiceExpression } from "@/lib/utils/dice-parser";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

interface NewAbilityForm {
  name: string;
  description: string;
  type: "freeform" | "action";
  frequency: AbilityFrequency;
  maxUses?: FlexibleValue;
  maxUsesType?: "fixed" | "formula"; // For form UI
  maxUsesValue?: number; // For fixed type
  maxUsesExpression?: string; // For formula type
  actionCost?: number;
  roll?: {
    dice: string;
    modifier?: number;
    attribute?: AttributeName;
  };
  resourceCost?: {
    type: "fixed" | "variable";
    resourceId: string;
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
  };
}

export function AbilitySection() {
  // Get everything we need from service hooks
  const { character, updateAbilities, performUseAbility } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();

  const [isAddingAbility, setIsAddingAbility] = useState(false);
  const [editingAbility, setEditingAbility] = useState<string | null>(null);
  const [newAbility, setNewAbility] = useState<NewAbilityForm>({
    name: "",
    description: "",
    type: "freeform",
    frequency: "per_encounter",
    maxUsesType: "fixed",
    maxUsesValue: 1,
    maxUsesExpression: "DEX + WIL",
    actionCost: 0,
  });
  const [variableResourceAmount, setVariableResourceAmount] = useState<number>(1);

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;

  const isOpen = uiState.collapsibleSections.abilities;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("abilities", isOpen);

  // Filter out spell abilities - they have their own spells tab
  const characterService = getCharacterService();
  const allAbilities = characterService.getAbilities();
  const abilities = allAbilities.filter((ability) => ability.type !== "spell");

  const handleUseAbility = async (abilityId: string, variableAmount?: number) => {
    if (!character) return;

    await performUseAbility(abilityId, variableAmount);
  };

  const addAbility = () => {
    if (!newAbility.name.trim()) return;

    const ability: AbilityDefinition =
      newAbility.type === "freeform"
        ? {
            id: `ability-${Date.now()}`,
            name: newAbility.name,
            description: newAbility.description,
            type: "freeform",
          }
        : {
            id: `ability-${Date.now()}`,
            name: newAbility.name,
            description: newAbility.description,
            type: "action",
            frequency: newAbility.frequency,
            ...(newAbility.frequency !== "at_will" && newAbility.maxUsesType
              ? {
                  maxUses:
                    newAbility.maxUsesType === "fixed"
                      ? { type: "fixed" as const, value: newAbility.maxUsesValue || 1 }
                      : {
                          type: "formula" as const,
                          expression: newAbility.maxUsesExpression || "DEX + WIL",
                        },
                }
              : {}),
            ...(newAbility.actionCost ? { actionCost: newAbility.actionCost } : {}),
            ...(newAbility.roll && newAbility.roll.dice
              ? {
                  roll: {
                    dice: parseDiceExpression(newAbility.roll.dice) || { count: 1, sides: 6 },
                    modifier: newAbility.roll.modifier,
                    attribute: newAbility.roll.attribute,
                  },
                }
              : {}),
            ...(newAbility.resourceCost && newAbility.resourceCost.resourceId
              ? {
                  resourceCost:
                    newAbility.resourceCost.type === "fixed"
                      ? {
                          type: "fixed" as const,
                          resourceId: newAbility.resourceCost.resourceId,
                          amount: newAbility.resourceCost.amount || 1,
                        }
                      : {
                          type: "variable" as const,
                          resourceId: newAbility.resourceCost.resourceId,
                          minAmount: newAbility.resourceCost.minAmount || 1,
                          maxAmount: newAbility.resourceCost.maxAmount || 5,
                        },
                }
              : {}),
          };

    updateAbilities([...abilities, ability]);

    setNewAbility({
      name: "",
      description: "",
      type: "freeform",
      frequency: "per_encounter",
      maxUsesType: "fixed",
      maxUsesValue: 1,
      maxUsesExpression: "DEX + WIL",
      actionCost: 0,
    });
    setIsAddingAbility(false);
  };

  const deleteAbility = (abilityId: string) => {
    updateAbilities(abilities.filter((ability) => ability.id !== abilityId));
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

  const renderAbility = (ability: AbilityDefinition) => {
    if (ability.type === "freeform") {
      return (
        <Card key={ability.id} className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <h4 className="font-semibold">{ability.name}</h4>
                  <Badge variant="outline">Freeform</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{ability.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAbility(ability.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const actionAbility = ability as ActionAbilityDefinition;
    const currentUses = character._abilityUses.get(actionAbility.id) || 0;
    const maxUses = actionAbility.maxUses ? abilityService.calculateMaxUses(actionAbility) : 0;
    const isUsed = actionAbility.frequency !== "at_will" && actionAbility.maxUses && currentUses >= maxUses;

    // Check if ability has resource requirements and if we have enough resources
    const getResourceInfo = () => {
      if (!actionAbility.resourceCost) return { canAfford: true, resourceName: null };

      const resources = characterService.getResources();
      const resource = resources.find(
        (r) => r.definition.id === actionAbility.resourceCost!.resourceId,
      );
      if (!resource)
        return { canAfford: false, resourceName: actionAbility.resourceCost.resourceId };

      const requiredAmount =
        actionAbility.resourceCost.type === "fixed"
          ? actionAbility.resourceCost.amount
          : actionAbility.resourceCost.minAmount;

      return {
        canAfford: resource.current >= requiredAmount,
        resourceName: resource.definition.name,
        resource: resource,
      };
    };

    const resourceInfo = getResourceInfo();
    const canUse = !isUsed && resourceInfo.canAfford;

    return (
      <Card key={ability.id} className={`mb-2 ${!canUse ? "opacity-50" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h4 className="font-semibold">{ability.name}</h4>
                {getFrequencyBadge(actionAbility.frequency)}
                {actionAbility.frequency !== "at_will" && actionAbility.maxUses && character && (
                  <Badge variant="secondary">
                    {currentUses}/
                    {actionAbility.maxUses?.type === "fixed"
                      ? actionAbility.maxUses.value
                      : abilityService.calculateMaxUses(actionAbility)}{" "}
                    uses
                    {actionAbility.maxUses.type === "formula" && (
                      <span className="text-xs opacity-70 ml-1">
                        ({actionAbility.maxUses.expression})
                      </span>
                    )}
                  </Badge>
                )}
                {actionAbility.frequency === "at_will" && <Badge variant="outline">At Will</Badge>}
                {actionAbility.actionCost && actionAbility.actionCost > 0 && (
                  <Badge variant="outline" className="text-orange-600">
                    {actionAbility.actionCost} action{actionAbility.actionCost > 1 ? "s" : ""}
                  </Badge>
                )}
                {actionAbility.resourceCost && (
                  <Badge
                    variant="outline"
                    className={resourceInfo.canAfford ? "text-blue-600" : "text-red-600"}
                  >
                    {actionAbility.resourceCost.type === "fixed"
                      ? `${actionAbility.resourceCost.amount} ${resourceInfo.resourceName}`
                      : `${actionAbility.resourceCost.minAmount}-${actionAbility.resourceCost.maxAmount} ${resourceInfo.resourceName}`}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{ability.description}</p>
              {actionAbility.roll && (
                <div className="mb-3 p-2 bg-muted/50 rounded text-sm">
                  <strong>Roll:</strong>{" "}
                  {abilityService.getAbilityRollDescription(actionAbility.roll, character)}
                </div>
              )}

              {/* Variable resource cost selection */}
              {actionAbility.resourceCost &&
                actionAbility.resourceCost.type === "variable" &&
                canUse && (
                  <div className="mb-3 p-2 border rounded">
                    <Label className="text-sm font-medium">Spend Amount:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={
                          actionAbility.resourceCost.type === "variable"
                            ? actionAbility.resourceCost.minAmount
                            : 1
                        }
                        max={
                          actionAbility.resourceCost.type === "variable"
                            ? Math.min(
                                actionAbility.resourceCost.maxAmount,
                                resourceInfo.resource?.current || 0,
                              )
                            : resourceInfo.resource?.current || 0
                        }
                        value={variableResourceAmount}
                        onChange={(e) =>
                          setVariableResourceAmount(
                            parseInt(e.target.value) ||
                              (actionAbility.resourceCost?.type === "variable"
                                ? actionAbility.resourceCost.minAmount
                                : 1),
                          )
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {resourceInfo.resourceName} (have {resourceInfo.resource?.current || 0})
                      </span>
                    </div>
                  </div>
                )}

              <Button
                variant={!canUse ? "outline" : "default"}
                size="sm"
                onClick={() =>
                  handleUseAbility(
                    ability.id,
                    actionAbility.resourceCost?.type === "variable"
                      ? variableResourceAmount
                      : undefined,
                  )
                }
                disabled={!canUse}
              >
                {isUsed
                  ? "Used"
                  : !resourceInfo.canAfford
                    ? `Need ${resourceInfo.resourceName}`
                    : "Use Ability"}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAbility(ability.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Abilities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{abilities.length}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Existing Abilities */}
            <div className="space-y-2">
              {abilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No abilities yet. Add your first ability below!
                </div>
              ) : (
                abilities.map(renderAbility)
              )}
            </div>

            {/* Add New Ability Form */}
            {isAddingAbility ? (
              <Card className="border-dashed">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ability-name">Ability Name</Label>
                    <Input
                      id="ability-name"
                      value={newAbility.name}
                      onChange={(e) => setNewAbility({ ...newAbility, name: e.target.value })}
                      placeholder="Enter ability name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ability-description">Description</Label>
                    <Textarea
                      id="ability-description"
                      value={newAbility.description}
                      onChange={(e) =>
                        setNewAbility({ ...newAbility, description: e.target.value })
                      }
                      placeholder="Describe what this ability does"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ability-type">Type</Label>
                    <Select
                      value={newAbility.type}
                      onValueChange={(value: "freeform" | "action") =>
                        setNewAbility({ ...newAbility, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freeform">Freeform (Text only)</SelectItem>
                        <SelectItem value="action">Action (Limited uses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newAbility.type === "action" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="ability-frequency">Frequency</Label>
                        <Select
                          value={newAbility.frequency}
                          onValueChange={(value: AbilityFrequency) =>
                            setNewAbility({ ...newAbility, frequency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_turn">Per Turn</SelectItem>
                            <SelectItem value="per_encounter">Per Encounter</SelectItem>
                            <SelectItem value="per_safe_rest">Per Safe Rest</SelectItem>
                            <SelectItem value="at_will">At Will</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newAbility.frequency !== "at_will" && (
                        <div className="space-y-2">
                          <Label>Maximum Uses</Label>
                          <div className="space-y-2">
                            <Select
                              value={newAbility.maxUsesType}
                              onValueChange={(value: "fixed" | "formula") =>
                                setNewAbility({ ...newAbility, maxUsesType: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed Number</SelectItem>
                                <SelectItem value="formula">Formula</SelectItem>
                              </SelectContent>
                            </Select>

                            {newAbility.maxUsesType === "fixed" ? (
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={newAbility.maxUsesValue}
                                onChange={(e) =>
                                  setNewAbility({
                                    ...newAbility,
                                    maxUsesValue: parseInt(e.target.value) || 1,
                                  })
                                }
                                placeholder="Number of uses"
                              />
                            ) : (
                              <Input
                                type="text"
                                value={newAbility.maxUsesExpression}
                                onChange={(e) =>
                                  setNewAbility({
                                    ...newAbility,
                                    maxUsesExpression: e.target.value,
                                  })
                                }
                                placeholder="e.g., DEX + WIL + 1"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Cost */}
                      <div className="space-y-2">
                        <Label htmlFor="ability-action-cost">Action Cost</Label>
                        <Input
                          id="ability-action-cost"
                          type="number"
                          min="0"
                          max="5"
                          value={newAbility.actionCost || 0}
                          onChange={(e) =>
                            setNewAbility({
                              ...newAbility,
                              actionCost: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      {/* Resource Cost Configuration */}
                      <div className="space-y-2">
                        <Label>Resource Cost (Optional)</Label>
                        <div className="space-y-3 p-3 border rounded-md">
                          <div className="space-y-2">
                            <Label htmlFor="resource-id">Resource</Label>
                            <Select
                              value={newAbility.resourceCost?.resourceId || "none"}
                              onValueChange={(value) =>
                                setNewAbility({
                                  ...newAbility,
                                  resourceCost:
                                    value === "none"
                                      ? undefined
                                      : {
                                          type: "fixed",
                                          resourceId: value,
                                          amount: 1,
                                        },
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select resource" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No resource cost</SelectItem>
                                {characterService.getResources().map((resource) => (
                                  <SelectItem
                                    key={resource.definition.id}
                                    value={resource.definition.id}
                                  >
                                    {resource.definition.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {newAbility.resourceCost && (
                            <>
                              <div className="space-y-2">
                                <Label>Cost Type</Label>
                                <Select
                                  value={newAbility.resourceCost.type}
                                  onValueChange={(value: "fixed" | "variable") =>
                                    setNewAbility({
                                      ...newAbility,
                                      resourceCost: {
                                        ...newAbility.resourceCost!,
                                        type: value,
                                        ...(value === "fixed"
                                          ? { amount: 1 }
                                          : { minAmount: 1, maxAmount: 5 }),
                                      },
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    <SelectItem value="variable">Variable Amount</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {newAbility.resourceCost.type === "fixed" ? (
                                <div className="space-y-2">
                                  <Label htmlFor="resource-amount">Amount</Label>
                                  <Input
                                    id="resource-amount"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={newAbility.resourceCost.amount || 1}
                                    onChange={(e) =>
                                      setNewAbility({
                                        ...newAbility,
                                        resourceCost: {
                                          ...newAbility.resourceCost!,
                                          amount: parseInt(e.target.value) || 1,
                                        },
                                      })
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="resource-min">Min Amount</Label>
                                    <Input
                                      id="resource-min"
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={newAbility.resourceCost.minAmount || 1}
                                      onChange={(e) =>
                                        setNewAbility({
                                          ...newAbility,
                                          resourceCost: {
                                            ...newAbility.resourceCost!,
                                            minAmount: parseInt(e.target.value) || 1,
                                          },
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="resource-max">Max Amount</Label>
                                    <Input
                                      id="resource-max"
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={newAbility.resourceCost.maxAmount || 5}
                                      onChange={(e) =>
                                        setNewAbility({
                                          ...newAbility,
                                          resourceCost: {
                                            ...newAbility.resourceCost!,
                                            maxAmount: parseInt(e.target.value) || 5,
                                          },
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Roll Configuration */}
                      <div className="space-y-2">
                        <Label>Roll Configuration (Optional)</Label>
                        <div className="space-y-3 p-3 border rounded-md">
                          <div className="space-y-2">
                            <Label htmlFor="ability-dice">Dice (e.g., 2d4, 1d6)</Label>
                            <Input
                              id="ability-dice"
                              placeholder="2d4"
                              value={newAbility.roll?.dice || ""}
                              onChange={(e) =>
                                setNewAbility({
                                  ...newAbility,
                                  roll: {
                                    ...newAbility.roll,
                                    dice: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label htmlFor="ability-modifier">Fixed Modifier</Label>
                              <Input
                                id="ability-modifier"
                                type="number"
                                placeholder="0"
                                value={newAbility.roll?.modifier || ""}
                                onChange={(e) =>
                                  setNewAbility({
                                    ...newAbility,
                                    roll: {
                                      dice: newAbility.roll?.dice || "",
                                      ...newAbility.roll,
                                      modifier: e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined,
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="ability-attribute">Attribute</Label>
                              <Select
                                value={newAbility.roll?.attribute || "none"}
                                onValueChange={(value: AttributeName | "none") =>
                                  setNewAbility({
                                    ...newAbility,
                                    roll: {
                                      dice: newAbility.roll?.dice || "",
                                      ...newAbility.roll,
                                      attribute: value === "none" ? undefined : value,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="strength">Strength</SelectItem>
                                  <SelectItem value="dexterity">Dexterity</SelectItem>
                                  <SelectItem value="intelligence">Intelligence</SelectItem>
                                  <SelectItem value="will">Will</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={addAbility} disabled={!newAbility.name.trim()}>
                      Add Ability
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingAbility(false);
                        setNewAbility({
                          name: "",
                          description: "",
                          type: "freeform",
                          frequency: "per_encounter",
                          maxUsesType: "fixed",
                          maxUsesValue: 1,
                          maxUsesExpression: "DEX + WIL",
                          actionCost: 0,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setIsAddingAbility(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Ability
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
