interface MonsterStatProps {
  stats: {
    armorClass: number
    hitPoints: number
    speed: string
    strength: number
    dexterity: number
    intelligence: number
    will: number
    skills?: string
    damageResistances?: string
    damageVulnerabilities?: string
    senses: string
    languages: string
    challengeRating: string
  }
}

export function MonsterStat({ stats }: MonsterStatProps) {
  const getModifier = (score: number) => {
    return Math.floor((score - 10) / 2)
  }

  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 my-4 font-mono text-sm">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div><strong>Armor Class:</strong> {stats.armorClass}</div>
        <div><strong>Hit Points:</strong> {stats.hitPoints}</div>
        <div><strong>Speed:</strong> {stats.speed}</div>
        <div><strong>Challenge Rating:</strong> {stats.challengeRating}</div>
      </div>

      <div className="mb-4">
        <strong>Attributes:</strong>
        <div className="grid grid-cols-4 gap-2 mt-1">
          <div className="text-center">
            <div className="font-bold">STR</div>
            <div>{stats.strength} ({formatModifier(getModifier(stats.strength))})</div>
          </div>
          <div className="text-center">
            <div className="font-bold">DEX</div>
            <div>{stats.dexterity} ({formatModifier(getModifier(stats.dexterity))})</div>
          </div>
          <div className="text-center">
            <div className="font-bold">INT</div>
            <div>{stats.intelligence} ({formatModifier(getModifier(stats.intelligence))})</div>
          </div>
          <div className="text-center">
            <div className="font-bold">WIL</div>
            <div>{stats.will} ({formatModifier(getModifier(stats.will))})</div>
          </div>
        </div>
      </div>

      {stats.skills && (
        <div className="mb-2"><strong>Skills:</strong> {stats.skills}</div>
      )}
      {stats.damageResistances && (
        <div className="mb-2"><strong>Damage Resistances:</strong> {stats.damageResistances}</div>
      )}
      {stats.damageVulnerabilities && (
        <div className="mb-2"><strong>Damage Vulnerabilities:</strong> {stats.damageVulnerabilities}</div>
      )}
      <div className="mb-2"><strong>Senses:</strong> {stats.senses}</div>
      <div><strong>Languages:</strong> {stats.languages}</div>
    </div>
  )
}