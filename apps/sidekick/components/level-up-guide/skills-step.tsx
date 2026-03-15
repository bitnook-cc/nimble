"use client";

import { RotateCcw } from "lucide-react";

import React, { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SkillsList } from "@/components/shared/skills-list";

import { gameConfig } from "@/lib/config/game-config";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { Character } from "@/lib/schemas/character";

interface SkillsStepProps {
  character: Character;
  levelsToGain: number;
  skillAllocations: Record<string, number>;
  onSkillAllocationsChange: (allocations: Record<string, number>) => void;
}

export function SkillsStep({
  character,
  levelsToGain,
  skillAllocations: _skillAllocations,
  onSkillAllocationsChange,
}: SkillsStepProps) {
  const [newAllocations, setNewAllocations] = useState<Record<string, number>>({});

  const { getSkillBonuses } = useCharacterService();

  // Initialize with current character skill modifiers
  useEffect(() => {
    const currentAllocations: Record<string, number> = {};
    gameConfig.skills.forEach((skill) => {
      currentAllocations[skill.name] = getCurrentSkillValue(skill.name);
    });
    setNewAllocations(currentAllocations);
  }, [character]);

  // Calculate total skill points for new level
  const totalSkillPointsForNewLevel =
    character.config.skillPoints.startingPoints +
    (character.level + levelsToGain - 1) * character.config.skillPoints.pointsPerLevel;

  const getTotalAllocatedPoints = () => {
    return Object.values(newAllocations).reduce((sum, points) => sum + points, 0);
  };

  const getAvailablePoints = () => {
    return totalSkillPointsForNewLevel - getTotalAllocatedPoints();
  };

  const isOverAllocated = () => {
    return getTotalAllocatedPoints() > totalSkillPointsForNewLevel;
  };

  const getCurrentSkillValue = (skillName: string) => {
    const skill = character._skills[skillName as keyof typeof character._skills];
    return skill?.modifier || 0;
  };

  const getAttributeValues = () => {
    return {
      strength: character._attributes.strength || 0,
      dexterity: character._attributes.dexterity || 0,
      intelligence: character._attributes.intelligence || 0,
      will: character._attributes.will || 0,
    };
  };

  // Get current allocations (newAllocations now contains the total values)
  const getCombinedAllocations = () => {
    return newAllocations;
  };

  const handleSkillChange = (skillName: string, newTotalValue: number) => {
    // Make sure we don't exceed max skill value
    if (newTotalValue > gameConfig.character.skillModifierRange.max) return;

    const updated = { ...newAllocations, [skillName]: newTotalValue };
    setNewAllocations(updated);

    // Calculate the changes to pass to parent (how many new points each skill got)
    const changes: Record<string, number> = {};
    gameConfig.skills.forEach((skill) => {
      const currentValue = getCurrentSkillValue(skill.name);
      const newValue = updated[skill.name] || 0;
      changes[skill.name] = newValue - currentValue;
    });
    onSkillAllocationsChange(changes);
  };

  const resetAllocations = () => {
    const reset: Record<string, number> = {};
    const resetChanges: Record<string, number> = {};
    gameConfig.skills.forEach((skill) => {
      const currentValue = getCurrentSkillValue(skill.name);
      reset[skill.name] = currentValue;
      resetChanges[skill.name] = 0; // No changes from current
    });
    setNewAllocations(reset);
    onSkillAllocationsChange(resetChanges);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Allocate Skill Points</h3>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Allocate your character's skill points for level {character.level + levelsToGain}
          </p>
          <p className="text-xs text-muted-foreground">
            Total available: {totalSkillPointsForNewLevel} skill points (
            {character.config.skillPoints.startingPoints} starting +{" "}
            {(character.level + levelsToGain - 1) * character.config.skillPoints.pointsPerLevel}{" "}
            from levels)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">Available Points:</CardTitle>
              <Badge variant={isOverAllocated() ? "destructive" : "default"}>
                {getAvailablePoints()} remaining
              </Badge>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Attribute + Points = Total
              </div>
            </div>
            <Button
              onClick={resetAllocations}
              variant="outline"
              size="sm"
              disabled={
                !gameConfig.skills.some((skill) => {
                  const currentValue = getCurrentSkillValue(skill.name);
                  const newValue = newAllocations[skill.name] || 0;
                  return newValue !== currentValue;
                })
              }
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SkillsList
            skillAllocations={getCombinedAllocations()}
            attributeValues={getAttributeValues()}
            onSkillChange={handleSkillChange}
            availablePoints={getAvailablePoints()}
            skillBonuses={getSkillBonuses()}
          />
        </CardContent>
      </Card>

      {/* Show which skills are getting changes */}
      {(() => {
        const hasChanges = gameConfig.skills.some((skill) => {
          const currentValue = getCurrentSkillValue(skill.name);
          const newValue = newAllocations[skill.name] || 0;
          return newValue !== currentValue;
        });

        return (
          hasChanges && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Skill Point Changes:</p>
                <div className="space-y-1">
                  {gameConfig.skills.map((skill) => {
                    const currentValue = getCurrentSkillValue(skill.name);
                    const newValue = newAllocations[skill.name] || 0;
                    const change = newValue - currentValue;

                    if (change !== 0) {
                      return (
                        <div key={skill.name} className="text-sm text-muted-foreground">
                          • {skill.label}: {change > 0 ? "+" : ""}
                          {change} points
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </Card>
          )
        );
      })()}
    </div>
  );
}
