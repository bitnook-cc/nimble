"use client";

import { useCallback } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { SkillName } from "@/lib/schemas/character";
import { getSkillPointInfo } from "@/lib/utils/skill-points";

import { SkillsList } from "../shared/skills-list";

export function SkillsTab() {
  const { character, updateCharacterFields, getAttributes, getSkillBonuses } =
    useCharacterService();

  const onSkillChange = useCallback(
    async (skillName: string, newValue: number) => {
      if (!character) return;

      const currentValue = character._skills[skillName as SkillName].modifier;

      if (newValue !== currentValue) {
        const updated = {
          _skills: {
            ...character._skills,
            [skillName]: {
              ...character._skills[skillName as SkillName],
              modifier: newValue,
            },
          },
        };
        await updateCharacterFields(updated);
      }
    },
    [character, updateCharacterFields],
  );

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;

  // Get computed attributes for the skills list
  const computedAttributes = getAttributes();

  // Get skill bonuses (includes trait bonuses)
  const skillBonuses = getSkillBonuses();

  // Get skill point info
  const skillPointInfo = getSkillPointInfo(character);

  // Convert character skills to the format expected by SkillsList
  const skillAllocations: Record<string, number> = {};
  Object.keys(character._skills).forEach((skillName) => {
    skillAllocations[skillName] = character._skills[skillName as SkillName].modifier;
  });

  // Convert Attributes to Record<string, number>
  const attributeValues: Record<string, number> = {
    strength: computedAttributes.strength,
    dexterity: computedAttributes.dexterity,
    intelligence: computedAttributes.intelligence,
    will: computedAttributes.will,
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Explore</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Skill Points:</span>
            <span
              className={`text-sm font-medium ${
                skillPointInfo.isOverAllocated ? "text-red-500" : "text-foreground"
              }`}
            >
              {skillPointInfo.totalAllocated}/{skillPointInfo.totalAvailable}
            </span>
          </div>
        </div>
        <SkillsList
          skillAllocations={skillAllocations}
          attributeValues={attributeValues}
          onSkillChange={onSkillChange}
          readOnly={false}
          rollMode={true}
          skillBonuses={skillBonuses}
        />
      </div>
    </div>
  );
}
