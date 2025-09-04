import { SubclassDefinition } from '../../types/class';

export const shepherdLuminaryMalice: SubclassDefinition = {
  id: 'shepherd-luminary-malice',
  name: 'Luminary of Malice',
  parentClassId: 'shepherd',
  description: 'A shepherd who embraces the darker aspects of twilight, wielding death and decay alongside their healing powers.',
  features: [
    {
      id: 'soul-reaper',
      level: 3,
      type: 'passive_feature',
      name: 'Soul Reaper',
      description: 'When you use Searing Light to harm an enemy, make a 2nd enemy within range take the same amount of damage (ignoring armor).',
      category: 'combat'
    },
    {
      id: 'harbinger-of-decay',
      level: 3,
      type: 'passive_feature',
      name: 'Harbinger of Decay',
      description: 'Vibrant plants and lovely smells are suppressed near you. Foods spoil more rapidly in your presence, and you frequently awaken to flies wherever you lodge. You may have your Lifebinding Spirit shift into a ghostly version of itself (a zombie dog, a devious imp, etc.) and have its damage type become necrotic.',
      category: 'social'
    },
    {
      id: 'veilwalker-s-blessing',
      level: 7,
      type: 'ability',
      name: 'Veilwalker\'s Blessing',
      description: '(1/Safe Rest) Reaction (when you would drop to 0 HP): Drop to 1 HP instead and force an enemy within 6 spaces to make a STR save. On a failure, they become Bloodied, or if they are already Bloodied, they drop to 0 HP.',
      ability: {
        id: 'veilwalker-s-blessing',
        name: 'Veilwalker\'s Blessing',
        description: 'When dropping to 0 HP: Drop to 1 HP instead and force an enemy to make a STR save or become Bloodied/drop to 0 HP.',
        type: 'action',
        frequency: 'per_safe_rest',
        maxUses: { type: 'fixed', value: 1 }
      }
    },
    {
      id: 'deathbringer-s-touch',
      level: 11,
      type: 'passive_feature',
      name: 'Deathbringer\'s Touch',
      description: 'Your first melee attack each round against a Bloodied creature is an automatic critical hit. Your Lifebinding Spirit deals additional damage equal to your STR.',
      category: 'combat'
    },
    {
      id: 'conduit-of-death',
      level: 15,
      type: 'passive_feature',
      name: 'Conduit of Death',
      description: 'Your Veilwalker\'s Blessing ability recharges when you roll Initiative. This charge is lost if unspent at the end of combat.',
      category: 'combat'
    }
  ]
};