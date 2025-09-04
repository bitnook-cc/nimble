import { SubclassDefinition } from '../../types/class';

export const shadowmancerRedDragon: SubclassDefinition = {
  id: 'shadowmancer-red-dragon',
  name: 'Pact of the Red Dragon',
  parentClassId: 'shadowmancer',
  description: 'A shadowmancer who has made a pact with a powerful red dragon, gaining mastery over fire magic and draconic power.',
  features: [
    {
      id: 'draconic-crimson-rite',
      level: 3,
      type: 'passive_feature',
      name: 'Draconic Crimson Rite',
      description: 'Your Patron grants you knowledge of Fire spells. Your shadow minions become dragons of fire instead of shadows. Your Shadow Blast can deal fire or necrotic damage and inflict Smoldering whenever they would crit.',
      category: 'combat'
    },
    {
      id: 'we-ll-all-burn',
      level: 7,
      type: 'ability',
      name: 'We\'ll ALL Burn!',
      description: 'You may cast Pyrodasim without Pilfering Power by including yourself in the damage. You have advantage on the save. Choose 1 Fire Utility Spell.',
      ability: {
        id: 'we-ll-all-burn',
        name: 'We\'ll ALL Burn!',
        description: 'Cast Pyrodasim without Pilfering Power by including yourself in the damage. You have advantage on the save.',
        type: 'action',
        frequency: 'at_will'
      }
    },
    {
      id: 'heart-of-burning-fire',
      level: 11,
      type: 'passive_feature',
      name: 'Heart of Burning Fire',
      description: 'Regain 1 use of Pilfered Power each time you roll Initiative. This expires at the end of combat if unused.',
      category: 'combat'
    },
    {
      id: 'enveloped-by-the-master',
      level: 15,
      type: 'passive_feature',
      name: 'Enveloped by the Master',
      description: 'Gain 1d4 Wounds to cast Dragonform.',
      category: 'combat'
    }
  ]
};