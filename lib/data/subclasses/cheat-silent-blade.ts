import { SubclassDefinition, ClassFeature } from '../../types/class';

const silentBladeFeatures: ClassFeature[] = [
  // Level 3
  {
    id: 'silent-blade-amidst-all-this-commotion',
    level: 3,
    type: 'passive_feature',
    name: 'Amidst All This Commotion...',
    description: 'If a creature dies while you Sneak Attack them, you may turn Invisible until you attack again or until the beginning of your next turn.',
    category: 'combat'
  },
  {
    id: 'silent-blade-leave-no-trace',
    level: 3,
    type: 'passive_feature',
    name: 'Leave No Trace',
    description: 'Advantage on Stealth checks when you are at full health.',
    category: 'exploration'
  },
  // Level 7
  {
    id: 'silent-blade-cunning-strike',
    level: 7,
    type: 'ability',
    name: 'Cunning Strike',
    description: '(2/encounter) When you land a Sneak Attack, you may force the target to make a STR save (DC 10+INT). On a failure, instead of rolling your Sneak Attack dice, you may do the maximum amount of damage (if your target saves, regain 1 use).',
    ability: {
      id: 'cunning-strike',
      name: 'Cunning Strike',
      description: 'When you land a Sneak Attack, you may force the target to make a STR save (DC 10+INT). On a failure, instead of rolling your Sneak Attack dice, you may do the maximum amount of damage (if your target saves, regain 1 use).',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 2 }
    }
  },
  // Level 11
  {
    id: 'silent-blade-professional-skulker',
    level: 11,
    type: 'passive_feature',
    name: 'Professional Skulker',
    description: 'Gain a climbing speed and advantage on Stealth checks (replaces Leave No Trace).',
    category: 'exploration'
  },
  // Level 15
  {
    id: 'silent-blade-kill',
    level: 15,
    type: 'passive_feature',
    name: 'KILL',
    description: 'When you crit an enemy with fewer max HP than you, it dies.',
    category: 'combat'
  }
];

export const cheatSilentBlade: SubclassDefinition = {
  id: 'tools-of-the-silent-blade',
  name: 'Tools of the Silent Blade',
  description: 'Cheats who follow the path of the Silent Blade become masters of assassination and stealth. They strike from the shadows with lethal precision, leaving no trace of their presence.',
  parentClassId: 'cheat',
  features: silentBladeFeatures
};