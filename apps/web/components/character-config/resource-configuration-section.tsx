"use client";

import { Plus, Trash2 } from "lucide-react";

import { useState } from "react";

import { Character } from "@/lib/schemas/character";
import {
  ResourceDefinition,
  ResourceResetCondition,
  ResourceResetType,
  ResourceValue,
} from "@/lib/schemas/resources";
import { getCharacterService } from "@/lib/services/service-factory";
import { calculateFlexibleValue as getFlexibleValue } from "@/lib/types/flexible-value";
import {
  AVAILABLE_ICONS,
  type IconCategory,
  getDefaultColorSchemeForIcon,
  getIconById,
} from "@/lib/utils/icon-utils";
import { RESOURCE_COLOR_SCHEMES, getColorSchemeById } from "@/lib/utils/resource-config";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

interface ResourceConfigurationSectionProps {
  character: Character;
  updateCharacter: (character: Character) => Promise<void>;
}

export function ResourceConfigurationSection({
  character,
  updateCharacter,
}: ResourceConfigurationSectionProps) {
  const [newResource, setNewResource] = useState<Partial<ResourceDefinition> | null>(null);
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);

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
      resetValue: { type: "fixed", value: 10 },
      minValue: { type: "fixed", value: 0 },
      maxValue: { type: "fixed", value: 10 },
    });
    setIsCreatingResource(true);
  };

  const cancelCreateResource = () => {
    setNewResource(null);
    setIsCreatingResource(false);
  };

  const updateResource = async (resourceId: string, field: string, value: any) => {
    const updatedResources = resources.map((resource) => {
      if (resource.definition.id !== resourceId) return resource;
      return {
        ...resource,
        definition: {
          ...resource.definition,
          [field]: value,
        },
      };
    });

    const updatedDefinitions = updatedResources.map((r) => r.definition);
    const updatedCharacter = {
      ...character,
      _resourceDefinitions: updatedDefinitions,
    };
    await updateCharacter(updatedCharacter);
  };

  const saveNewResource = async () => {
    if (!newResource || !newResource.id || !newResource.name) {
      return; // Validation failed
    }

    const definition: ResourceDefinition = {
      id: newResource.id,
      name: newResource.name,
      description: newResource.description,
      colorScheme: newResource.colorScheme || "blue-magic",
      icon: newResource.icon,
      resetCondition: newResource.resetCondition || "safe_rest",
      resetType: newResource.resetType || "to_max",
      resetValue: newResource.resetValue || { type: "fixed", value: 10 },
      minValue: newResource.minValue || { type: "fixed", value: 0 },
      maxValue: newResource.maxValue || { type: "fixed", value: 10 },
    };

    const updatedCharacter = {
      ...character,
      _resourceDefinitions: [...character._resourceDefinitions, definition],
      _resourceValues: new Map([
        ...Array.from(character._resourceValues.entries()),
        [
          definition.id,
          {
            type: "numerical" as const,
            value: getFlexibleValue(definition.maxValue),
          } as ResourceValue,
        ],
      ]),
    };
    await updateCharacter(updatedCharacter);

    setNewResource(null);
    setIsCreatingResource(false);
  };

  const updateNewResource = (field: keyof ResourceDefinition, value: any) => {
    setNewResource((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
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
              const IconComponent = getIconById(resource.definition.icon || "sparkles");
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
                            updateResource(resource.definition.id, "description", e.target.value)
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
                            onChange={async (e) => {
                              const value = parseInt(e.target.value) || 0;
                              const updatedValues = new Map(character._resourceValues);
                              updatedValues.set(resource.definition.id, {
                                type: "numerical",
                                value,
                              });
                              await updateCharacter({
                                ...character,
                                _resourceValues: updatedValues,
                              });
                            }}
                            className="text-sm"
                          />
                        </div>
                        {resource.definition.resetType === "to_default" && (
                          <div className="space-y-1">
                            <Label className="text-xs">Default</Label>
                            <Input
                              type="number"
                              value={
                                resource.definition.resetValue?.type === "fixed"
                                  ? resource.definition.resetValue.value
                                  : 10
                              }
                              onChange={(e) =>
                                updateResource(resource.definition.id, "resetValue", {
                                  type: "fixed",
                                  value: parseInt(e.target.value) || 10,
                                })
                              }
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => setEditingResource(null)}>
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            deleteResource(resource.definition.id);
                            setEditingResource(null);
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
                      onClick={() => setEditingResource(resource.definition.id)}
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
                          <p className="font-medium text-sm">{resource.definition.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.current}/{getFlexibleValue(resource.definition.maxValue)} •{" "}
                            {resource.definition.resetCondition.replace("_", " ")}
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

        {/* New Resource Form */}
        {isCreatingResource && newResource && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">New Resource</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ID</Label>
                  <Input
                    placeholder="mana"
                    value={newResource.id || ""}
                    onChange={(e) => updateNewResource("id", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Mana"
                    value={newResource.name || ""}
                    onChange={(e) => updateNewResource("name", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Magical energy used to cast spells"
                  value={newResource.description || ""}
                  onChange={(e) => updateNewResource("description", e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Color Scheme</Label>
                  <Select
                    value={newResource.colorScheme || "blue-magic"}
                    onValueChange={(value) => {
                      updateNewResource("colorScheme", value);
                      const defaultIcon = getDefaultColorSchemeForIcon(value);
                      if (defaultIcon) {
                        updateNewResource("icon", defaultIcon);
                      }
                    }}
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
                    value={newResource.icon || "sparkles"}
                    onValueChange={(value) => updateNewResource("icon", value)}
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
                  <Label className="text-xs">Reset Type</Label>
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
                  <Label className="text-xs">Min Value</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newResource.minValue?.type === "fixed" ? newResource.minValue.value : ""}
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
                  <Label className="text-xs">Max Value</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={newResource.maxValue?.type === "fixed" ? newResource.maxValue.value : ""}
                    onChange={(e) =>
                      updateNewResource("maxValue", {
                        type: "fixed",
                        value: parseInt(e.target.value) || 10,
                      })
                    }
                    className="text-sm"
                  />
                </div>
                {newResource.resetType === "to_default" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Default</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={
                        newResource.resetValue?.type === "fixed" ? newResource.resetValue.value : ""
                      }
                      onChange={(e) =>
                        updateNewResource("resetValue", {
                          type: "fixed",
                          value: parseInt(e.target.value) || 10,
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                )}
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
  );
}
