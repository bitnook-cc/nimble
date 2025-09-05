import { SubclassDefinition } from '../../types/class';

export const oathswornVengeance: SubclassDefinition = {
  id: 'oathsworn-vengeance',
  name: 'Oath of Vengeance',
  parentClassId: 'oathsworn',
  description: 'An oath sworn to bring divine justice and retribution to those who have done wrong.',
  features: [
    {
      id: 'aura-of-zeal',
      level: 3,
      name: 'Aura of Zeal',
      description: 'Whenever you roll Judgment Dice, roll 1 more. Gain an aura with a Reach of 4. Your Radiant Judgment also triggers when an ally within your aura is attacked while you have no Judgment Dice.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'sacred-decree-vengeance',
      level: 3,
      name: 'Sacred Decrees',
      description: 'Vengeance Oathsworn learn specific Sacred Decrees:\n\n• Blinding Aura (1/Safe Rest) Action: Enemies in your aura are Blinded until the end of their next turn. Dice, roll with advantage (roll one extra and drop the lowest).\n\n• Courage! (1/encounter) When you or an ally in your aura would drop to 0 HP, instead they don\'t.\n\n• Explosive Judgment (1/encounter) 2 actions: Expend your Judgment Dice, deal that much radiant damage to all enemies in your aura.\n\n• Improved Aura: +2 aura Reach.\n\n• Radiant Aura Action: End any single harmful condition or effect on yourself or another willing creature within your aura. You may use this ability WIL times/Safe Rest.\n\n• Reliable Justice: Whenever you roll Judgment Dice, roll with advantage (roll one extra and drop the lowest).',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'avenger',
      level: 7,
      name: 'Avenger',
      description: 'Whenever you or an ally within your aura gain any Wounds, change up to that many Judgment Dice to their max. Then, move up to half your speed for free.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'unerring-judgment',
      level: 11,
      name: 'Unerring Judgment',
      description: 'Increase your primary die rolls on melee attacks by 1 whenever you have Judgment Dice.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'maximum-judgment',
      level: 15,
      name: 'Maximum Judgment',
      description: 'Whenever you are attacked, set a Judgment Die to its max.',
      effects: [] // Passive feature - no mechanical effects to process
    }
  ]
};