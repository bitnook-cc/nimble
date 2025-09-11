import { useCharacterService } from "@/lib/hooks/use-character-service";

import { CharacterNameSection } from "./sections/character-name-section";

interface CharacterHeaderProps {
  onNameChange: (name: string) => void;
  onOpenConfig: () => void;
}

export function CharacterHeader({ onNameChange, onOpenConfig }: CharacterHeaderProps) {
  // Get character from service hook
  const { character } = useCharacterService();

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;
  return (
    <>
      {/* Character Name and Summary */}
      <CharacterNameSection
        name={character.name}
        onNameChange={onNameChange}
        onOpenConfig={onOpenConfig}
      />
    </>
  );
}
