interface StatBlockProps {
  character: {
    level: number
    hitPoints: string
    hitDice: string
    armorClass: string
    initiative: string
    speed: string
  }
}

export function StatBlock({ character }: StatBlockProps) {
  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 my-4">
      <h4 className="text-lg font-bold text-amber-900 mb-3">Character Stats</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><strong>Level:</strong> {character.level}</div>
        <div><strong>Hit Points:</strong> {character.hitPoints}</div>
        <div><strong>Hit Dice:</strong> {character.hitDice}</div>
        <div><strong>Armor Class:</strong> {character.armorClass}</div>
        <div><strong>Initiative:</strong> {character.initiative}</div>
        <div><strong>Speed:</strong> {character.speed}</div>
      </div>
    </div>
  )
}