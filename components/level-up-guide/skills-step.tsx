'use client';

import React, { useState, useEffect } from 'react';
import { Character } from '@/lib/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { gameConfig } from '@/lib/config/game-config';
import { SkillsList } from '@/components/shared/skills-list';

interface SkillsStepProps {
  character: Character;
  levelsToGain: number;
  skillAllocations: Record<string, number>;
  onSkillAllocationsChange: (allocations: Record<string, number>) => void;
}

export function SkillsStep({ 
  character, 
  levelsToGain,
  skillAllocations,
  onSkillAllocationsChange 
}: SkillsStepProps) {
  const [newAllocations, setNewAllocations] = useState<Record<string, number>>({});
  
  // Initialize with zeros for new allocations
  useEffect(() => {
    const initialAllocations: Record<string, number> = {};
    gameConfig.skills.forEach(skill => {
      initialAllocations[skill.name] = 0;
    });
    setNewAllocations(initialAllocations);
  }, []);

  const skillPointsToAllocate = levelsToGain; // 1 skill point per level
  
  const getTotalAllocatedPoints = () => {
    return Object.values(newAllocations).reduce((sum, points) => sum + points, 0);
  };

  const getRemainingPoints = () => {
    return skillPointsToAllocate - getTotalAllocatedPoints();
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

  // Create combined allocations for display (current + new)
  const getCombinedAllocations = () => {
    const combined: Record<string, number> = {};
    gameConfig.skills.forEach(skill => {
      const current = getCurrentSkillValue(skill.name);
      const newPoints = newAllocations[skill.name] || 0;
      combined[skill.name] = current + newPoints;
    });
    return combined;
  };

  const handleSkillChange = (skillName: string, newTotalValue: number) => {
    const currentValue = getCurrentSkillValue(skillName);
    const newPointsToAdd = newTotalValue - currentValue;
    
    // Make sure we don't exceed max skill value
    if (newTotalValue > gameConfig.character.skillModifierRange.max) return;
    
    // Calculate if we have enough points
    const currentNewPoints = newAllocations[skillName] || 0;
    const pointDiff = newPointsToAdd - currentNewPoints;
    
    if (pointDiff > 0 && getRemainingPoints() < pointDiff) return;
    
    const updated = { ...newAllocations, [skillName]: newPointsToAdd };
    setNewAllocations(updated);
    onSkillAllocationsChange(updated);
  };

  const resetAllocations = () => {
    const reset: Record<string, number> = {};
    gameConfig.skills.forEach(skill => {
      reset[skill.name] = 0;
    });
    setNewAllocations(reset);
    onSkillAllocationsChange(reset);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Allocate Skill Points</h3>
        <p className="text-sm text-muted-foreground">
          You gain 1 skill point per level ({levelsToGain} {levelsToGain === 1 ? 'point' : 'points'} total)
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">
                Points Available: 
              </CardTitle>
              <Badge variant={getRemainingPoints() === 0 ? "default" : "secondary"}>
                {getRemainingPoints()} / {skillPointsToAllocate}
              </Badge>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Attribute + Points = Total
              </div>
            </div>
            <Button
              onClick={resetAllocations}
              variant="outline"
              size="sm"
              disabled={getTotalAllocatedPoints() === 0}
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
            availablePoints={getRemainingPoints()}
            maxPerSkill={gameConfig.character.skillModifierRange.max}
          />
        </CardContent>
      </Card>

      {/* Show which skills are getting new points */}
      {getTotalAllocatedPoints() > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">New Skill Points:</p>
            <div className="space-y-1">
              {gameConfig.skills.map(skill => {
                const newPoints = newAllocations[skill.name];
                if (newPoints > 0) {
                  return (
                    <div key={skill.name} className="text-sm text-muted-foreground">
                      • {skill.label}: +{newPoints} {newPoints === 1 ? 'point' : 'points'}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}