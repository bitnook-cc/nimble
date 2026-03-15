"use client";

import { Minus, Plus } from "lucide-react";

import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Character } from "@/lib/schemas/character";

interface LevelSelectionStepProps {
  character: Character;
  levelsToGain: number;
  onLevelsChange: (levels: number) => void;
}

export function LevelSelectionStep({
  character,
  levelsToGain,
  onLevelsChange,
}: LevelSelectionStepProps) {
  const maxLevel = 20; // Standard D&D max level
  const availableLevels = maxLevel - character.level;

  const handleIncrement = () => {
    if (levelsToGain < availableLevels) {
      onLevelsChange(levelsToGain + 1);
    }
  };

  const handleDecrement = () => {
    if (levelsToGain > 1) {
      onLevelsChange(levelsToGain - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Level Up Your Character</h3>
        <p className="text-sm text-muted-foreground">
          {character.name} is currently level {character.level}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="levels">How many levels would you like to gain?</Label>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleDecrement}
                  disabled={levelsToGain <= 1}
                  className="h-10 w-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="levels"
                  type="number"
                  min={1}
                  max={availableLevels}
                  value={levelsToGain}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onLevelsChange(Math.min(Math.max(1, value), availableLevels));
                  }}
                  className="w-20 text-center text-lg font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleIncrement}
                  disabled={levelsToGain >= availableLevels}
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground ml-2">(Max: {availableLevels})</span>
              </div>
            </div>

            {/* Level Progression Indicator */}
            <div className="flex items-center justify-center py-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                Level {character.level} → Level {character.level + levelsToGain}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">What you&apos;ll gain:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  • {levelsToGain} additional hit {levelsToGain === 1 ? "die" : "dice"} to roll for
                  HP
                </p>
                <p>
                  • {levelsToGain} skill {levelsToGain === 1 ? "point" : "points"} to allocate
                </p>
                <p>• Increased maximum hit points</p>
                <p>• Possible new class features</p>
                <p>• Possible ability score improvements</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
