import { SubclassDefinition, ClassFeature } from '../../types/class';

const vanguardFeatures: ClassFeature[] = [
  // Level 3
  {
    id: 'vanguard-advance',
    level: 3,
    name: 'Advance!',
    description: '(1/round) After you move toward an enemy, gain advantage on the first melee attack you make against it. When you use your Coordinated Strike, you and all allies within 12 spaces can first move up to half their speed for free.',
    effects: [
      {
        id: 'vanguard-advance-0',
        type: 'ability',
        ability: {
          id: 'advance',
          name: 'Advance!',
          description: 'After you move toward an enemy, gain advantage on the first melee attack you make against it. When you use your Coordinated Strike, you and all allies within 12 spaces can first move up to half their speed for free.',
          type: 'action',
          frequency: 'per_turn',
          maxUses: { type: 'fixed', value: 1 }
        }
      }
    ]
  },
  // Level 7
  {
    id: 'vanguard-experienced-commander',
    level: 7,
    name: 'Experienced Commander',
    description: 'Your Coordinated Strike may target 1 additional ally. Gain +1 use of Coordinated Strike/Safe Rest.',
    effects: [] // Passive feature - no mechanical effects to process
  },
  // Level 11
  {
    id: 'vanguard-survey-the-battlefield',
    level: 11,
    name: 'Survey the Battlefield',
    description: 'When you roll Initiative, regain 1 use of Coordinated Strike. +1 max Combat Dice.',
    effects: [] // Passive feature - no mechanical effects to process
  },
  // Level 15
  {
    id: 'vanguard-as-one',
    level: 15,
    name: 'As One!',
    description: 'Attacks made with your Coordinated Strike also grant advantage and ignore all disadvantage. Your chosen allies gain 1 additional action to use on their next turn.',
    effects: [] // Passive feature - no mechanical effects to process
  }
];

export const commanderVanguard: SubclassDefinition = {
  id: 'champion-of-the-vanguard',
  name: 'Champion of the Vanguard',
  description: 'Commanders who become Champions of the Vanguard lead from the front, inspiring allies with aggressive tactics and coordinated assaults. They excel at creating opportunities for their team through superior positioning and timing.',
  parentClassId: 'commander',
  features: vanguardFeatures
};