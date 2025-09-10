import { SpellAbilityDefinition } from "../../schemas/abilities";
import { SpellSchoolWithSpells } from "../../services/content-repository-service";

const radiantSchoolSpells: SpellAbilityDefinition[] = [
  // Tier 0 (Cantrips)
  {
    id: "rebuke",
    name: "Rebuke",
    description:
      "Cantrip, 1 Action, Single Target. Reach: 4. Damage: 1d6 (ignoring armor), does not miss. 2× damage against undead or cowardly (those Frightened or behind cover). High Levels: +2 damage every 5 levels.",
    type: "spell",
    school: "radiant",
    tier: 0,
    category: "combat",
    actionCost: 1,
    diceFormula: "1d6",
    scalingBonus: "+2",
  },
  {
    id: "true-strike",
    name: "True Strike",
    description:
      "Cantrip, 1 Action, Single Target. Reach: 2. Give a creature advantage on the next attack they make (until the end of their next turn). High Levels: +1 Reach every 5 levels.",
    type: "spell",
    school: "radiant",
    tier: 0,
    category: "combat",
    actionCost: 1,
  },

  // Tier 1
  {
    id: "heal",
    name: "Heal",
    description:
      "Tier 1, 1 Action, Single Target. Reach: 1. Heal a creature 1d6+KEY HP. Upcast: Choose one: +1 target, +4 Reach, +1d6 healing. If 5+ mana is spent, you may also heal 1 negative condition (e.g., Blind, Poisoned, 1 Wound).",
    type: "spell",
    school: "radiant",
    tier: 1,
    category: "combat",
    actionCost: 1,
    diceFormula: "1d6+INT",
    upcastBonus: "+1d6",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },

  // Tier 2
  {
    id: "warding-bond",
    name: "Warding Bond",
    description:
      "Tier 2, 1 Action, Single Target. Designate a willing creature as your ward for 1 minute. They take half damage from all attacks; you are attacked for the other half. Upcast: +1 creature.",
    type: "spell",
    school: "radiant",
    tier: 2,
    category: "combat",
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 2,
    },
  },

  // Tier 3
  {
    id: "shield-of-justice",
    name: "Shield of Justice",
    description:
      "Tier 3, 1 Action, Self. Reaction: When attacked, Defend for free and reflect Radiant damage back at the attacker equal to the amount blocked (ignoring armor). Upcast: +5 Armor.",
    type: "spell",
    school: "radiant",
    tier: 3,
    category: "combat",
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 3,
    },
  },

  // Tier 4
  {
    id: "condemn",
    name: "Condemn",
    description:
      "Tier 4, 2 Actions, Single Target. Reach: 4. Damage: 30. Can only target an enemy that crit you or an ally since your last turn. Cannot be reduced by any means. The next attack against that enemy is made with advantage. Upcast: +1 Reach, +1 advantage.",
    type: "spell",
    school: "radiant",
    tier: 4,
    category: "combat",
    actionCost: 2,
    // Fixed 30 damage, no roll needed
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 4,
    },
  },

  // Tier 5
  {
    id: "vengeance",
    name: "Vengeance",
    description:
      "Tier 5, 2 Actions, Single Target. Reach: 1. Damage: 1d100, to a creature that attacked a Dying ally or reduced one to 0 HP since your last turn. Upcast: +1 Reach, roll w/ advantage.",
    type: "spell",
    school: "radiant",
    tier: 5,
    category: "combat",
    actionCost: 2,
    diceFormula: "1d100",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 5,
    },
  },

  // Tier 6
  {
    id: "sacrifice",
    name: "Sacrifice",
    description:
      "Tier 6, 1 Action, Special. Reach: 4. Reduce yourself to 0 HP. You cannot have more than 0 HP until you Safe Rest. Heal a number of HP equal to your maximum HP, divided as you choose to any other creatures within Reach. Also revive a creature that has died in the past minute if you give them at least 20 HP (also healing 2 Wounds from them), provided they have not been revived with this spell before. Upcast: +4 Reach.",
    type: "spell",
    school: "radiant",
    tier: 6,
    category: "combat",
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 6,
    },
  },

  // Tier 7
  {
    id: "redeem",
    name: "Redeem",
    description:
      "Tier 7, AoE. Casting Time: 24 hours. Requires: A diamond worth at least 10,000 gp, which this spell consumes. Revive any number of deceased creatures you choose–within 1 mile–that have died in the past year, provided they have not died of old age or been revived with this spell before. SHEPHERD ONLY",
    type: "spell",
    school: "radiant",
    tier: 7,
    category: "combat",
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 7,
    },
  },
];

const radiantUtilitySpells: SpellAbilityDefinition[] = [
  {
    id: "augury",
    name: "Augury",
    type: "spell",
    school: "radiant",
    tier: 0,
    category: "utility",
    description:
      "You receive an omen from your deity about the results of a specific course of action that you plan to take within the next 30 minutes. The GM offers: Weal (good), Woe (bad), Weal & Woe (both), or Silence (neither). Once you cast this spell, you cannot cast it again for 24 hours.",
  },
  {
    id: "light",
    name: "Light",
    type: "spell",
    school: "radiant",
    tier: 0,
    category: "utility",
    description:
      "Imbue a target you touch with bright light for 1 hour. The light illuminates a 6×6 space area. If the target is hostile, you must make a successful spell attack against them.",
  },
  {
    id: "purifying-flame",
    name: "Purifying Flame",
    type: "spell",
    school: "radiant",
    tier: 0,
    category: "utility",
    description:
      "Touch a volume of food and/or water that fits in a 1×1×1 space cube to purify it, removing all poison and disease.",
  },
];

export const radiantSpellSchool: SpellSchoolWithSpells = {
  id: "radiant",
  name: "Radiant Spells",
  description: "Divine light and healing magic that channels sacred energy",
  color: "text-amber-400",
  icon: "sun",
  spells: [...radiantSchoolSpells, ...radiantUtilitySpells], // Combine all spells (combat and utility)
};

// Legacy export for backward compatibility
export { radiantSchoolSpells };
