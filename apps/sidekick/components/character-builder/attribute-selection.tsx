"use client";

import { RotateCcw, Sparkles } from "lucide-react";

import { useState } from "react";

import { AttributeName } from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";

import { gameConfig } from "../../lib/config/game-config";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export const STANDARD_ARRAYS = {
  standard: { name: "Standard", values: [2, 2, 0, -1] },
  balanced: { name: "Balanced", values: [2, 1, 1, 0] },
  minMax: { name: "Min-Max", values: [3, 1, -1, -1] },
} as const;

const ATTRIBUTE_NAMES: AttributeName[] = ["strength", "dexterity", "intelligence", "will"];
export function startingAttributes(keys: readonly AttributeName[]) {
  const order = [...new Set([...keys, ...ATTRIBUTE_NAMES])];
  const result = { strength: 0, dexterity: 0, intelligence: 0, will: 0 };
  order.forEach((attr, index) => {
    result[attr] = STANDARD_ARRAYS.standard.values[index];
  });
  return result;
}

const ATTRIBUTE_LABELS = {
  strength: "Strength",
  dexterity: "Dexterity",
  intelligence: "Intelligence",
  will: "Will",
} as const;

interface AttributeSelectionProps {
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    will: number;
  };
  onAttributesChange: (attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    will: number;
  }) => void;
  classId?: string;
  ancestryId?: string;
}

export function AttributeSelection({
  attributes,
  onAttributesChange,
  classId,
  ancestryId: _ancestryId,
}: AttributeSelectionProps) {
  const [selectedArray, setSelectedArray] = useState<keyof typeof STANDARD_ARRAYS>("standard");
  const contentRepository = ContentRepositoryService.getInstance();

  // Get key attributes for the selected class
  const keyAttributes = classId
    ? contentRepository.getClassDefinition(classId)?.keyAttributes || []
    : [];

  const assignedValues = [
    attributes.strength,
    attributes.dexterity,
    attributes.intelligence,
    attributes.will,
  ];

  const onAttributeChange = (attribute: AttributeName, value: number) => {
    onAttributesChange({
      ...attributes,
      [attribute]: value,
    });
  };

  const assignArray = () => {
    const array = STANDARD_ARRAYS[selectedArray].values;
    const sortedArray = [...array].sort((a, b) => b - a);

    const key = ATTRIBUTE_NAMES.filter((attr) => keyAttributes.includes(attr));
    const other = ATTRIBUTE_NAMES.filter((attr) => !keyAttributes.includes(attr));
    // Swap within each group so the highest scores stay on class attributes.
    const shuffle = (group: AttributeName[]) => {
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
      return group;
    };
    const order = [...shuffle(key), ...shuffle(other)];
    const newAttributes = { ...attributes };
    order.forEach((attr, index) => {
      newAttributes[attr] = sortedArray[index];
    });
    onAttributesChange(newAttributes);
  };

  const resetAttributes = () => {
    setSelectedArray("standard");
    onAttributesChange(startingAttributes(keyAttributes));
  };

  const isArrayApplied = () => {
    const array = STANDARD_ARRAYS[selectedArray].values;
    const sortedArray = [...array].sort((a, b) => b - a);
    const sortedCurrent = [...assignedValues].sort((a, b) => b - a);

    return JSON.stringify(sortedArray) === JSON.stringify(sortedCurrent);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Assign Attributes</h3>
          <p className="text-sm text-muted-foreground">
            Your class starts with a recommended array. Choose another or adjust individual scores.
          </p>
        </div>
        <Button onClick={resetAttributes} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Standard Arrays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedArray}
              onValueChange={(value: keyof typeof STANDARD_ARRAYS) => setSelectedArray(value)}
            >
              <SelectTrigger aria-label="Attribute array" className="w-full sm:flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STANDARD_ARRAYS).map(([key, array]) => (
                  <SelectItem key={key} value={key}>
                    {array.name} ({array.values.join(", ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={assignArray}
              title={
                isArrayApplied() && keyAttributes.length > 0
                  ? "Reshuffle array values (click again for different distribution)"
                  : keyAttributes.length > 0
                    ? "Intelligently distribute array values based on class key attributes"
                    : "Apply selected array values to attributes"
              }
            >
              {keyAttributes.length > 0 && <Sparkles className="w-4 h-4 mr-2" />}
              {isArrayApplied() ? "Reshuffle" : "Apply Array"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Attribute Scores
            {keyAttributes.length > 0 && classId && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Key attributes highlighted)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ATTRIBUTE_NAMES.map((attr) => {
            const isKeyAttribute = keyAttributes.includes(attr);
            return (
              <div key={attr} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex basis-full sm:basis-auto items-center gap-2">
                  <label
                    htmlFor={`builder-${attr}`}
                    className="text-sm font-medium"
                    title={isKeyAttribute ? "Key attribute for this class" : undefined}
                  >
                    {ATTRIBUTE_LABELS[attr]}
                  </label>
                  {isKeyAttribute && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      KEY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onAttributeChange(
                        attr,
                        Math.max(gameConfig.character.attributeRange.min, attributes[attr] - 1),
                      )
                    }
                    aria-label={`Decrease ${attr}`}
                    className="size-11 sm:size-8 p-0"
                    disabled={attributes[attr] <= gameConfig.character.attributeRange.min}
                  >
                    -
                  </Button>
                  <Input
                    id={`builder-${attr}`}
                    type="number"
                    value={attributes[attr]}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (
                        value >= gameConfig.character.attributeRange.min &&
                        value <= gameConfig.character.attributeRange.max
                      ) {
                        onAttributeChange(attr, value);
                      }
                    }}
                    className={`w-20 text-center ${
                      isKeyAttribute ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                    min={gameConfig.character.attributeRange.min}
                    max={gameConfig.character.attributeRange.max}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onAttributeChange(
                        attr,
                        Math.min(gameConfig.character.attributeRange.max, attributes[attr] + 1),
                      )
                    }
                    aria-label={`Increase ${attr}`}
                    className="size-11 sm:size-8 p-0"
                    disabled={attributes[attr] >= gameConfig.character.attributeRange.max}
                  >
                    +
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  (Range: {gameConfig.character.attributeRange.min} to{" "}
                  {gameConfig.character.attributeRange.max})
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
