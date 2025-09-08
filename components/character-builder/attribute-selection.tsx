"use client";

import { RotateCcw } from "lucide-react";

import { useState } from "react";

import { AttributeName } from "@/lib/schemas/character";

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

    onAttributesChange({
      strength: sortedArray[0],
      dexterity: sortedArray[1],
      intelligence: sortedArray[2],
      will: sortedArray[3],
    });
  };

  const resetAttributes = () => {
    onAttributesChange({
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      will: 0,
    });
  };

  const canApplyArray = () => {
    const array = STANDARD_ARRAYS[selectedArray].values;
    const sortedArray = [...array].sort((a, b) => b - a);
    const sortedCurrent = [...assignedValues].sort((a, b) => b - a);

    return JSON.stringify(sortedArray) !== JSON.stringify(sortedCurrent);
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
            <Button onClick={assignArray} disabled={!canApplyArray()}>
              Apply Array
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attribute Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ATTRIBUTE_NAMES.map((attr) => (
            <div key={attr} className="flex items-center gap-4">
              <label className="w-24 text-sm font-medium">{ATTRIBUTE_LABELS[attr]}</label>
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
                  className="w-20 text-center"
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
