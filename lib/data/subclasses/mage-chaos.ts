import { SubclassDefinition } from '../../types/class';

export const mageChaos: SubclassDefinition = {
  id: 'mage-chaos',
  name: 'Invoker of Chaos',
  parentClassId: 'mage',
  description: 'A mage who embraces the wild, unpredictable nature of magic, channeling chaos for power.',
  features: [
    {
      id: 'force-of-chaos',
      level: 3,
      type: 'passive_feature',
      name: 'Force of Chaos',
      description: 'Whenever you cast a spell, you can choose to spend 1 less mana. Whenever you do this and whenever you crit, Invoke Chaos: Roll on the Chaos Table.',
      category: 'combat'
    },
    {
      id: 'chaos-table-note',
      level: 3,
      type: 'passive_feature',
      name: 'Chaos Table',
      description: 'Where\'s the Chaos Table? It\'s a secret for the GM only! Suffice it to say, rolling a 1 is really bad, but rolling a 20 is AWESOME—but if you\'re sure you want to spoil it, you can find it on the back inside cover of the GM\'s Guide. Let chaos reign!',
      category: 'combat'
    },
    {
      id: 'tempest-mage',
      level: 7,
      type: 'passive_feature',
      name: 'Tempest Mage',
      description: 'Learn 1 cantrip and 1 tiered spell from the Wind school.',
      category: 'combat'
    },
    {
      id: 'chaos-lash',
      level: 7,
      type: 'ability',
      name: 'Chaos Lash',
      description: '(1/encounter) Reaction (when an enemy moves adjacent to you): They are pushed back 2 spaces, and on a failed WIL save, knocked Prone as well. Invoke Chaos.',
      ability: {
        id: 'chaos-lash',
        name: 'Chaos Lash',
        description: 'When an enemy moves adjacent to you: They are pushed back 2 spaces, and on a failed WIL save, knocked Prone as well. Invoke Chaos.',
        type: 'action',
        frequency: 'per_encounter',
        maxUses: { type: 'fixed', value: 1 }
      }
    },
    {
      id: 'thrive-in-chaos',
      level: 11,
      type: 'ability',
      name: 'Thrive in Chaos',
      description: 'Whenever you Invoke Chaos, you may roll twice and cause both effects. (1/Safe Rest) You may choose which roll to use instead.',
      ability: {
        id: 'thrive-in-chaos',
        name: 'Thrive in Chaos - Choose Roll',
        description: 'When you Invoke Chaos, choose which of your two rolls to use.',
        type: 'action',
        frequency: 'per_safe_rest',
        maxUses: { type: 'fixed', value: 1 }
      }
    },
    {
      id: 'master-of-chaos',
      level: 15,
      type: 'passive_feature',
      name: 'Master of Chaos',
      description: 'Whenever you Invoke Chaos, roll with advantage.',
      category: 'combat'
    }
  ]
};