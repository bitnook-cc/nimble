"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";

import { useState } from "react";

import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

import { EffectPreview } from "@/components/effect-preview";
import { SpellBrowser } from "@/components/spell-browser";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import {
  AbilityDefinition,
  AbilityFrequency,
  ActionAbilityDefinition,
  SpellAbilityDefinition,
} from "@/lib/schemas/abilities";
import { FlexibleValue } from "@/lib/schemas/flexible-value";
import { abilityService } from "@/lib/services/ability-service";
import { getCharacterService } from "@/lib/services/service-factory";
import {
  getExampleFormulas,
  getSupportedVariables,
  validateDiceFormula,
} from "@/lib/utils/formula-utils";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
  diceFormula?: string;
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
  const { character, updateAbilities, performUseAbility, refreshAbility } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();

  const [isAddingAbility, setIsAddingAbility] = useState(false);
  const [isSpellBrowserOpen, setIsSpellBrowserOpen] = useState(false);
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
  const [activeTab, setActiveTab] = useState<"abilities" | "spells">("abilities");

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;

  const isOpen = uiState.collapsibleSections.abilities;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("abilities", isOpen);

  // Get all abilities and separate into action abilities and spells
  const characterService = getCharacterService();
  const allAbilities = characterService.getAbilities();
  const actionAbilities = allAbilities.filter((ability) => ability.type !== "spell");
  const manualSpells = allAbilities.filter(
    (ability) => ability.type === "spell",
  ) as SpellAbilityDefinition[];

  // Helper function to determine if an ability is manually added (and therefore deletable)
  const isManuallyAddedAbility = (abilityId: string): boolean => {
    // Check if the ability is in the character's _abilities array (manually added)
    return character?._abilities.some((ability) => ability.id === abilityId) ?? false;
  };

  const handleUseAbility = async (abilityId: string, variableAmount?: number) => {
    if (!character) return;

    await performUseAbility(abilityId, variableAmount);
  };

  const handleRefreshAbility = async (abilityId: string) => {
    if (!character) return;

    await refreshAbility(abilityId);
  };

  const addAbility = () => {
    if (!newAbility.name.trim()) return;

    const ability: AbilityDefinition = {
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
      ...(newAbility.diceFormula ? { diceFormula: newAbility.diceFormula } : {}),
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
                    maxAmount: newAbility.resourceCost.maxAmount || undefined,
                  },
          }
        : {}),
    };

    updateAbilities([...actionAbilities, ability]);

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
    updateAbilities(allAbilities.filter((ability) => ability.id !== abilityId));
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

  const renderSpell = (spell: SpellAbilityDefinition) => {
    // Check if spell has resource requirements and if we have enough resources
    const getResourceInfo = () => {
      if (!spell.resourceCost) return { canAfford: true, resourceName: null };

      const resources = characterService.getResources();
      const resource = resources.find((r) => r.definition.id === spell.resourceCost!.resourceId);
      if (!resource) return { canAfford: false, resourceName: spell.resourceCost.resourceId };

      const requiredAmount =
        spell.resourceCost.type === "fixed"
          ? spell.resourceCost.amount
          : spell.resourceCost.minAmount;

      return {
        canAfford: resource.current >= requiredAmount,
        resourceName: resource.definition.name,
        resource: resource,
      };
    };

    const resourceInfo = getResourceInfo();
    const canUse = resourceInfo.canAfford;

    const getTierColor = (tier: number) => {
      if (tier === 1) return "bg-green-100 text-green-800 border-green-200";
      if (tier <= 3) return "bg-blue-100 text-blue-800 border-blue-200";
      if (tier <= 6) return "bg-purple-100 text-purple-800 border-purple-200";
      return "bg-red-100 text-red-800 border-red-200";
    };

    const hasRoll = !!spell.diceFormula;
    const SpellIcon = hasRoll ? Sparkles : Zap;

    return (
      <Card key={spell.id} className={`mb-2 ${!canUse ? "opacity-50" : ""}`}>
        <CardContent className="p-2 sm:p-3">
          <div className="space-y-2">
            {/* Title with delete button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <SpellIcon className="w-3 h-3 text-purple-500 shrink-0" />
                <h4 className="font-semibold text-sm">{spell.name}</h4>
              </div>
              {isManuallyAddedAbility(spell.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAbility(spell.id)}
                  className="text-red-500 hover:text-red-700 h-5 w-5 p-0 shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Description */}
            <MarkdownRenderer content={spell.description} className="text-sm" />

            {/* Dice formula if exists */}
            {spell.diceFormula && (
              <div className="px-1.5 py-1 bg-muted/50 rounded text-xs font-mono text-center">
                {spell.diceFormula}
                {spell.scalingBonus && (
                  <span className="text-green-600 ml-1">(+{spell.scalingBonus})</span>
                )}
              </div>
            )}

            {/* Pills and buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-wrap items-center">
                <Badge variant="outline" className={`text-xs ${getTierColor(spell.tier)}`}>
                  {spell.tier === 0 ? "Cantrip" : `T${spell.tier}`}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {spell.category === "utility" ? "Utility" : "Combat"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {spell.school}
                </Badge>
                {spell.actionCost && spell.actionCost > 0 && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    {spell.actionCost} Action{spell.actionCost > 1 ? "s" : ""}
                  </Badge>
                )}
                {spell.resourceCost && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${resourceInfo.canAfford ? "text-blue-600" : "text-red-600"}`}
                  >
                    {spell.resourceCost.type === "fixed"
                      ? `${spell.resourceCost.amount} ${resourceInfo.resourceName}`
                      : spell.resourceCost.maxAmount
                        ? `${spell.resourceCost.minAmount}-${spell.resourceCost.maxAmount} ${resourceInfo.resourceName}`
                        : `${spell.resourceCost.minAmount}+ ${resourceInfo.resourceName}`}
                  </Badge>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                <Button
                  variant={!canUse ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleUseAbility(spell.id)}
                  disabled={!canUse}
                  className="h-7 text-xs"
                  title={
                    !resourceInfo.canAfford ? `Need ${resourceInfo.resourceName}` : "Cast Spell"
                  }
                >
                  <SpellIcon className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">
                    {!resourceInfo.canAfford ? `Need ${resourceInfo.resourceName}` : "Cast"}
                  </span>
                </Button>
                {spell.resourceCost && spell.upcastBonus && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canUse}
                    title="Upcast spell for increased effect"
                    className="h-7 px-2"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAbility = (ability: AbilityDefinition) => {
    const actionAbility = ability as ActionAbilityDefinition;
    const maxUses = actionAbility.maxUses ? abilityService.calculateMaxUses(actionAbility) : 0;
    const currentUses = character._abilityUses.get(actionAbility.id) || 0;
    const remainingUses = maxUses - currentUses;
    const isUsed =
      actionAbility.frequency !== "at_will" && actionAbility.maxUses && currentUses >= maxUses;

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

    const hasRoll = !!actionAbility.diceFormula;
    const ActionIcon = hasRoll ? Zap : Sparkles;

    return (
      <Card key={ability.id} className={`mb-2 ${!canUse ? "opacity-50" : ""}`}>
        <CardContent className="p-2 sm:p-3">
          <div className="space-y-2">
            {/* Title with delete button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <ActionIcon className="w-3 h-3 text-yellow-500 shrink-0" />
                <h4 className="font-semibold text-sm">{ability.name}</h4>
              </div>
              {isManuallyAddedAbility(ability.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAbility(ability.id)}
                  className="text-red-500 hover:text-red-700 h-5 w-5 p-0 shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Description */}
            <MarkdownRenderer content={ability.description} className="text-sm" />

            {/* Dice formula if exists */}
            {actionAbility.diceFormula && (
              <div className="px-1.5 py-1 bg-muted/50 rounded text-xs font-mono text-center">
                {actionAbility.diceFormula}
              </div>
            )}

            {/* Variable resource cost selection */}
            {actionAbility.resourceCost &&
              actionAbility.resourceCost.type === "variable" &&
              canUse && (
                <div className="p-1.5 border rounded">
                  <Label className="text-xs font-medium">Spend Amount:</Label>
                  <div className="flex items-center gap-1.5 mt-1">
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
                              actionAbility.resourceCost.maxAmount ??
                                characterService.getResourceMaxValue(
                                  actionAbility.resourceCost.resourceId,
                                ),
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
                      className="w-16 h-7 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      {resourceInfo.resourceName} ({resourceInfo.resource?.current || 0})
                    </span>
                  </div>
                </div>
              )}

            {/* Effect preview */}
            {actionAbility.effects && actionAbility.effects.length > 0 && (
              <EffectPreview effects={actionAbility.effects} />
            )}

            {/* Pills and buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-wrap items-center">
                {getFrequencyBadge(actionAbility.frequency)}
                {actionAbility.frequency !== "at_will" && actionAbility.maxUses && character && (
                  <Badge variant="secondary" className="text-xs">
                    {remainingUses}/{maxUses}
                    {actionAbility.maxUses.type === "formula" && (
                      <span className="text-xs opacity-70 ml-1">
                        ({actionAbility.maxUses.expression})
                      </span>
                    )}
                  </Badge>
                )}
                {actionAbility.actionCost && actionAbility.actionCost > 0 && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    {actionAbility.actionCost} Action{actionAbility.actionCost > 1 ? "s" : ""}
                  </Badge>
                )}
                {actionAbility.resourceCost && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${resourceInfo.canAfford ? "text-blue-600" : "text-red-600"}`}
                  >
                    {actionAbility.resourceCost.type === "fixed"
                      ? `${actionAbility.resourceCost.amount} ${resourceInfo.resourceName}`
                      : actionAbility.resourceCost.maxAmount
                        ? `${actionAbility.resourceCost.minAmount}-${actionAbility.resourceCost.maxAmount} ${resourceInfo.resourceName}`
                        : `${actionAbility.resourceCost.minAmount}+ ${resourceInfo.resourceName}`}
                  </Badge>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
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
                  className="h-7 text-xs"
                  title={
                    isUsed
                      ? "Used"
                      : !resourceInfo.canAfford
                        ? `Need ${resourceInfo.resourceName}`
                        : hasRoll
                          ? "Roll"
                          : "Use Ability"
                  }
                >
                  <ActionIcon className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">
                    {isUsed
                      ? "Used"
                      : !resourceInfo.canAfford
                        ? `Need ${resourceInfo.resourceName}`
                        : hasRoll
                          ? "Roll"
                          : "Use"}
                  </span>
                </Button>
                {actionAbility.frequency === "manual" && actionAbility.maxUses && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshAbility(ability.id)}
                    title="Refresh ability uses"
                    className="h-7 px-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Abilities & Spells
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {actionAbilities.length + manualSpells.length}
                  </span>
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
              {/* Tab interface for abilities and spells */}
              {actionAbilities.length === 0 && manualSpells.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No abilities or spells yet. Add your first one below!
                </div>
              ) : (
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "abilities" | "spells")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="abilities">
                      Abilities ({actionAbilities.length})
                    </TabsTrigger>
                    <TabsTrigger value="spells">Spells ({manualSpells.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="abilities" className="space-y-2 mt-4">
                    {actionAbilities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No action abilities yet. Add your first ability below!
                      </div>
                    ) : (
                      actionAbilities.map(renderAbility)
                    )}
                  </TabsContent>

                  <TabsContent value="spells" className="space-y-2 mt-4">
                    {manualSpells.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No manually granted spells yet. Use the spell browser to add some!
                      </div>
                    ) : (
                      manualSpells.map(renderSpell)
                    )}
                  </TabsContent>
                </Tabs>
              )}

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
                              <SelectItem value="manual">Manual</SelectItem>
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
                                        value={newAbility.resourceCost.maxAmount || ""}
                                        onChange={(e) =>
                                          setNewAbility({
                                            ...newAbility,
                                            resourceCost: {
                                              ...newAbility.resourceCost!,
                                              maxAmount: e.target.value
                                                ? parseInt(e.target.value)
                                                : undefined,
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

                        {/* Dice Formula Configuration */}
                        <div className="space-y-2">
                          <Label htmlFor="ability-dice-formula">Dice Formula (Optional)</Label>
                          <Input
                            id="ability-dice-formula"
                            placeholder="e.g., 1d20+5, 2d6+STR, STRd6"
                            value={newAbility.diceFormula || ""}
                            onChange={(e) => {
                              const formula = e.target.value;
                              setNewAbility({
                                ...newAbility,
                                diceFormula: formula,
                              });

                              // Validate the formula if it's not empty
                              if (formula) {
                                const validation = validateDiceFormula(formula);
                                if (!validation.valid) {
                                  // You could set an error state here for display
                                  console.warn("Invalid dice formula:", validation.error);
                                }
                              }
                            }}
                          />
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Examples: {getExampleFormulas().slice(0, 3).join(", ")}</p>
                            <p>
                              Variables:{" "}
                              {getSupportedVariables()
                                .filter((v) => v.length <= 3)
                                .join(", ")}
                            </p>
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsAddingAbility(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Ability
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsSpellBrowserOpen(true)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Spells
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Spell Browser Dialog */}
      <SpellBrowser isOpen={isSpellBrowserOpen} onClose={() => setIsSpellBrowserOpen(false)} />
    </>
  );
}
