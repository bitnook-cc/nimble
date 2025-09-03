import { ClassDefinition, ClassFeature } from '../../types/class';
import { ActionAbility } from '../../types/abilities';

// Savage Arsenal abilities - Feature Pool
const savageArsenalFeatures: ClassFeature[] = [
  {
    id: 'death-blow',
    level: 1,
    type: 'passive_feature',
    name: 'Death Blow',
    description: 'After you deal damage from a crit, you may expend any number of Fury Dice. Sum the dice and deal double that amount of damage.',
    category: 'combat'
  },
  {
    id: 'deathless-rage',
    level: 1,
    type: 'ability',
    name: 'Deathless Rage',
    description: '(1/turn) While Dying, you may suffer 1 Wound to gain 1 action.',
    ability: {
      id: 'deathless-rage',
      name: 'Deathless Rage',
      description: '(1/turn) While Dying, you may suffer 1 Wound to gain 1 action.',
      type: 'action',
      frequency: 'per_turn',
      maxUses: 1
    }
  },
  {
    id: 'eager-for-battle',
    level: 1,
    type: 'passive_feature',
    name: 'Eager for Battle',
    description: 'Gain advantage on Initiative. Move 2 × DEX spaces for free on your first turn each encounter.',
    category: 'combat'
  },
  {
    id: 'into-the-fray',
    level: 1,
    type: 'ability',
    name: 'Into the Fray',
    description: 'Action: Leap up to 2 × DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, the next attack against 1 of them for free.',
    ability: {
      id: 'into-the-fray',
      name: 'Into the Fray',
      description: 'Leap up to 2 × DEX spaces toward an enemy. If you land adjacent to at least 2 enemies, the next attack against 1 of them for free.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  {
    id: 'mighty-endurance',
    level: 1,
    type: 'passive_feature',
    name: 'Mighty Endurance',
    description: 'You can now survive an additional 4 Wounds before death.',
    category: 'combat'
  },
  {
    id: 'more-blood',
    level: 1,
    type: 'passive_feature',
    name: 'MORE BLOOD!',
    description: 'Whenever an enemy crits you, gain 1 Fury Die.',
    category: 'combat'
  },
  {
    id: 'rampage',
    level: 1,
    type: 'ability',
    name: 'Rampage',
    description: '(1/turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again.',
    ability: {
      id: 'rampage',
      name: 'Rampage',
      description: '(1/turn) After you land a hit, you may treat your next attack this turn as if you rolled that same amount instead of rolling again.',
      type: 'action',
      frequency: 'per_turn',
      maxUses: 1
    }
  },
  {
    id: 'swift-fury',
    level: 1,
    type: 'passive_feature',
    name: 'Swift Fury',
    description: 'Whenever you gain one or more Fury Dice, move up to DEX spaces for free, ignoring difficult terrain.',
    category: 'combat'
  },
  {
    id: 'thunderous-steps',
    level: 1,
    type: 'passive_feature',
    name: 'Thunderous Steps',
    description: 'After moving at least 4 spaces while Raging, you may deal STR Bludgeoning damage to all adjacent creatures where you stop.',
    category: 'combat'
  },
  {
    id: 'unstoppable-force',
    level: 1,
    type: 'passive_feature',
    name: 'Unstoppable Force',
    description: 'While Dying and Raging, taking damage causes 1 Wound (instead of 2) and critical hits inflict 2 Wounds (instead of 3).',
    category: 'combat'
  },
  {
    id: 'whirlwind',
    level: 1,
    type: 'ability',
    name: 'Whirlwind',
    description: '2 actions: Attack ALL targets within your melee weapon\'s reach.',
    ability: {
      id: 'whirlwind',
      name: 'Whirlwind',
      description: 'Attack ALL targets within your melee weapon\'s reach.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 2
    }
  },
  {
    id: 'you-re-next',
    level: 1,
    type: 'ability',
    name: "You're Next!",
    description: 'Action: While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle.',
    ability: {
      id: 'you-re-next',
      name: "You're Next!",
      description: 'While Raging, you can make a Might skill check to demoralize an enemy within Reach 12 (DC: their current HP). On a success, they immediately flee the battle.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  }
];

const berserkerFeatures: ClassFeature[] = [
  // Level 1
  {
    id: 'berserker-rage',
    level: 1,
    type: 'ability',
    name: 'Rage',
    description: 'Enter a battle fury that enhances your combat prowess.',
    ability: {
      id: 'rage',
      name: 'Rage',
      description: 'Roll a Fury Die (1d4) and set it aside. Add it to every STR attack you make. You can have a max of KEY Fury Dice; they are lost when your Rage ends.',
      type: 'action',
      frequency: 'per_turn',
      maxUses: 1,
      actionCost: 1,
      roll: {
        dice: { count: 1, sides: 4 }
      }
    }
  },
  {
    id: 'berserker-that-all-you-got',
    level: 2,
    type: 'passive_feature',
    name: 'That All You Got?!',
    description: 'When you are attacked, you may expend 1 or more Fury Dice to reduce the damage taken by STR + DEX for each die spent.',
    category: 'combat'
  },
  // Level 2
  {
    id: 'berserker-intensifying-fury',
    level: 2,
    type: 'passive_feature',
    name: 'Intensifying Fury',
    description: 'If you are Raging at the beginning of your turn, roll 1 Fury Die for free.',
    category: 'combat'
  },
  {
    id: 'berserker-one-with-ancients',
    level: 2,
    type: 'passive_feature',
    name: 'One with the Ancients',
    description: '(1/Safe Rest) When faced with a decision about which direction or course of action to take, you can call upon your ancestors to guide you toward the most dangerous or challenging path.',
    category: 'exploration'
  },
  // Level 3
  {
    id: 'berserker-subclass-choice',
    level: 3,
    type: 'subclass_choice',
    name: 'Berserker Subclass',
    description: 'Choose your path of rage and fury.'
  },
  {
    id: 'berserker-bloodlust',
    level: 3,
    type: 'passive_feature',
    name: 'Bloodlust',
    description: 'Expend 1 or more Fury Dice on your turn, move DEX spaces per die spent for free.',
    category: 'combat'
  },
  // Level 4
  {
    id: 'berserker-enduring-rage',
    level: 4,
    type: 'passive_feature',
    name: 'Enduring Rage',
    description: 'While Dying, you Rage automatically for free at the beginning of your turn, have a max of 2 actions instead of 1, and ignore the STR saves to make attacks.',
    category: 'combat'
  },
  {
    id: 'berserker-key-stat-increase-1',
    level: 4,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or DEX',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'dexterity', amount: 1 }
    ]  // Player chooses one
  },
  {
    id: 'berserker-savage-arsenal-1',
    level: 4,
    type: 'pick_feature_from_pool',
    name: 'Savage Arsenal',
    description: 'Choose 1 ability from the Savage Arsenal.',
    poolId: 'savage-arsenal-pool',
    choicesAllowed: 1
  },
  // Level 5
  {
    id: 'berserker-rage-2',
    level: 5,
    type: 'passive_feature',
    name: 'Rage (2)',
    description: 'Whenever you Rage, gain 2 Fury Dice instead.',
    category: 'combat'
  },
  {
    id: 'berserker-secondary-stat-increase-1',
    level: 5,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL',
    statBoosts: [
      { attribute: 'intelligence', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 6
  {
    id: 'berserker-savage-arsenal-2',
    level: 6,
    type: 'pick_feature_from_pool',
    name: 'Savage Arsenal (2)',
    description: 'Choose a 2nd Savage Arsenal ability.',
    poolId: 'savage-arsenal-pool',
    choicesAllowed: 1
  },
  {
    id: 'berserker-intensifying-fury-2',
    level: 6,
    type: 'passive_feature',
    name: 'Intensifying Fury (2)',
    description: 'Your Fury Dice are now d6s.',
    category: 'combat'
  },
  // Level 7
  {
    id: 'berserker-subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Berserker subclass feature.',
    category: 'combat'
  },
  // Level 8
  {
    id: 'berserker-savage-arsenal-3',
    level: 8,
    type: 'pick_feature_from_pool',
    name: 'Savage Arsenal (3)',
    description: 'Choose a 3rd Savage Arsenal ability.',
    poolId: 'savage-arsenal-pool',
    choicesAllowed: 1
  },
  {
    id: 'berserker-key-stat-increase-2',
    level: 8,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or DEX',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'dexterity', amount: 1 }
    ]  // Player chooses one
  },
  // Level 9
  {
    id: 'berserker-intensifying-fury-3',
    level: 9,
    type: 'passive_feature',
    name: 'Intensifying Fury (3)',
    description: 'Your Fury Dice are now d8s.',
    category: 'combat'
  },
  {
    id: 'berserker-secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL',
    statBoosts: [
      { attribute: 'intelligence', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 10
  {
    id: 'berserker-savage-arsenal-4',
    level: 10,
    type: 'pick_feature_from_pool',
    name: 'Savage Arsenal (4)',
    description: 'Choose a 4th Savage Arsenal ability.',
    poolId: 'savage-arsenal-pool',
    choicesAllowed: 1
  },
  // Level 11
  {
    id: 'berserker-subclass-feature-11',
    level: 11,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Berserker subclass feature.',
    category: 'combat'
  },
  // Level 12
  {
    id: 'berserker-savage-arsenal-5',
    level: 12,
    type: 'pick_feature_from_pool',
    name: 'Savage Arsenal (5)',
    description: 'Choose a 5th Savage Arsenal ability.',
    poolId: 'savage-arsenal-pool',
    choicesAllowed: 1
  },
  {
    id: 'berserker-key-stat-increase-3',
    level: 12,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or DEX',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'dexterity', amount: 1 }
    ]  // Player chooses one
  },
  // Level 13
  {
    id: 'berserker-intensifying-fury-4',
    level: 13,
    type: 'passive_feature',
    name: 'Intensifying Fury (4)',
    description: 'Your Fury Dice are now d10s.',
    category: 'combat'
  },
  {
    id: 'berserker-secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL',
    statBoosts: [
      { attribute: 'intelligence', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 14
  {
    id: 'berserker-savage-arsenal-6',
    level: 14,
    type: 'pick_feature_from_pool',
    name: 'Savage Arsenal (6)',
    description: 'Choose a 6th Savage Arsenal ability.',
    poolId: 'savage-arsenal-pool',
    choicesAllowed: 1
  },
  // Level 15
  {
    id: 'berserker-subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Berserker subclass feature.',
    category: 'combat'
  },
  // Level 16
  {
    id: 'berserker-savage-arsenal-7',
    level: 16,
    type: 'pick_feature_from_pool',
    name: 'Savage Arsenal (7)',
    description: 'Choose a 7th Savage Arsenal ability.',
    poolId: 'savage-arsenal-pool',
    choicesAllowed: 1
  },
  {
    id: 'berserker-key-stat-increase-4',
    level: 16,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or DEX',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'dexterity', amount: 1 }
    ]  // Player chooses one
  },
  // Level 17
  {
    id: 'berserker-intensifying-fury-5',
    level: 17,
    type: 'passive_feature',
    name: 'Intensifying Fury (5)',
    description: 'Your Fury Dice are now d12s.',
    category: 'combat'
  },
  {
    id: 'berserker-secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL',
    statBoosts: [
      { attribute: 'intelligence', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 18
  {
    id: 'berserker-deep-rage',
    level: 18,
    type: 'passive_feature',
    name: 'DEEP RAGE',
    description: 'Dropping to 0 HP does not cause your Rage to end.',
    category: 'combat'
  },
  // Level 19
  {
    id: 'berserker-epic-boon',
    level: 19,
    type: 'passive_feature',
    name: 'Epic Boon',
    description: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
    category: 'utility'
  },
  // Level 20
  {
    id: 'berserker-boundless-rage',
    level: 20,
    type: 'passive_feature',
    name: 'BOUNDLESS RAGE',
    description: '+1 to any 2 of your stats. Anytime you roll less than 6 on a Fury Die, change it to 6 instead.',
    category: 'combat'
  }
];

// Wrath & Ruin feature
const wrathAndRuin: ClassFeature = {
  id: 'berserker-wrath-and-ruin',
  level: 1,
  type: 'passive_feature',
  name: 'Wrath & Ruin',
  description: 'Whenever you perform a notable act of destruction or feat of strength during a Safe Rest, you may choose different Berserker options available to you.',
  category: 'utility'
};

export const berserkerClass: ClassDefinition = {
  id: 'berserker',
  name: 'Berserker',
  description: 'A primal warrior who channels rage and fury into devastating combat prowess. Berserkers tap into their savage nature to overwhelm enemies with relentless attacks.',
  hitDieSize: 12,
  keyAttributes: ['strength', 'dexterity'],
  startingHP: 20,
  armorProficiencies: [],
  weaponProficiencies: [
    { type: 'strength_weapons' }
  ],
  saveAdvantages: {
    strength: 'advantage',
    intelligence: 'disadvantage'
  },
  startingEquipment: [
    'battleaxe',
    'rations-meat',
    'rope-50ft'
  ],
  features: [
    ...berserkerFeatures,
    wrathAndRuin
  ],
  featurePools: [
    {
      id: 'savage-arsenal-pool',
      name: 'Savage Arsenal',
      description: 'A collection of brutal combat techniques that Berserkers can learn as they progress.',
      features: savageArsenalFeatures
    }
  ]
};