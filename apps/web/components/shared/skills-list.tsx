"use client";

import React from "react";
import { Dice6, Minus, Plus, Star } from "lucide-react";

import { gameConfig } from "@/lib/config/game-config";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { SkillName } from "@/lib/schemas/character";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface SkillsListProps {
  skillAllocations: Record<string, number>;
  attributeValues: Record<string, number>;
  onSkillChange: (skillName: string, newValue: number) => void;
  availablePoints?: number;
  readOnly?: boolean;
  rollMode?: boolean;
}

export function SkillsList({
  skillAllocations,
  attributeValues,
  onSkillChange,
  availablePoints,
  readOnly = false,
  rollMode = false,
}: SkillsListProps) {
  const maxPerSkill = gameConfig.character.skillModifierRange.max;
  const { rollSkill } = useDiceActions();
  const { uiState } = useUIStateService();
  const { getSkills } = useCharacterService();

  const getAttributeModifier = (attributeName: string) => {
    return attributeValues[attributeName] || 0;
  };

  const getTotalSkillModifier = (skillName: string, attributeName: string) => {
    const attributeModifier = getAttributeModifier(attributeName);
    const skillPoints = skillAllocations[skillName] || 0;
    return attributeModifier + skillPoints;
  };

  const canIncreaseSkill = (skillName: string) => {
    if (readOnly) return false;
    const currentPoints = skillAllocations[skillName] || 0;
    const hasAvailablePoints = availablePoints === undefined || availablePoints > 0;
    return hasAvailablePoints && currentPoints < maxPerSkill;
  };

  const canDecreaseSkill = (skillName: string) => {
    if (readOnly) return false;
    const currentPoints = skillAllocations[skillName] || 0;
    return currentPoints > 0;
  };

  const handleSkillChange = (skillName: string, change: number) => {
    const currentPoints = skillAllocations[skillName] || 0;
    const newPoints = Math.max(0, Math.min(maxPerSkill, currentPoints + change));

    if (change > 0 && !canIncreaseSkill(skillName)) return;
    if (change < 0 && !canDecreaseSkill(skillName)) return;

    onSkillChange(skillName, newPoints);
  };

  const formatModifier = (value: number) => {
    return value >= 0 ? `+${value}` : `${value}`;
  };

  const handleSkillRoll = async (skillName: string, attributeName: string) => {
    const attributeModifier = getAttributeModifier(attributeName);
    
    // Get the computed skill modifier (includes trait bonuses)
    const computedSkills = getSkills();
    const computedSkill = computedSkills[skillName];
    const totalSkillModifier = computedSkill ? computedSkill.modifier : (skillAllocations[skillName] || 0);
    
    const skillAdvantage = 0; // Individual skills don't have advantage, only global
    const totalAdvantageLevel = uiState.advantageLevel + skillAdvantage;
    
    await rollSkill(skillName as SkillName, attributeModifier, totalSkillModifier, totalAdvantageLevel);
  };

  const renderStars = (skillPoints: number, isTraitBonus = false) => {
    if (skillPoints === 0) {
      return <div className="w-2.5 h-2.5" />;
    }

    const fullStars = Math.floor(skillPoints / 5);
    const remainingStars = skillPoints % 5;
    const elements = [];
    const colorClass = isTraitBonus ? "fill-blue-400 text-blue-400" : "fill-yellow-400 text-yellow-400";
    const opacityClass = isTraitBonus ? "opacity-70" : "";

    // Add big stars for every 5 points
    for (let i = 0; i < fullStars; i++) {
      elements.push(
        <Star key={`full-${i}`} className={`w-3.5 h-3.5 ${colorClass} ${opacityClass}`} />
      );
    }

    // Add small stars for remaining points
    for (let i = 0; i < remainingStars; i++) {
      elements.push(
        <Star key={`partial-${i}`} className={`w-2.5 h-2.5 ${colorClass} ${opacityClass}`} />
      );
    }

    return <div className="flex items-center gap-0.5">{elements}</div>;
  };

  return (
    <TooltipProvider>
      <div className="@container">
      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-2">
        {gameConfig.skills.map((skill) => {
          const attributeModifier = getAttributeModifier(skill.attribute);
          const userAllocatedPoints = skillAllocations[skill.name] || 0;
          
          // Get computed skill with trait bonuses
          const computedSkills = getSkills();
          const computedSkill = computedSkills[skill.name];
          const totalSkillModifier = computedSkill ? computedSkill.modifier : userAllocatedPoints;
          const traitBonusPoints = totalSkillModifier - userAllocatedPoints;
          
          const totalModifier = attributeModifier + totalSkillModifier;

          return (
            <Card key={skill.name} className="h-fit">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{skill.label}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {formatModifier(attributeModifier)}{" "}
                      {skill.attribute.slice(0, 3).toUpperCase()} + {userAllocatedPoints}
                      {traitBonusPoints > 0 && (
                        <span className="text-blue-600"> + {traitBonusPoints} (traits)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {/* Star icons for skill points */}
                    <div className="flex items-center gap-0.5 mr-1">
                      {renderStars(userAllocatedPoints)}
                      {traitBonusPoints > 0 && (
                        <div className="ml-1">
                          {renderStars(traitBonusPoints, true)}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSkillChange(skill.name, -1)}
                      disabled={!canDecreaseSkill(skill.name)}
                      className="w-6 h-6 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Badge variant="outline" className="text-sm font-mono min-w-8 justify-center">
                      {formatModifier(totalModifier)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSkillChange(skill.name, 1)}
                      disabled={!canIncreaseSkill(skill.name)}
                      className="w-6 h-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    {rollMode && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSkillRoll(skill.name, skill.attribute)}
                            className="w-6 h-6 p-0 ml-1"
                          >
                            <Dice6 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Roll {skill.label}: d20{formatModifier(totalModifier)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>
    </TooltipProvider>
  );
}
