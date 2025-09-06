"use client";

import { useCallback } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { SkillName } from "@/lib/types/character";

import { SkillsList } from "../shared/skills-list";

export function SkillsTab() {
  const { character, updateCharacter, getSkills, getAttributes } = useCharacterService();

  const onSkillChange = useCallback(
    async (skillName: string, newValue: number) => {
      if (!character) return;

      const currentValue = character._skills[skillName as SkillName].modifier;

      if (newValue !== currentValue) {
        const updated = {
          ...character,
          _skills: {
            ...character._skills,
            [skillName]: {
              ...character._skills[skillName as SkillName],
              modifier: newValue,
            },
          },
        };
        await updateCharacter(updated);
      }
    },
    [character, updateCharacter],
  );

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;

  // Get computed attributes for the skills list
  const computedAttributes = getAttributes();

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
        <h2 className="text-xl font-semibold mb-4">Skills</h2>
        <SkillsList
          skillAllocations={skillAllocations}
          attributeValues={attributeValues}
          onSkillChange={onSkillChange}
          readOnly={false}
        />
      </div>
    </div>
  );
}
