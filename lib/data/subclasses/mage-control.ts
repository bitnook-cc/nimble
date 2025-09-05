import { SubclassDefinition } from '../../types/class';

export const mageControl: SubclassDefinition = {
  id: 'mage-control',
  name: 'Invoker of Control',
  parentClassId: 'mage',
  description: 'A mage who seeks to master and control the forces of magic through careful study and discipline.',
  features: [
    {
      id: 'force-of-will',
      level: 3,
      name: 'Force of Will',
      description: '(1/round) On your turn, you may Demand Control. Choose 1 option from the Control Table which you haven\'t chosen yet, resets when you roll initiative, or when you have chosen all options once.',
      effects: [
        {
          id: 'force-of-will-0',
          type: 'ability',
          ability: {
            id: 'force-of-will',
            name: 'Force of Will - Demand Control',
            description: 'Choose 1 option from the Control Table: I INSIST (Cast a cantrip for free, ignoring all disadvantage, it cannot miss), ELEMENTAL AFFLICTION (A creature of your choice within 12 spaces gains the Charged, Smoldering, or Slowed condition), NO (Choose a creature, it cannot harm a creature of your choice during its next turn), LOSE CONTROL (Do ALL of the above, but the GM chooses each time).',
            type: 'action',
            frequency: 'at_will',
            maxUses: { type: 'fixed', value: 1 }
          }
        }
      ]
    },
    {
      id: 'control-table',
      level: 3,
      name: 'Control Table',
      description: 'Magic is Dangerous. You can stitch its fraying edges together to your own benefit... for a time.\n\n• I INSIST: Cast a cantrip for free, ignoring all disadvantage, it cannot miss.\n• ELEMENTAL AFFLICTION: A creature of your choice within 12 spaces gains the Charged, Smoldering, or Slowed condition.\n• NO: Choose a creature, it cannot harm a creature of your choice during its next turn.\n• LOSE CONTROL: Do ALL of the above, but the GM chooses each time.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'deny-fate',
      level: 3,
      name: 'Deny Fate',
      description: 'Whenever you miss with a spell or an effect you cause is saved against, you MUST Demand Control.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'at-any-cost',
      level: 7,
      name: 'At Any Cost',
      description: 'Learn 1 cantrip and 1 tiered spell from the Necrotic school.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'nullify',
      level: 7,
      name: 'Nullify',
      description: '(1/encounter) Ignore all disadvantage and other negative effects on your next action this turn, then Demand Control.',
      effects: [
        {
          id: 'nullify-0',
          type: 'ability',
          ability: {
            id: 'nullify',
            name: 'Nullify',
            description: 'Ignore all disadvantage and other negative effects on your next action this turn, then Demand Control.',
            type: 'action',
            frequency: 'per_encounter',
            maxUses: { type: 'fixed', value: 1 }
          }
        }
      ]
    },
    {
      id: 'steel-will',
      level: 11,
      name: 'Steel Will',
      description: '(1/Safe Rest) Whenever you would fail a save, you may succeed instead. Whenever you roll a 1 on an Elemental Surge die, you may reroll it once.',
      effects: [
        {
          id: 'steel-will-0',
          type: 'ability',
          ability: {
            id: 'steel-will',
            name: 'Steel Will',
            description: 'Whenever you would fail a save, you may succeed instead.',
            type: 'action',
            frequency: 'per_safe_rest',
            maxUses: { type: 'fixed', value: 1 }
          }
        }
      ]
    },
    {
      id: 'supreme-control',
      level: 15,
      name: 'Supreme Control',
      description: 'Whenever you Demand Control, you may choose to trigger the selected option twice. You may Demand Control as a Reaction.',
      effects: [] // Passive feature - no mechanical effects to process
    }
  ]
};