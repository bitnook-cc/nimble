"use client";

import { Plus, Trash2 } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { Character, CharacterConfiguration } from "@/lib/types/character";
import { calculateFlexibleValue as getFlexibleValue } from "@/lib/types/flexible-value";
import {
  ResourceDefinition,
  ResourceInstance,
  ResourceResetCondition,
  ResourceResetType,
  createResourceInstance,
  NumericalResourceValue,
} from "@/lib/types/resources";
import {
  RESOURCE_COLOR_SCHEMES,
  RESOURCE_ICONS,
  getColorSchemeById,
  getDefaultColorSchemeForIcon,
  getIconById,
} from "@/lib/utils/resource-config";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

interface CharacterConfigDialogProps {
  onClose: () => void;
}

export function CharacterConfigDialog({ onClose }: CharacterConfigDialogProps) {
  const { character, updateCharacter } = useCharacterService();

  const [newResource, setNewResource] = useState<Partial<ResourceDefinition> | null>(null);
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);

  // Don't render if character is null
  if (!character) {
    return null;
  }

  const handleClose = () => {
    // Clean up any temporary state
    setNewResource(null);
    setIsCreatingResource(false);
    setEditingResource(null);
    onClose();
  };

  const updateMaxWounds = async (value: string) => {
    const numValue = parseInt(value) || 1;
    const maxWounds = Math.max(1, numValue);

    const updatedCharacter = {
      ...character,
      wounds: {
        ...character.wounds,
        max: maxWounds,
        current: Math.min(character.wounds.current, maxWounds),
      },
    };
    await updateCharacter(updatedCharacter);
  };

  const updateMaxHP = async (value: string) => {
    const numValue = parseInt(value) || 1;
    const maxHP = Math.max(1, numValue);

    const updatedCharacter = {
      ...character,
      hitPoints: {
        ...character.hitPoints,
        max: maxHP,
        current: Math.min(character.hitPoints.current, maxHP),
      },
    };
    await updateCharacter(updatedCharacter);
  };

  const updateMaxInventorySize = async (value: string) => {
    const numValue = parseInt(value) || 1;
    const maxInventorySize = Math.max(1, numValue);

    const updatedCharacter = {
      ...character,
      config: {
        ...character.config,
        maxInventorySize,
      },
    };
    await updateCharacter(updatedCharacter);
  };

  const updateInitiativeModifier = async (value: string) => {
    const numValue = parseInt(value) || 0;
    const modifier = Math.max(-10, Math.min(10, numValue));

    const updatedCharacter = {
      ...character,
      initiative: {
        ...character._initiative,
        modifier,
      },
    };
    await updateCharacter(updatedCharacter);
  };

  // Resource Management Functions
  const characterService = getCharacterService();
  const resources = character ? characterService.getResources() : [];
  
  const deleteResource = async (resourceId: string) => {
    const updatedDefinitions = character._resourceDefinitions.filter((r) => r.id !== resourceId);
    const updatedValues = new Map(character._resourceValues);
    updatedValues.delete(resourceId);
    
    const updatedCharacter = {
      ...character,
      _resourceDefinitions: updatedDefinitions,
      _resourceValues: updatedValues,
    };
    await updateCharacter(updatedCharacter);
  };

  const startCreatingResource = () => {
    setNewResource({
      id: "",
      name: "",
      description: "",
      colorScheme: "blue-magic",
      icon: "sparkles",
      resetCondition: "safe_rest",
      resetType: "to_max",
      minValue: { type: "fixed", value: 0 },
      maxValue: { type: "fixed", value: 10 },
    });
    setIsCreatingResource(true);
  };

  const startEditingResource = (resourceId: string) => {
    setEditingResource(resourceId);
  };

  const stopEditingResource = () => {
    setEditingResource(null);
  };

  const updateResource = async (resourceId: string, field: string, value: any) => {
    const updatedResources = resources.map((resource) => {
      if (resource.definition.id !== resourceId) return resource;

      if (field === "current" || field === "sortOrder") {
        return { ...resource, [field]: value };
      } else {
        return {
          ...resource,
          definition: { ...resource.definition, [field]: value },
        };
      }
    });

    const updatedCharacter = {
      ...character,
      resources: updatedResources,
    };
    await updateCharacter(updatedCharacter);
  };

  const cancelCreateResource = () => {
    setNewResource(null);
    setIsCreatingResource(false);
  };

  const saveNewResource = async () => {
    if (!newResource || !newResource.id || !newResource.name) {
      return; // Validation failed
    }

    // Check for duplicate IDs
    if (character._resourceDefinitions.some((r) => r.id === newResource.id)) {
      return; // ID already exists
    }

    const definition: ResourceDefinition = {
      id: newResource.id,
      name: newResource.name,
      description: newResource.description || "",
      colorScheme: newResource.colorScheme || "blue-magic",
      icon: newResource.icon,
      resetCondition: newResource.resetCondition || "safe_rest",
      resetType: newResource.resetType || "to_max",
      resetValue: newResource.resetValue,
      minValue: newResource.minValue || { type: "fixed", value: 0 },
      maxValue: newResource.maxValue || { type: "fixed", value: 10 },
    };

    const resourceInstance = createResourceInstance(
      definition,
      getFlexibleValue(definition.maxValue, character),
      character._resourceDefinitions.length + 1,
    );

    const updatedCharacter = {
      ...character,
      _resourceDefinitions: [...character._resourceDefinitions, definition],
      _resourceValues: new Map([...character._resourceValues, [definition.id, { type: "numerical" as const, value: getFlexibleValue(definition.maxValue, character) } as NumericalResourceValue]]),
    };
    await updateCharacter(updatedCharacter);

    setNewResource(null);
    setIsCreatingResource(false);
  };

  const updateNewResource = (field: keyof ResourceDefinition, value: any) => {
    setNewResource((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Character Configuration</DialogTitle>
          <DialogDescription>Configure advanced settings for {character.name}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Wounds Configuration */}
          <div className="space-y-2">
            <Label htmlFor="max-wounds" className="text-sm font-medium">
              Maximum Wounds
            </Label>
            <div className="space-y-1">
              <Input
                id="max-wounds"
                type="number"
                min="1"
                max="20"
                value={character.wounds.max}
                onChange={(e) => updateMaxWounds(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Number of wounds the character can sustain before death.
              </p>
            </div>
          </div>

          {/* Max HP Configuration */}
          <div className="space-y-2">
            <Label htmlFor="max-hp" className="text-sm font-medium">
              Maximum Hit Points
            </Label>
            <div className="space-y-1">
              <Input
                id="max-hp"
                type="number"
                min="1"
                max="1000"
                value={character.hitPoints.max}
                onChange={(e) => updateMaxHP(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Base maximum hit points for the character.
              </p>
            </div>
          </div>

          {/* Initiative Modifier Configuration */}
          <div className="space-y-2">
            <Label htmlFor="initiative-modifier" className="text-sm font-medium">
              Initiative Modifier
            </Label>
            <div className="space-y-1">
              <Input
                id="initiative-modifier"
                type="number"
                min="-10"
                max="10"
                value={character._initiative.modifier}
                onChange={(e) => updateInitiativeModifier(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Additional modifier for initiative rolls (added to Dexterity). Current total:{" "}
                {character._attributes.dexterity + character._initiative.modifier >= 0 ? "+" : ""}
                {character._attributes.dexterity + character._initiative.modifier}.
              </p>
            </div>
          </div>

          {/* Max Inventory Size Configuration */}
          <div className="space-y-2">
            <Label htmlFor="max-inventory" className="text-sm font-medium">
              Base Inventory Size
            </Label>
            <div className="space-y-1">
              <Input
                id="max-inventory"
                type="number"
                min="1"
                max="100"
                value={character.config.maxInventorySize}
                onChange={(e) => updateMaxInventorySize(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Base inventory slots (before strength bonus). Final size ={" "}
                {character.config.maxInventorySize} + {character._attributes.strength} (strength) ={" "}
                {character.config.maxInventorySize + character._attributes.strength}.
              </p>
            </div>
          </div>

          {/* Resource Management */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Resources</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startCreatingResource}
                  disabled={isCreatingResource}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Resources */}
              {resources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No resources configured. Add a resource to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {resources.map((resource) => {
                    const isEditing = editingResource === resource.definition.id;
                    const iconOption = getIconById(resource.definition.icon || "");
                    const colorScheme = getColorSchemeById(resource.definition.colorScheme);

                    return (
                      <div key={resource.definition.id} className="p-3 border rounded-lg">
                        {isEditing ? (
                          // Edit mode
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Name</Label>
                                <Input
                                  value={resource.definition.name}
                                  onChange={(e) =>
                                    updateResource(resource.definition.id, "name", e.target.value)
                                  }
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">ID (read-only)</Label>
                                <Input
                                  value={resource.definition.id}
                                  disabled
                                  className="text-sm bg-muted"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Description</Label>
                              <Textarea
                                value={resource.definition.description || ""}
                                onChange={(e) =>
                                  updateResource(
                                    resource.definition.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Color Scheme</Label>
                                <Select
                                  value={resource.definition.colorScheme}
                                  onValueChange={(value) =>
                                    updateResource(resource.definition.id, "colorScheme", value)
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
                                  value={resource.definition.icon || ""}
                                  onValueChange={(value) =>
                                    updateResource(resource.definition.id, "icon", value)
                                  }
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(
                                      RESOURCE_ICONS.reduce(
                                        (acc, icon) => {
                                          if (!acc[icon.category]) acc[icon.category] = [];
                                          acc[icon.category].push(icon);
                                          return acc;
                                        },
                                        {} as Record<string, typeof RESOURCE_ICONS>,
                                      ),
                                    ).map(([category, icons]) => (
                                      <div key={category}>
                                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground capitalize">
                                          {category}
                                        </div>
                                        {icons.map((icon) => (
                                          <SelectItem key={icon.id} value={icon.id}>
                                            <div className="flex items-center gap-2">
                                              <span>{icon.icon}</span>
                                              {icon.name}
                                            </div>
                                          </SelectItem>
                                        ))}
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
                                  value={resource.definition.resetCondition}
                                  onValueChange={(value: ResourceResetCondition) =>
                                    updateResource(resource.definition.id, "resetCondition", value)
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
                                  value={resource.definition.resetType}
                                  onValueChange={(value: ResourceResetType) =>
                                    updateResource(resource.definition.id, "resetType", value)
                                  }
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="to_max">To Maximum</SelectItem>
                                    <SelectItem value="to_zero">To Zero</SelectItem>
                                    <SelectItem value="to_default">To Default</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Min</Label>
                                <Input
                                  type="number"
                                  value={
                                    resource.definition.minValue.type === "fixed"
                                      ? resource.definition.minValue.value
                                      : 0
                                  }
                                  onChange={(e) =>
                                    updateResource(resource.definition.id, "minValue", {
                                      type: "fixed",
                                      value: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Max</Label>
                                <Input
                                  type="number"
                                  value={
                                    resource.definition.maxValue.type === "fixed"
                                      ? resource.definition.maxValue.value
                                      : 10
                                  }
                                  onChange={(e) =>
                                    updateResource(resource.definition.id, "maxValue", {
                                      type: "fixed",
                                      value: parseInt(e.target.value) || 10,
                                    })
                                  }
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Current</Label>
                                <Input
                                  type="number"
                                  value={resource.current}
                                  onChange={(e) =>
                                    updateResource(
                                      resource.definition.id,
                                      "current",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Default</Label>
                                <Input
                                  type="number"
                                  value={
                                    resource.definition.resetValue?.type === "fixed"
                                      ? resource.definition.resetValue.value
                                      : ""
                                  }
                                  onChange={(e) =>
                                    updateResource(
                                      resource.definition.id,
                                      "resetValue",
                                      e.target.value
                                        ? { type: "fixed", value: parseInt(e.target.value) }
                                        : undefined,
                                    )
                                  }
                                  className="text-sm"
                                  disabled={resource.definition.resetType !== "to_default"}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button size="sm" onClick={stopEditingResource}>
                                Done Editing
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteResource(resource.definition.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{iconOption?.icon || "💎"}</span>
                                <span className="font-medium">{resource.definition.name}</span>
                                <div
                                  className="text-xs px-2 py-1 rounded text-white"
                                  style={{ backgroundColor: colorScheme?.colors.full || "#6b7280" }}
                                >
                                  {colorScheme?.name || "Default"}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {resource.definition.id} | {resource.current}/
                                {getFlexibleValue(resource.definition.maxValue, character)} | Reset:{" "}
                                {resource.definition.resetCondition} →{" "}
                                {resource.definition.resetType}
                              </div>
                              {resource.definition.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {resource.definition.description}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingResource(resource.definition.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteResource(resource.definition.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New Resource Form */}
              {isCreatingResource && newResource && (
                <Card className="border-2 border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Create New Resource</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="resource-id" className="text-xs">
                          ID*
                        </Label>
                        <Input
                          id="resource-id"
                          placeholder="mana"
                          value={newResource.id || ""}
                          onChange={(e) => updateNewResource("id", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="resource-name" className="text-xs">
                          Name*
                        </Label>
                        <Input
                          id="resource-name"
                          placeholder="Mana"
                          value={newResource.name || ""}
                          onChange={(e) => updateNewResource("name", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="resource-description" className="text-xs">
                        Description
                      </Label>
                      <Textarea
                        id="resource-description"
                        placeholder="Optional description..."
                        value={newResource.description || ""}
                        onChange={(e) => updateNewResource("description", e.target.value)}
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="resource-color-scheme" className="text-xs">
                          Color Scheme
                        </Label>
                        <Select
                          value={newResource.colorScheme || "blue-magic"}
                          onValueChange={(value) => updateNewResource("colorScheme", value)}
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
                        <Label htmlFor="resource-icon" className="text-xs">
                          Icon
                        </Label>
                        <Select
                          value={newResource.icon || "sparkles"}
                          onValueChange={(value) => {
                            updateNewResource("icon", value);
                            // Auto-suggest color scheme based on icon category
                            if (
                              !newResource.colorScheme ||
                              newResource.colorScheme === "blue-magic"
                            ) {
                              const suggestedScheme = getDefaultColorSchemeForIcon(value);
                              updateNewResource("colorScheme", suggestedScheme);
                            }
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(
                              RESOURCE_ICONS.reduce(
                                (acc, icon) => {
                                  if (!acc[icon.category]) acc[icon.category] = [];
                                  acc[icon.category].push(icon);
                                  return acc;
                                },
                                {} as Record<string, typeof RESOURCE_ICONS>,
                              ),
                            ).map(([category, icons]) => (
                              <div key={category}>
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground capitalize">
                                  {category}
                                </div>
                                {icons.map((icon) => (
                                  <SelectItem key={icon.id} value={icon.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{icon.icon}</span>
                                      {icon.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="resource-reset-condition" className="text-xs">
                          Reset Condition
                        </Label>
                        <Select
                          value={newResource.resetCondition || "safe_rest"}
                          onValueChange={(value: ResourceResetCondition) =>
                            updateNewResource("resetCondition", value)
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
                        <Label htmlFor="resource-reset-type" className="text-xs">
                          Reset Type
                        </Label>
                        <Select
                          value={newResource.resetType || "to_max"}
                          onValueChange={(value: ResourceResetType) =>
                            updateNewResource("resetType", value)
                          }
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="to_max">To Maximum</SelectItem>
                            <SelectItem value="to_zero">To Zero</SelectItem>
                            <SelectItem value="to_default">To Default</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="resource-min" className="text-xs">
                          Min
                        </Label>
                        <Input
                          id="resource-min"
                          type="number"
                          value={
                            newResource.minValue?.type === "fixed" ? newResource.minValue.value : 0
                          }
                          onChange={(e) =>
                            updateNewResource("minValue", {
                              type: "fixed",
                              value: parseInt(e.target.value) || 0,
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="resource-max" className="text-xs">
                          Max
                        </Label>
                        <Input
                          id="resource-max"
                          type="number"
                          value={
                            newResource.maxValue?.type === "fixed" ? newResource.maxValue.value : 10
                          }
                          onChange={(e) =>
                            updateNewResource("maxValue", {
                              type: "fixed",
                              value: parseInt(e.target.value) || 10,
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="resource-default" className="text-xs">
                          Default
                        </Label>
                        <Input
                          id="resource-default"
                          type="number"
                          value={
                            newResource.resetValue?.type === "fixed"
                              ? newResource.resetValue.value
                              : ""
                          }
                          onChange={(e) =>
                            updateNewResource(
                              "resetValue",
                              e.target.value
                                ? { type: "fixed", value: parseInt(e.target.value) }
                                : undefined,
                            )
                          }
                          className="text-sm"
                          disabled={newResource.resetType !== "to_default"}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={saveNewResource}
                        disabled={
                          !newResource.id ||
                          !newResource.name ||
                          character._resourceDefinitions.some((r) => r.id === newResource.id)
                        }
                      >
                        Save Resource
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelCreateResource}>
                        Cancel
                      </Button>
                    </div>
                    {(!newResource.id || !newResource.name) && (
                      <p className="text-xs text-destructive">ID and Name are required</p>
                    )}
                    {newResource.id &&
                      character._resourceDefinitions.some((r) => r.id === newResource.id) && (
                        <p className="text-xs text-destructive">Resource ID already exists</p>
                      )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
