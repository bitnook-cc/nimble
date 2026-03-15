"use client";

import { DiceType } from "@nimble/dice";
import { Dices, Plus, Trash2 } from "lucide-react";

import { useState } from "react";

import { Character } from "@/lib/schemas/character";
import { DicePoolDefinition, DicePoolInstance, DicePoolResetType } from "@/lib/schemas/dice-pools";
import { AVAILABLE_ICONS, type IconCategory, getIconById } from "@/lib/utils/icon-utils";
import { RESOURCE_COLOR_SCHEMES, getColorSchemeById } from "@/lib/utils/resource-config";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

interface DicePoolConfigurationSectionProps {
  character: Character;
  updateCharacter: (character: Character) => Promise<void>;
}

export function DicePoolConfigurationSection({
  character,
  updateCharacter,
}: DicePoolConfigurationSectionProps) {
  const [newDicePool, setNewDicePool] = useState<Partial<DicePoolDefinition> | null>(null);
  const [isCreatingDicePool, setIsCreatingDicePool] = useState(false);
  const [editingDicePool, setEditingDicePool] = useState<string | null>(null);

  const dicePools = character._dicePools || [];

  const deleteDicePool = async (poolId: string) => {
    const updatedPools = dicePools.filter((p) => p.definition.id !== poolId);
    const updatedCharacter = {
      ...character,
      _dicePools: updatedPools,
    };
    await updateCharacter(updatedCharacter);
  };

  const startCreatingDicePool = () => {
    setNewDicePool({
      id: "",
      name: "",
      description: "",
      colorScheme: "blue-magic",
      icon: "dices",
      diceSize: 6 as DiceType,
      maxDice: { type: "fixed", value: 3 },
      resetCondition: "encounter_end",
      resetType: "to_zero",
    });
    setIsCreatingDicePool(true);
  };

  const cancelCreateDicePool = () => {
    setNewDicePool(null);
    setIsCreatingDicePool(false);
  };

  const updateDicePool = async (poolId: string, field: string, value: any) => {
    const updatedPools = dicePools.map((pool) => {
      if (pool.definition.id !== poolId) return pool;
      return {
        ...pool,
        definition: {
          ...pool.definition,
          [field]: value,
        },
      };
    });

    const updatedCharacter = {
      ...character,
      _dicePools: updatedPools,
    };
    await updateCharacter(updatedCharacter);
  };

  const saveNewDicePool = async () => {
    if (!newDicePool || !newDicePool.id || !newDicePool.name) {
      return; // Validation failed
    }

    const definition: DicePoolDefinition = {
      id: newDicePool.id,
      name: newDicePool.name,
      description: newDicePool.description,
      colorScheme: newDicePool.colorScheme || "blue-magic",
      icon: newDicePool.icon,
      diceSize: newDicePool.diceSize || 6,
      maxDice: newDicePool.maxDice || { type: "fixed", value: 3 },
      resetCondition: newDicePool.resetCondition || "encounter_end",
      resetType: newDicePool.resetType || "to_zero",
    };

    const newPoolInstance: DicePoolInstance = {
      definition,
      currentDice: [],
      sortOrder: dicePools.length,
    };

    const updatedCharacter = {
      ...character,
      _dicePools: [...dicePools, newPoolInstance],
    };
    await updateCharacter(updatedCharacter);

    setNewDicePool(null);
    setIsCreatingDicePool(false);
  };

  const updateNewDicePool = (field: keyof DicePoolDefinition, value: any) => {
    setNewDicePool((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Dices className="w-4 h-4" />
            Dice Pools
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={startCreatingDicePool}
            disabled={isCreatingDicePool}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Dice Pool
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Dice Pools */}
        {dicePools.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No dice pools configured. Add a dice pool to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {dicePools.map((pool) => {
              const isEditing = editingDicePool === pool.definition.id;
              const IconComponent = getIconById(pool.definition.icon || "dices");
              const colorScheme = getColorSchemeById(pool.definition.colorScheme);

              return (
                <div key={pool.definition.id} className="p-3 border rounded-lg">
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={pool.definition.name}
                            onChange={(e) =>
                              updateDicePool(pool.definition.id, "name", e.target.value)
                            }
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">ID (read-only)</Label>
                          <Input value={pool.definition.id} disabled className="text-sm bg-muted" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={pool.definition.description || ""}
                          onChange={(e) =>
                            updateDicePool(pool.definition.id, "description", e.target.value)
                          }
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Dice Size</Label>
                          <Select
                            value={pool.definition.diceSize.toString()}
                            onValueChange={(value) =>
                              updateDicePool(
                                pool.definition.id,
                                "diceSize",
                                parseInt(value) as DiceType,
                              )
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">d4</SelectItem>
                              <SelectItem value="6">d6</SelectItem>
                              <SelectItem value="8">d8</SelectItem>
                              <SelectItem value="10">d10</SelectItem>
                              <SelectItem value="12">d12</SelectItem>
                              <SelectItem value="20">d20</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Size</Label>
                          <Input
                            type="number"
                            value={
                              pool.definition.maxDice.type === "fixed"
                                ? pool.definition.maxDice.value
                                : 3
                            }
                            onChange={(e) =>
                              updateDicePool(pool.definition.id, "maxDice", {
                                type: "fixed",
                                value: parseInt(e.target.value) || 3,
                              })
                            }
                            className="text-sm"
                            min="1"
                            max="20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Color Scheme</Label>
                          <Select
                            value={pool.definition.colorScheme}
                            onValueChange={(value) =>
                              updateDicePool(pool.definition.id, "colorScheme", value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOURCE_COLOR_SCHEMES.map((scheme) => (
                                <SelectItem key={scheme.id} value={scheme.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded"
                                      style={{ backgroundColor: scheme.colors.full }}
                                    />
                                    {scheme.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Icon</Label>
                          <Select
                            value={pool.definition.icon || ""}
                            onValueChange={(value) =>
                              updateDicePool(pool.definition.id, "icon", value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(
                                AVAILABLE_ICONS.reduce(
                                  (acc, icon) => {
                                    if (!acc[icon.category]) acc[icon.category] = [];
                                    acc[icon.category].push(icon);
                                    return acc;
                                  },
                                  {} as Record<IconCategory, typeof AVAILABLE_ICONS>,
                                ),
                              ).map(([category, icons]) => (
                                <div key={category}>
                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground capitalize">
                                    {category}
                                  </div>
                                  {icons.map((icon) => {
                                    const IconComponent = icon.icon;
                                    return (
                                      <SelectItem key={icon.id} value={icon.id}>
                                        <div className="flex items-center gap-2">
                                          <IconComponent className="w-4 h-4" />
                                          {icon.name}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Reset Condition</Label>
                          <Select
                            value={pool.definition.resetCondition}
                            onValueChange={(value) =>
                              updateDicePool(pool.definition.id, "resetCondition", value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="safe_rest">Safe Rest</SelectItem>
                              <SelectItem value="encounter_end">Encounter End</SelectItem>
                              <SelectItem value="turn_end">Turn End</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Reset Type</Label>
                          <Select
                            value={pool.definition.resetType}
                            onValueChange={(value: DicePoolResetType) =>
                              updateDicePool(pool.definition.id, "resetType", value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="to_zero">Clear Pool</SelectItem>
                              <SelectItem value="to_max">Fill Pool</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => setEditingDicePool(null)}>
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            deleteDicePool(pool.definition.id);
                            setEditingDicePool(null);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setEditingDicePool(pool.definition.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: colorScheme?.colors.empty || "#e5e7eb",
                          }}
                        >
                          <IconComponent
                            className="w-4 h-4"
                            style={{ color: colorScheme?.colors.full || "#6b7280" }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{pool.definition.name}</p>
                          <p className="text-xs text-muted-foreground">
                            d{pool.definition.diceSize} • Max:{" "}
                            {pool.definition.maxDice.type === "fixed"
                              ? pool.definition.maxDice.value
                              : "formula"}{" "}
                            • {pool.definition.resetCondition.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Click to edit</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* New Dice Pool Form */}
        {isCreatingDicePool && newDicePool && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">New Dice Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ID</Label>
                  <Input
                    placeholder="fury_dice"
                    value={newDicePool.id || ""}
                    onChange={(e) => updateNewDicePool("id", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Fury Dice"
                    value={newDicePool.name || ""}
                    onChange={(e) => updateNewDicePool("name", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Pool of dice that can be spent for extra damage"
                  value={newDicePool.description || ""}
                  onChange={(e) => updateNewDicePool("description", e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Dice Size</Label>
                  <Select
                    value={(newDicePool.diceSize || 6).toString()}
                    onValueChange={(value) =>
                      updateNewDicePool("diceSize", parseInt(value) as DiceType)
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">d4</SelectItem>
                      <SelectItem value="6">d6</SelectItem>
                      <SelectItem value="8">d8</SelectItem>
                      <SelectItem value="10">d10</SelectItem>
                      <SelectItem value="12">d12</SelectItem>
                      <SelectItem value="20">d20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Size</Label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={newDicePool.maxDice?.type === "fixed" ? newDicePool.maxDice.value : ""}
                    onChange={(e) =>
                      updateNewDicePool("maxDice", {
                        type: "fixed",
                        value: parseInt(e.target.value) || 3,
                      })
                    }
                    className="text-sm"
                    min="1"
                    max="20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Color Scheme</Label>
                  <Select
                    value={newDicePool.colorScheme || "blue-magic"}
                    onValueChange={(value) => updateNewDicePool("colorScheme", value)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_COLOR_SCHEMES.map((scheme) => (
                        <SelectItem key={scheme.id} value={scheme.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: scheme.colors.full }}
                            />
                            {scheme.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Icon</Label>
                  <Select
                    value={newDicePool.icon || "dices"}
                    onValueChange={(value) => updateNewDicePool("icon", value)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(
                        AVAILABLE_ICONS.reduce(
                          (acc, icon) => {
                            if (!acc[icon.category]) acc[icon.category] = [];
                            acc[icon.category].push(icon);
                            return acc;
                          },
                          {} as Record<IconCategory, typeof AVAILABLE_ICONS>,
                        ),
                      ).map(([category, icons]) => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground capitalize">
                            {category}
                          </div>
                          {icons.map((icon) => {
                            const IconComponent = icon.icon;
                            return (
                              <SelectItem key={icon.id} value={icon.id}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="w-4 h-4" />
                                  {icon.name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Reset Condition</Label>
                  <Select
                    value={newDicePool.resetCondition || "encounter_end"}
                    onValueChange={(value) => updateNewDicePool("resetCondition", value)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe_rest">Safe Rest</SelectItem>
                      <SelectItem value="encounter_end">Encounter End</SelectItem>
                      <SelectItem value="turn_end">Turn End</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reset Type</Label>
                  <Select
                    value={newDicePool.resetType || "to_zero"}
                    onValueChange={(value: DicePoolResetType) =>
                      updateNewDicePool("resetType", value)
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to_zero">Clear Pool</SelectItem>
                      <SelectItem value="to_max">Fill Pool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={saveNewDicePool}
                  disabled={
                    !newDicePool.id ||
                    !newDicePool.name ||
                    dicePools.some((p) => p.definition.id === newDicePool.id)
                  }
                >
                  Save Dice Pool
                </Button>
                <Button size="sm" variant="outline" onClick={cancelCreateDicePool}>
                  Cancel
                </Button>
              </div>
              {(!newDicePool.id || !newDicePool.name) && (
                <p className="text-xs text-destructive">ID and Name are required</p>
              )}
              {newDicePool.id && dicePools.some((p) => p.definition.id === newDicePool.id) && (
                <p className="text-xs text-destructive">Dice Pool ID already exists</p>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
