export type AbilityCategory = "offensive" | "defensive" | "neutral";

export interface MonsterAbilityTemplate {
  id: string;
  name: string;
  description: string;
  category: AbilityCategory;
}

export const MONSTER_ABILITIES: MonsterAbilityTemplate[] = [
  // Offensive (22)
  {
    id: "aggressive",
    name: "Aggressive",
    description: "+X speed if moving toward enemies.",
    category: "offensive",
  },
  {
    id: "blinding-spit",
    name: "Blinding Spit",
    description:
      "Spits a blinding substance at a target within range. The target must make a save or be blinded for 1 round.",
    category: "offensive",
  },
  {
    id: "bloodthirsty",
    name: "Bloodthirsty",
    description: "Has advantage on attacks against Bloodied targets.",
    category: "offensive",
  },
  {
    id: "brute",
    name: "Brute",
    description:
      "Attacks also knockback a number of spaces equal to the primary die rolled.",
    category: "offensive",
  },
  {
    id: "brawler",
    name: "Brawler",
    description: "Extra damage, can only attack in melee.",
    category: "offensive",
  },
  {
    id: "burning-aura",
    name: "Burning Aura",
    description:
      "Creatures that start their turn adjacent to this monster take 1d6 fire damage.",
    category: "offensive",
  },
  {
    id: "doom",
    name: "Doom",
    description: "Attacks also Wound the target.",
    category: "offensive",
  },
  {
    id: "daze-attack",
    name: "Disgusting/Venomous/Heavy Blows",
    description: "Attacks also Daze the target.",
    category: "offensive",
  },
  {
    id: "explosive-death",
    name: "Explosive Death",
    description:
      "Explode on death, dealing 2d6 damage to creatures within reach.",
    category: "offensive",
  },
  {
    id: "fearsome",
    name: "Fearsome",
    description:
      "Frighten enemies within range on a failed WIL save. 1/encounter.",
    category: "offensive",
  },
  {
    id: "frenzied",
    name: "Frenzied",
    description:
      "Deals extra damage or has faster speed while damaged.",
    category: "offensive",
  },
  {
    id: "grappler",
    name: "Grappler",
    description: "On hit: Grapples.",
    category: "offensive",
  },
  {
    id: "gravity-manipulator",
    name: "Gravity Manipulator",
    description: "Can pull or push enemies within reach.",
    category: "offensive",
  },
  {
    id: "hypnotic-gaze",
    name: "Hypnotic Gaze",
    description:
      "Forces enemies to make a WIL save or be confused for 1 round.",
    category: "offensive",
  },
  {
    id: "mounted",
    name: "Mounted",
    description:
      "Faster movement and deals extra damage after moving toward an enemy.",
    category: "offensive",
  },
  {
    id: "obstinate",
    name: "Obstinate",
    description:
      "When attacking a target with disadvantage, treat the roll as if it had advantage instead.",
    category: "offensive",
  },
  {
    id: "pack-tactics",
    name: "Pack Tactics",
    description:
      "Advantage on attacks when an ally is adjacent to the target.",
    category: "offensive",
  },
  {
    id: "ranged",
    name: "Ranged",
    description: "Extra damage; can only attack at range.",
    category: "offensive",
  },
  {
    id: "savage",
    name: "Savage",
    description: "Always crits Grappled creatures.",
    category: "offensive",
  },
  {
    id: "silencer",
    name: "Silencer",
    description:
      "Attacks silence enemies (making them unable to cast spells or perform other actions that require the voice).",
    category: "offensive",
  },
  {
    id: "summoner",
    name: "Summoner",
    description: "Calls minions to their aid each round.",
    category: "offensive",
  },
  {
    id: "vicious",
    name: "Vicious",
    description: "Crits are Vicious (roll 1 additional die).",
    category: "offensive",
  },
  // Defensive (13)
  {
    id: "acid-blood",
    name: "Acid Blood",
    description:
      "Melee attackers take half the HP lost in return as acid damage.",
    category: "defensive",
  },
  {
    id: "controlling",
    name: "Controlling",
    description: "Creates/immune to difficult terrain.",
    category: "defensive",
  },
  {
    id: "disintegrating-armor",
    name: "Disintegrating Armor",
    description:
      "Starts with Heavy Armor, on crit degrades to Medium, then to none.",
    category: "defensive",
  },
  {
    id: "fast",
    name: "FAST",
    description:
      "Reaction: 1/round. Force a reroll with disadvantage on an attack.",
    category: "defensive",
  },
  {
    id: "formation",
    name: "Formation",
    description:
      "Armor increases 1 step for each adjacent ally (None, Med, Heavy).",
    category: "defensive",
  },
  {
    id: "invulnerable",
    name: "Invulnerable",
    description: "Immune to damage until crit.",
    category: "defensive",
  },
  {
    id: "parry",
    name: "Parry",
    description: "Attacks against them miss on a 1 and 2.",
    category: "defensive",
  },
  {
    id: "retaliate",
    name: "Retaliate",
    description:
      "Attacks the first creature who attacks them in melee each round.",
    category: "defensive",
  },
  {
    id: "shifty",
    name: "Shifty",
    description: "Can move after being attacked.",
    category: "defensive",
  },
  {
    id: "spiked",
    name: "Spiked",
    description:
      "When hit by a melee attack, the attacker takes 1d4 piercing damage in return.",
    category: "defensive",
  },
  {
    id: "standard-bearer",
    name: "Standard Bearer",
    description:
      "Buffs nearby allies, reducing the damage they take or increasing the damage they do.",
    category: "defensive",
  },
  {
    id: "sturdy-undying",
    name: "Sturdy/Undying",
    description:
      "The first time the monster would die, they have 1 HP instead.",
    category: "defensive",
  },
  {
    id: "webslinger",
    name: "Webslinger",
    description: "Can immobilize a target with webs when hit or crit.",
    category: "defensive",
  },
  // Neutral (6)
  {
    id: "climbing",
    name: "Climbing",
    description: "Can traverse walls or ceilings normally.",
    category: "neutral",
  },
  {
    id: "flying",
    name: "Flying",
    description:
      "Flying speed and immune to Opportunity Attacks. May FALL when crit (1d6 damage/10 ft. fallen, and lands Prone).",
    category: "neutral",
  },
  {
    id: "hates-the-light",
    name: "Hates the Light",
    description: "Attacks the hero holding light.",
    category: "neutral",
  },
  {
    id: "sneak",
    name: "Sneak",
    description: "Invisible until they attack.",
    category: "neutral",
  },
  {
    id: "tricky",
    name: "Tricky",
    description: "Can swap places with allies or enemies.",
    category: "neutral",
  },
  {
    id: "warping-touch",
    name: "Warping Touch",
    description: "On hit: teleport target X spaces.",
    category: "neutral",
  },
];

export function getAbilitiesByCategory(
  category: AbilityCategory
): MonsterAbilityTemplate[] {
  return MONSTER_ABILITIES.filter((a) => a.category === category);
}

/**
 * Calculate the effective level cost of selected abilities.
 * Returns { offensiveCost, defensiveCost } — each offensive ability = +1 damage level, each defensive = +1 HP level.
 */
export function calculateAbilityCost(abilityIds: string[]): {
  offensiveCost: number;
  defensiveCost: number;
} {
  let offensiveCost = 0;
  let defensiveCost = 0;

  for (const id of abilityIds) {
    const ability = MONSTER_ABILITIES.find((a) => a.id === id);
    if (!ability) continue;
    if (ability.category === "offensive") offensiveCost++;
    else if (ability.category === "defensive") defensiveCost++;
  }

  return { offensiveCost, defensiveCost };
}
