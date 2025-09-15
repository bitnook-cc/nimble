"use client";

import { Minus, Plus, Star } from "lucide-react";

import { gameConfig } from "@/lib/config/game-config";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface SkillsListProps {
  skillAllocations: Record<string, number>;
  attributeValues: Record<string, number>;
  onSkillChange: (skillName: string, newValue: number) => void;
  availablePoints?: number;
  readOnly?: boolean;
}

export function SkillsList({
  skillAllocations,
  attributeValues,
  onSkillChange,
  availablePoints,
  readOnly = false,
}: SkillsListProps) {
  const maxPerSkill = gameConfig.character.skillModifierRange.max;

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

  return (
    <div className="@container">
      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-2">
        {gameConfig.skills.map((skill) => {
          const attributeModifier = getAttributeModifier(skill.attribute);
          const skillPoints = skillAllocations[skill.name] || 0;
          const totalModifier = getTotalSkillModifier(skill.name, skill.attribute);

          return (
            <Card key={skill.name} className="h-fit">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{skill.label}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {formatModifier(attributeModifier)}{" "}
                      {skill.attribute.slice(0, 3).toUpperCase()} + {skillPoints}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {/* Star icons for skill points */}
                    <div className="flex items-center gap-0.5 mr-1">
                      {Array.from({ length: skillPoints }, (_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      ))}
                      {skillPoints === 0 && <div className="w-2.5 h-2.5" />}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
