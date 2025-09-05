"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { RotateCcw } from "lucide-react";
import { gameConfig } from "@/lib/config/game-config";
import { SkillsList } from "../shared/skills-list";

interface SkillsSelectionProps {
  skillAllocations: Record<string, number>;
  onSkillsChange: (skillAllocations: Record<string, number>) => void;
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    will: number;
  };
}

export function SkillsSelection({ 
  skillAllocations, 
  onSkillsChange,
  attributes 
}: SkillsSelectionProps) {
  const [localAllocations, setLocalAllocations] = useState<Record<string, number>>({});
  
  const maxSkillPoints = gameConfig.character.initialSkillPoints;
  
  // Initialize skill allocations
  useEffect(() => {
    // Initialize with existing allocations or zeros
    const initialAllocations: Record<string, number> = {};
    gameConfig.skills.forEach(skill => {
      initialAllocations[skill.name] = skillAllocations[skill.name] || 0;
    });
    setLocalAllocations(initialAllocations);
  }, [skillAllocations]);

  const getTotalAllocatedPoints = () => {
    return Object.values(localAllocations).reduce((sum, points) => sum + points, 0);
  };

  const getRemainingPoints = () => {
    return maxSkillPoints - getTotalAllocatedPoints();
  };

  const handleSkillChange = (skillName: string, newValue: number) => {
    const newAllocations = {
      ...localAllocations,
      [skillName]: newValue
    };
    setLocalAllocations(newAllocations);
    onSkillsChange(newAllocations);
  };

  const handleResetSkills = () => {
    const resetAllocations: Record<string, number> = {};
    gameConfig.skills.forEach(skill => {
      resetAllocations[skill.name] = 0;
    });
    setLocalAllocations(resetAllocations);
    onSkillsChange(resetAllocations);
  };

  const handleQuickDistribute = () => {
    const resetAllocations: Record<string, number> = {};
    const pointsPerSkill = Math.floor(maxSkillPoints / gameConfig.skills.length);
    const remainder = maxSkillPoints % gameConfig.skills.length;
    
    gameConfig.skills.forEach((skill, index) => {
      resetAllocations[skill.name] = pointsPerSkill + (index < remainder ? 1 : 0);
    });
    
    setLocalAllocations(resetAllocations);
    onSkillsChange(resetAllocations);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Allocate Skill Points</h3>
          <p className="text-sm text-muted-foreground">
            Distribute {maxSkillPoints} points among your skills (optional)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleQuickDistribute} 
            variant="outline" 
            size="sm"
          >
            Distribute Evenly
          </Button>
          <Button 
            onClick={handleResetSkills} 
            variant="outline" 
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant={getRemainingPoints() === 0 ? "default" : "secondary"}>
              {getRemainingPoints()} points remaining
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getTotalAllocatedPoints()} / {maxSkillPoints} allocated
            </span>
          </div>

          <SkillsList
            skillAllocations={localAllocations}
            attributeValues={attributes}
            onSkillChange={handleSkillChange}
            availablePoints={getRemainingPoints()}
            readOnly={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}