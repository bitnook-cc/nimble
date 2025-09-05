import { SubclassDefinition, ClassFeature } from '../../types/class';

const silentBladeFeatures: ClassFeature[] = [
  // Level 3
  {
    id: 'silent-blade-amidst-all-this-commotion',
    level: 3,
    name: 'Amidst All This Commotion...',
    description: 'If a creature dies while you Sneak Attack them, you may turn Invisible until you attack again or until the beginning of your next turn.',
    effects: [] // Passive feature - no mechanical effects to process
  },
  {
    id: 'silent-blade-leave-no-trace',
    level: 3,
    name: 'Leave No Trace',
    description: 'Advantage on Stealth checks when you are at full health.',
    effects: [] // Passive feature - no mechanical effects to process
  },
  // Level 7
  {
    id: 'silent-blade-cunning-strike',
    level: 7,
    name: 'Cunning Strike',
    description: '(2/encounter) When you land a Sneak Attack, you may force the target to make a STR save (DC 10+INT). On a failure, instead of rolling your Sneak Attack dice, you may do the maximum amount of damage (if your target saves, regain 1 use).',
    effects: [
      {
        id: 'silent-blade-cunning-strike-0',
        type: 'ability',
        ability: {
          id: 'cunning-strike',
          name: 'Cunning Strike',
          description: 'When you land a Sneak Attack, you may force the target to make a STR save (DC 10+INT). On a failure, instead of rolling your Sneak Attack dice, you may do the maximum amount of damage (if your target saves, regain 1 use).',
          type: 'action',
          frequency: 'per_encounter',
          maxUses: { type: 'fixed', value: 2 }
        }
      }
    ]
  },
  // Level 11
  {
    id: 'silent-blade-professional-skulker',
    level: 11,
    name: 'Professional Skulker',
    description: 'Gain a climbing speed and advantage on Stealth checks (replaces Leave No Trace).',
    effects: [] // Passive feature - no mechanical effects to process
  },
  // Level 15
  {
    id: 'silent-blade-kill',
    level: 15,
    name: 'KILL',
    description: 'When you crit an enemy with fewer max HP than you, it dies.',
    effects: [] // Passive feature - no mechanical effects to process
  }
];

export const cheatSilentBlade: SubclassDefinition = {
  id: 'tools-of-the-silent-blade',
  name: 'Tools of the Silent Blade',
  description: 'Cheats who follow the path of the Silent Blade become masters of assassination and stealth. They strike from the shadows with lethal precision, leaving no trace of their presence.',
  parentClassId: 'cheat',
  features: silentBladeFeatures
};