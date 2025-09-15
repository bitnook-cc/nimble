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

const STANDARD_ARRAYS = {
  standard: { name: "Standard", values: [2, 2, 0, -1] },
  balanced: { name: "Balanced", values: [2, 1, 1, 0] },
  minMax: { name: "Min-Max", values: [3, 1, -1, -1] },
} as const;

const ATTRIBUTE_NAMES: AttributeName[] = ["strength", "dexterity", "intelligence", "will"];
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
  ancestryId,
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

    // If no class selected or no key attributes, use default distribution
    if (!keyAttributes.length) {
      onAttributesChange({
        strength: sortedArray[0],
        dexterity: sortedArray[1],
        intelligence: sortedArray[2],
        will: sortedArray[3],
      });
      return;
    }

    // Intelligent distribution based on key attributes
    const newAttributes = { ...attributes };
    const availableValues = [...sortedArray];
    const nonKeyAttributes = ATTRIBUTE_NAMES.filter((attr) => !keyAttributes.includes(attr));

    // Assign highest values to key attributes
    if (keyAttributes.length === 1) {
      // One key attribute gets the highest value
      newAttributes[keyAttributes[0]] = availableValues.shift()!;

      // Distribute remaining values to non-key attributes (highest to lowest)
      nonKeyAttributes.forEach((attr, index) => {
        newAttributes[attr] = availableValues[index];
      });
    } else if (keyAttributes.length === 2) {
      // Two key attributes: randomly assign the two highest values
      const highestTwo = availableValues.splice(0, 2);
      const randomIndex = Math.random() < 0.5 ? 0 : 1;
      newAttributes[keyAttributes[0]] = highestTwo[randomIndex];
      newAttributes[keyAttributes[1]] = highestTwo[1 - randomIndex];

      // Randomly distribute remaining values to non-key attributes
      const shuffledNonKey = [...nonKeyAttributes].sort(() => Math.random() - 0.5);
      shuffledNonKey.forEach((attr, index) => {
        newAttributes[attr] = availableValues[index];
      });
    } else {
      // 3+ key attributes: distribute highest values evenly
      keyAttributes.forEach((attr, index) => {
        if (index < availableValues.length) {
          newAttributes[attr] = availableValues.shift()!;
        }
      });

      // Assign remaining values to non-key attributes
      nonKeyAttributes.forEach((attr) => {
        if (availableValues.length > 0) {
          newAttributes[attr] = availableValues.shift()!;
        }
      });
    }

    onAttributesChange(newAttributes);
  };

  const resetAttributes = () => {
    onAttributesChange({
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      will: 0,
    });
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
            Distribute your attribute scores using a standard array or manual assignment
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
          <div className="flex gap-4">
            <Select
              value={selectedArray}
              onValueChange={(value: keyof typeof STANDARD_ARRAYS) => setSelectedArray(value)}
            >
              <SelectTrigger className="flex-1">
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
              disabled={false}
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
              <div key={attr} className="flex items-center gap-4">
                <div className="flex items-center w-32 justify-between">
                  <label
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
                    disabled={attributes[attr] <= gameConfig.character.attributeRange.min}
                  >
                    -
                  </Button>
                  <Input
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
