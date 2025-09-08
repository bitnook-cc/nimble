"use client";

import { ChevronDown, ChevronRight, Minus, Plus, Sparkles } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useResourceService } from "@/lib/hooks/use-resource-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { resourceService } from "@/lib/services/resource-service";
import { getResourceColor } from "@/lib/utils/resource-config";
import { getIconById } from "@/lib/utils/icon-utils";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function ResourceSection() {
  // Direct singleton access with automatic re-rendering - no context needed!
  const { character } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const { activeResources, spendResource, restoreResource, getResourceInstance } =
    useResourceService();

  const [spendAmounts, setSpendAmounts] = useState<Record<string, string>>({});
  const [restoreAmounts, setRestoreAmounts] = useState<Record<string, string>>({});

  // Early return if no character or no resources
  if (!character || activeResources.length === 0) return null;

  const isOpen = uiState.collapsibleSections.resources;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("resources", isOpen);

  const applySpend = async (resourceId: string, amount: number, resetInput: boolean = false) => {
    await spendResource(resourceId, amount);

    if (resetInput) {
      setSpendAmounts((prev) => ({ ...prev, [resourceId]: "1" }));
    }
  };

  const applyRestore = async (resourceId: string, amount: number, resetInput: boolean = false) => {
    await restoreResource(resourceId, amount);

    if (resetInput) {
      setRestoreAmounts((prev) => ({ ...prev, [resourceId]: "1" }));
    }
  };

  const handleSpend = (resourceId: string) => {
    const amount = parseInt(spendAmounts[resourceId] || "1") || 1;
    applySpend(resourceId, amount, true);
  };

  const handleRestore = (resourceId: string) => {
    const amount = parseInt(restoreAmounts[resourceId] || "1") || 1;
    applyRestore(resourceId, amount, true);
  };

  const getResourceBarColor = (
    resourceInstance: import("@/lib/schemas/resources").ResourceInstance,
    current: number,
    max: number,
  ) => {
    if (resourceInstance.definition.colorScheme) {
      const percentage = (current / max) * 100;
      const color = getResourceColor(resourceInstance.definition.colorScheme, percentage);
      return { backgroundColor: color };
    }

    // Fallback based on percentage
    const percentage = (current / max) * 100;
    if (percentage <= 25) return { backgroundColor: "#dc2626" }; // red-600
    if (percentage <= 50) return { backgroundColor: "#eab308" }; // yellow-500
    return { backgroundColor: "#3b82f6" }; // blue-500
  };

  const getResourceIcon = (resourceInstance: import("@/lib/schemas/resources").ResourceInstance) => {
    if (resourceInstance.definition.icon) {
      return getIconById(resourceInstance.definition.icon);
    }
    return Sparkles; // Default icon
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Resources
          </h2>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4">
          {activeResources.map((resource) => {
            const ResourceIcon = getResourceIcon(resource);
            const calculatedMaxValue = resourceService.calculateMaxValue(
              resource.definition,
              character,
            );
            const resourceBarColor = getResourceBarColor(
              resource,
              resource.current,
              calculatedMaxValue,
            );
            const resourcePercentage = (resource.current / calculatedMaxValue) * 100;
            const resourceName = resource.definition.name;
            const spendAmount = spendAmounts[resource.definition.id] || "1";
            const restoreAmount = restoreAmounts[resource.definition.id] || "1";

            return (
              <Card key={resource.definition.id} className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <ResourceIcon className="w-5 h-5" />
                    {resourceName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Resource Display and Bar */}
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold">
                      {resource.current} / {calculatedMaxValue}
                      {resource.definition.maxValue.type === "formula" && (
                        <span className="text-xs opacity-70 ml-2">
                          ({resource.definition.maxValue.expression})
                        </span>
                      )}
                      {resource.current === 0 && (
                        <span className="text-lg text-red-600 ml-2 font-semibold">(Depleted)</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${resourcePercentage}%`,
                          ...(typeof resourceBarColor === "object" ? resourceBarColor : {}),
                        }}
                      />
                    </div>
                    {resource.definition?.description && (
                      <div className="text-sm text-muted-foreground">
                        {resource.definition.description}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-destructive">
                        Spend {resourceName}
                      </Label>
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => applySpend(resource.definition.id, 1)}
                          disabled={resource.current <= 0}
                        >
                          -1
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => applySpend(resource.definition.id, 3)}
                          disabled={resource.current <= 0}
                        >
                          -3
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => applySpend(resource.definition.id, 5)}
                          disabled={resource.current <= 0}
                        >
                          -5
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-green-600">Restore</Label>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyRestore(resource.definition.id, 1)}
                          disabled={resource.current >= calculatedMaxValue}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          +1
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyRestore(resource.definition.id, 3)}
                          disabled={resource.current >= calculatedMaxValue}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          +3
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyRestore(resource.definition.id, 5)}
                          disabled={resource.current >= calculatedMaxValue}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          +5
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Amount Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`spend-${resource.definition.id}`} className="text-sm">
                        Custom Spend
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`spend-${resource.definition.id}`}
                          type="number"
                          min="1"
                          value={spendAmount}
                          onChange={(e) =>
                            setSpendAmounts((prev) => ({
                              ...prev,
                              [resource.definition.id]: e.target.value,
                            }))
                          }
                          className="flex-1"
                          placeholder="Amount"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleSpend(resource.definition.id)}
                          disabled={resource.current <= 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`restore-${resource.definition.id}`} className="text-sm">
                        Custom Restore
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`restore-${resource.definition.id}`}
                          type="number"
                          min="1"
                          value={restoreAmount}
                          onChange={(e) =>
                            setRestoreAmounts((prev) => ({
                              ...prev,
                              [resource.definition.id]: e.target.value,
                            }))
                          }
                          className="flex-1"
                          placeholder="Amount"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(resource.definition.id)}
                          disabled={resource.current >= calculatedMaxValue}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
