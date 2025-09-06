import { SpellAbility } from "../../types/abilities";

// ICE UTILITY SPELLS
export const iceUtilitySpells: SpellAbility[] = [
  {
    id: "ice-disk",
    name: "Ice Disk",
    type: "spell",
    school: "ice",
    tier: 0,
    description:
      "Conjure a disk of ice that floats just above the ground and follows you. It can carry up to 250 lbs / 115 kg of weight for 1 hour or until you cast this spell again.",
  },
  {
    id: "chillcraft",
    name: "Chillcraft",
    type: "spell",
    school: "ice",
    tier: 0,
    description:
      "Harmlessly freeze, thaw, or move a bath-sized amount of water near you. OR: Conjure a sheet of opaque, mirror-like, or transparent ice the size of a window or small door.",
  },
  {
    id: "wintry-scrying",
    name: "Wintry Scrying",
    type: "spell",
    school: "ice",
    tier: 0,
    description:
      "Turn a small patch of water into a reflective icy mirror. Looking though it grants you vision of any desired location near this same body of water for 10 minutes.",
  },
];

// LIGHTNING UTILITY SPELLS
export const lightningUtilitySpells: SpellAbility[] = [
  {
    id: "spark-buddy",
    name: "Spark Buddy",
    type: "spell",
    school: "lightning",
    tier: 0,
    description:
      "Conjure a tiny (squirrel-sized) electrical helper for up to 1 hour. It can fetch tiny objects (~1 lb / 500 g max), open unlocked doors, illuminate a small area, or deliver a harmless shock. If it takes damage or moves further than 6 spaces away from you, it dissipates into sparks.",
  },
  {
    id: "spark-step",
    name: "Spark Step",
    type: "spell",
    school: "lightning",
    tier: 0,
    description: "Teleport to a metal object.",
  },
  {
    id: "tempests-command",
    name: "Tempest's Command",
    type: "spell",
    school: "lightning",
    tier: 0,
    description:
      "A minor magical effect, or temporarily suppress a stronger one (the more powerful an enchantment, the shorter the duration). OR: Your eyes glow and your voice is amplified to a booming, thunder-like volume for 1 minute.",
  },
];

// RADIANT UTILITY SPELLS
export const radiantUtilitySpells: SpellAbility[] = [
  {
    id: "light",
    name: "Light",
    type: "spell",
    school: "radiant",
    tier: 0,
    description:
      "Cause an item to brightly glow as a torch with radiant light for as long as you hold it.",
  },
  {
    id: "beautify",
    name: "Beautify",
    type: "spell",
    school: "radiant",
    tier: 0,
    description:
      "Clean stains or repair a small tear/break in a non-magical item, or conjure tiny beautiful things: flowers, butterflies, etc.",
  },
  {
    id: "bond-of-peace",
    name: "Bond of Peace",
    type: "spell",
    school: "radiant",
    tier: 0,
    description:
      "Telepathically communicate simple thoughts or feelings with a friendly creature you can see. OR: Imbue your spoken words with calming magic, granting advantage on any check made to soothe anger or fear in creatures who can hear you.",
  },
];

// FIRE UTILITY SPELLS
export const fireUtilitySpells: SpellAbility[] = [
  {
    id: "firebrand",
    name: "Firebrand",
    type: "spell",
    school: "fire",
    tier: 0,
    description:
      "Touch a surface and secretly mark it with a symbol or brief message. Speaking a chosen command word while nearby reveals it.",
  },
  {
    id: "fire-step",
    name: "Fire Step",
    type: "spell",
    school: "fire",
    tier: 0,
    description: "Teleport to a fire source you can see.",
  },
  {
    id: "kindle",
    name: "Kindle",
    type: "spell",
    school: "fire",
    tier: 0,
    description: "A minor visual illusion. OR: Ignite a small, unheld item within Range 6.",
  },
];

// WIND UTILITY SPELLS
export const windUtilitySpells: SpellAbility[] = [
  {
    id: "wind-whisper",
    name: "Wind Whisper",
    type: "spell",
    school: "wind",
    tier: 0,
    description:
      "You whisper a message into the wind and it will be secretly carried to a specified target within 100 miles / 160 km.",
  },
  {
    id: "helpful-gust",
    name: "Helpful Gust",
    type: "spell",
    school: "wind",
    tier: 0,
    description:
      "Gently move a tiny unheld item within Reach in any direction. OR: Generate an illusory scent.",
  },
  {
    id: "feather-fall",
    name: "Feather Fall",
    type: "spell",
    school: "wind",
    tier: 0,
    description:
      "Reaction: When a creature falls, cause them to gently float to the ground, unharmed.",
  },
];

// NECROTIC UTILITY SPELLS
export const necroticUtilitySpells: SpellAbility[] = [
  {
    id: "gravecraft",
    name: "Gravecraft",
    type: "spell",
    school: "necrotic",
    tier: 0,
    description:
      "Action: Soil a surface with blood, filth, or other disgusting things. OR: Casting time 1 minute: Shape/move a body-sized plot of earth.",
  },
  {
    id: "false-face",
    name: "False Face",
    type: "spell",
    school: "necrotic",
    tier: 0,
    description:
      "Change your appearance to look like someone else for 10 minutes. Requires a piece of them.",
  },
  {
    id: "thought-leech",
    name: "Thought Leech",
    type: "spell",
    school: "necrotic",
    tier: 0,
    description:
      "Read the surface thoughts of a creature within Reach. Creatures can sense you doing this and may not like it.",
  },
];

// Export all utility spells by school
export const utilitySpellsBySchool: Record<string, SpellAbility[]> = {
  ice: iceUtilitySpells,
  lightning: lightningUtilitySpells,
  radiant: radiantUtilitySpells,
  fire: fireUtilitySpells,
  wind: windUtilitySpells,
  necrotic: necroticUtilitySpells,
};
