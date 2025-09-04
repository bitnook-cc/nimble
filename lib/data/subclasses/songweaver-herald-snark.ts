import { SubclassDefinition } from '../../types/class';

export const songweaverHeraldSnark: SubclassDefinition = {
  id: 'songweaver-herald-snark',
  name: 'Herald of Snark',
  parentClassId: 'songweaver',
  description: 'A songweaver who specializes in cutting wit and vicious mockery, using sharp words as deadly weapons.',
  features: [
    {
      id: 'opportunistic-snark',
      level: 3,
      type: 'ability',
      name: 'Opportunistic Snark',
      description: 'Reaction (when an enemy within Range 12 misses an attack): You may cast Vicious Mockery at them; it deals double damage when cast this way.',
      ability: {
        id: 'opportunistic-snark',
        name: 'Opportunistic Snark',
        description: 'Cast Vicious Mockery as a reaction when an enemy misses. Deals double damage.',
        type: 'action',
        frequency: 'at_will'
      }
    },
    {
      id: 'fight-picker',
      level: 7,
      type: 'ability',
      name: 'Fight Picker',
      description: '(1/turn) When an enemy is damaged by your Vicious Mockery, you may have one of your allies Fight Them! until the end of the enemy\'s turn instead.',
      ability: {
        id: 'fight-picker',
        name: 'Fight Picker',
        description: 'When Vicious Mockery hits, ally can Fight Them! until end of enemy\'s turn.',
        type: 'action',
        frequency: 'at_will'
      }
    },
    {
      id: 'chord-of-chaos',
      level: 11,
      type: 'ability',
      name: 'Chord of Chaos',
      description: '(1/encounter) Action: You may move ALL creatures within hearing of your song up to 6 spaces into an obviously dangerous place.',
      ability: {
        id: 'chord-of-chaos',
        name: 'Chord of Chaos',
        description: 'Move ALL creatures within hearing up to 6 spaces into an obviously dangerous place.',
        type: 'action',
        frequency: 'per_encounter',
        maxUses: { type: 'fixed', value: 1 },
        actionCost: 1
      }
    },
    {
      id: 'words-like-swords',
      level: 15,
      type: 'passive_feature',
      name: 'Words Like Swords',
      description: 'Your Vicious Mockery damage becomes 1d6+INT+WIL.',
      category: 'combat'
    }
  ]
};