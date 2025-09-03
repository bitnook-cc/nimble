import { ClassDefinition, ClassFeature } from '../../types/class';

// Commander's Orders - Feature Pool
const commandersOrdersFeatures: ClassFeature[] = [
  {
    id: 'coordinated-strike-order',
    level: 1,
    type: 'ability',
    name: 'Coordinated Strike!',
    description: '(1/round) Free action: you and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free. You can do this INT times/Safe Rest.',
    ability: {
      id: 'coordinated-strike',
      name: 'Coordinated Strike!',
      description: 'You and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free.',
      type: 'action',
      frequency: 'per_turn',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'face-me-order',
    level: 1,
    type: 'ability',
    name: 'Face Me!',
    description: 'Reaction (after an ally is crit within 12 spaces): Taunt that enemy until you drop to 0 HP.',
    ability: {
      id: 'face-me',
      name: 'Face Me!',
      description: 'Taunt that enemy until you drop to 0 HP.',
      type: 'action',
      frequency: 'at_will'
    }
  },
  {
    id: 'hold-the-line-order',
    level: 1,
    type: 'ability',
    name: 'Hold the Line!',
    description: '(1/encounter) Reaction (when an ally drops to 0 HP): Command them to continue the fight! Set their HP to 3 × your LVL.',
    ability: {
      id: 'hold-the-line',
      name: 'Hold the Line!',
      description: 'Command an ally who drops to 0 HP to continue the fight! Set their HP to 3 × your LVL.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'i-can-do-this-all-day-order',
    level: 1,
    type: 'ability',
    name: 'I Can Do This ALL DAY!',
    description: '(1/encounter) Reaction (when you would drop to 0 HP): You may expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR).',
    ability: {
      id: 'i-can-do-this-all-day',
      name: 'I Can Do This ALL DAY!',
      description: 'When you would drop to 0 HP, expend any number of Hit Dice and set your HP to the sum rolled instead (do not add your STR).',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'move-it-move-it-order',
    level: 1,
    type: 'passive_feature',
    name: 'Move it! Move it!',
    description: 'When you roll Initiative you may give yourself and an ally advantage on the roll and +3 speed for 1 round.',
    category: 'combat'
  },
  {
    id: 'reposition-order',
    level: 1,
    type: 'ability',
    name: 'Reposition!',
    description: "Action/Reaction (on an ally's turn): Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free.",
    ability: {
      id: 'reposition',
      name: 'Reposition!',
      description: 'Command 1 ally to move up to their speed (or 2 allies up to half their speed) for free.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  }
];

// Combat Tactics - Feature Pool
const combatTacticsFeatures: ClassFeature[] = [
  {
    id: 'attack-tactic',
    level: 1,
    type: 'passive_feature',
    name: '1/Attack',
    description: 'You can expend a Combat Die to add one of the following effects to your attack.',
    category: 'combat'
  },
  {
    id: 'commanding-presence',
    level: 1,
    type: 'ability',
    name: 'Commanding Presence',
    description: 'Action: Shout a command up to 2 words long at an enemy. On a failed WIL save (DC 10+STR), they must spend their entire next turn obeying it to the best of their ability, provided it is not obviously harmful to themselves. They then become immune to this effect for 1 day.',
    ability: {
      id: 'commanding-presence',
      name: 'Commanding Presence',
      description: 'Shout a command up to 2 words long at an enemy. On a failed WIL save (DC 10+STR), they must spend their entire next turn obeying it.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  {
    id: 'heavy-strike',
    level: 1,
    type: 'passive_feature',
    name: 'Heavy Strike',
    description: 'When you hit, push a Medium creature STR spaces and deal extra damage equal to a roll of your Combat Die. A Small creature is pushed twice as far; Large, pushed half as far (round down).',
    category: 'combat'
  },
  {
    id: 'inerrant-strike',
    level: 1,
    type: 'passive_feature',
    name: 'Inerrant Strike',
    description: 'Reroll a missed attack, add 1 to the Primary Die, and deal extra damage equal to a roll of your Combat Die.',
    category: 'combat'
  },
  {
    id: 'lunging-strike',
    level: 1,
    type: 'passive_feature',
    name: 'Lunging Strike',
    description: 'Gain +1 Reach on an attack and deal extra damage equal to 2 × a roll of your Combat Die.',
    category: 'combat'
  },
  {
    id: 'sweeping-strike',
    level: 1,
    type: 'passive_feature',
    name: 'Sweeping Strike',
    description: "2 actions: Select any contiguous area within your weapon's Reach and damage ALL targets there. This attack does not miss on a 1.",
    category: 'combat'
  }
];

// Weapon Mastery - Feature Pool
const weaponMasteryFeatures: ClassFeature[] = [
  {
    id: 'slashing-mastery',
    level: 1,
    type: 'passive_feature',
    name: 'Slashing',
    description: 'Your attacks with slashing weapons cannot miss unarmored enemies.',
    category: 'combat'
  },
  {
    id: 'bludgeoning-mastery',
    level: 1,
    type: 'passive_feature',
    name: 'Bludgeoning',
    description: 'When your primary die rolls a 7 or higher with a bludgeoning weapon, ignore Heavy Armor.',
    category: 'combat'
  },
  {
    id: 'piercing-mastery',
    level: 1,
    type: 'passive_feature',
    name: 'Piercing',
    description: 'Your attacks with piercing weapons ignore Medium Armor.',
    category: 'combat'
  }
];

const commanderFeatures: ClassFeature[] = [
  // Level 1
  {
    id: 'commander-coordinated-strike',
    level: 1,
    type: 'ability',
    name: 'Coordinated Strike!',
    description: "Gain the Coordinated Strike! Commander's Order.",
    ability: {
      id: 'coordinated-strike-base',
      name: 'Coordinated Strike!',
      description: 'You and an ally within 6 spaces both immediately make a weapon attack or cast a cantrip for free.',
      type: 'action',
      frequency: 'per_safe_rest',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  // Level 2
  {
    id: 'commander-orders-choice-1',
    level: 2,
    type: 'pick_feature_from_pool',
    name: "Commander's Orders",
    description: "Choose 2 Commander's Orders.",
    poolId: 'commanders-orders-pool',
    choicesAllowed: 2
  },
  {
    id: 'commander-field-medic',
    level: 2,
    type: 'ability',
    name: 'Field Medic',
    description: 'Roll 1 additional die for any health potion you administer. Whenever you or an ally spend any number of Hit Dice to recover HP, if you spent at least ten minutes examining their wounds, they can add your Examination bonus to the HP recovered.',
    ability: {
      id: 'field-medic',
      name: 'Field Medic',
      description: 'Roll 1 additional die for any health potion you administer.',
      type: 'action',
      frequency: 'at_will'
    }
  },
  // Level 3
  {
    id: 'commander-subclass-choice',
    level: 3,
    type: 'subclass_choice',
    name: 'Commander Subclass',
    description: 'Choose your path of command.'
  },
  // Level 4
  {
    id: 'commander-fit-for-any-battlefield-1',
    level: 4,
    type: 'pick_feature_from_pool',
    name: 'Fit for Any Battlefield',
    description: 'Choose a Combat Tactic. When you roll Initiative, gain STR Combat Dice, each a d6. (1/attack) You may expend a Combat Die to perform a special maneuver. Combat Dice are lost when combat ends.',
    poolId: 'combat-tactics-pool',
    choicesAllowed: 1
  },
  {
    id: 'commander-key-stat-increase-1',
    level: 4,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or INT',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'intelligence', amount: 1 }
    ]  // Player chooses one
  },
  // Level 5
  {
    id: 'commander-master-commander',
    level: 5,
    type: 'passive_feature',
    name: 'Master Commander',
    description: 'When you roll Initiative, regain 1 spent use of Coordinated Strike (it is lost if not spent during that encounter). Attacks made from your Coordinated Strikes also now ignore disadvantage.',
    category: 'combat'
  },
  {
    id: 'commander-combat-tactics-dice-1',
    level: 5,
    type: 'passive_feature',
    name: 'Combat Tactics',
    description: 'Your Combat Dice are now d8s.',
    category: 'combat'
  },
  {
    id: 'commander-secondary-stat-increase-1',
    level: 5,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or WIL',
    statBoosts: [
      { attribute: 'dexterity', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 6
  {
    id: 'commander-fit-for-any-battlefield-2',
    level: 6,
    type: 'pick_feature_from_pool',
    name: 'Fit for Any Battlefield (2)',
    description: 'Choose another Combat Ability or gain +1 max Combat Dice.',
    poolId: 'combat-tactics-pool',
    choicesAllowed: 1
  },
  {
    id: 'commander-weapon-mastery-1',
    level: 6,
    type: 'pick_feature_from_pool',
    name: 'Weapon Mastery',
    description: 'You may sheathe a weapon and draw a different one 2×/round for free. Choose a weapon type to specialize in.',
    poolId: 'weapon-mastery-pool',
    choicesAllowed: 1
  },
  // Level 7
  {
    id: 'commander-subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Commander subclass feature.',
    category: 'combat'
  },
  // Level 8
  {
    id: 'commander-fit-for-any-battlefield-3',
    level: 8,
    type: 'pick_feature_from_pool',
    name: 'Fit for Any Battlefield (3)',
    description: 'Choose another Combat Ability or gain +1 max Combat Dice.',
    poolId: 'combat-tactics-pool',
    choicesAllowed: 1
  },
  {
    id: 'commander-key-stat-increase-2',
    level: 8,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or INT',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'intelligence', amount: 1 }
    ]  // Player chooses one
  },
  // Level 9
  {
    id: 'commander-master-commander-2',
    level: 9,
    type: 'passive_feature',
    name: 'Master Commander (2)',
    description: '+1 use of Coordinated Strike/Safe Rest.',
    category: 'combat'
  },
  {
    id: 'commander-combat-tactics-dice-2',
    level: 9,
    type: 'passive_feature',
    name: 'Combat Tactics (2)',
    description: 'Your Combat Dice are now d10s.',
    category: 'combat'
  },
  {
    id: 'commander-secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or WIL',
    statBoosts: [
      { attribute: 'dexterity', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 10
  {
    id: 'commander-fit-for-any-battlefield-4',
    level: 10,
    type: 'pick_feature_from_pool',
    name: 'Fit for Any Battlefield (4)',
    description: 'Choose another Combat Ability or gain +1 max Combat Dice.',
    poolId: 'combat-tactics-pool',
    choicesAllowed: 1
  },
  {
    id: 'commander-weapon-mastery-2',
    level: 10,
    type: 'pick_feature_from_pool',
    name: 'Weapon Mastery (2)',
    description: 'Choose a 2nd weapon type to specialize in.',
    poolId: 'weapon-mastery-pool',
    choicesAllowed: 1
  },
  // Level 11
  {
    id: 'commander-subclass-feature-11',
    level: 11,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Commander subclass feature.',
    category: 'combat'
  },
  // Level 12
  {
    id: 'commander-fit-for-any-battlefield-5',
    level: 12,
    type: 'pick_feature_from_pool',
    name: 'Fit for Any Battlefield (5)',
    description: 'Choose another Combat Ability or gain +1 max Combat Dice.',
    poolId: 'combat-tactics-pool',
    choicesAllowed: 1
  },
  {
    id: 'commander-key-stat-increase-3',
    level: 12,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or INT',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'intelligence', amount: 1 }
    ]  // Player chooses one
  },
  // Level 13
  {
    id: 'commander-master-commander-3',
    level: 13,
    type: 'passive_feature',
    name: 'Master Commander (3)',
    description: '+1 use of Coordinated Strike/Safe Rest.',
    category: 'combat'
  },
  {
    id: 'commander-combat-tactics-dice-3',
    level: 13,
    type: 'passive_feature',
    name: 'Combat Tactics (3)',
    description: 'Your Combat Dice are now d12s.',
    category: 'combat'
  },
  {
    id: 'commander-secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or WIL',
    statBoosts: [
      { attribute: 'dexterity', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 14
  {
    id: 'commander-weapon-mastery-3',
    level: 14,
    type: 'passive_feature',
    name: 'Weapon Mastery (3)',
    description: 'You have complete mastery of all weapon types.',
    category: 'combat'
  },
  // Level 15
  {
    id: 'commander-subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Commander subclass feature.',
    category: 'combat'
  },
  // Level 16
  {
    id: 'commander-fit-for-any-battlefield-6',
    level: 16,
    type: 'pick_feature_from_pool',
    name: 'Fit for Any Battlefield (6)',
    description: 'Choose another Combat Ability or gain +1 max Combat Dice.',
    poolId: 'combat-tactics-pool',
    choicesAllowed: 1
  },
  {
    id: 'commander-key-stat-increase-4',
    level: 16,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or INT',
    statBoosts: [
      { attribute: 'strength', amount: 1 },
      { attribute: 'intelligence', amount: 1 }
    ]  // Player chooses one
  },
  // Level 17
  {
    id: 'commander-master-commander-4',
    level: 17,
    type: 'passive_feature',
    name: 'Master Commander (4)',
    description: '+1 use of Coordinated Strike/Safe Rest.',
    category: 'combat'
  },
  {
    id: 'commander-combat-tactics-dice-4',
    level: 17,
    type: 'passive_feature',
    name: 'Combat Tactics (4)',
    description: 'Your Combat Dice are now d20s.',
    category: 'combat'
  },
  {
    id: 'commander-secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or WIL',
    statBoosts: [
      { attribute: 'dexterity', amount: 1 },
      { attribute: 'will', amount: 1 }
    ]  // Player chooses one
  },
  // Level 18
  {
    id: 'commander-unparalleled-tactics',
    level: 18,
    type: 'passive_feature',
    name: 'Unparalleled Tactics',
    description: 'The first time each encounter you use Coordinated Strike, an ally who can hear you also gains 1 action to use on their next turn.',
    category: 'combat'
  },
  // Level 19
  {
    id: 'commander-epic-boon',
    level: 19,
    type: 'passive_feature',
    name: 'Epic Boon',
    description: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
    category: 'utility'
  },
  // Level 20
  {
    id: 'commander-captain-of-legions',
    level: 20,
    type: 'passive_feature',
    name: 'Captain of Legions',
    description: '+1 to any 2 of your stats. The first time each encounter you use Coordinated Strike, EVERY ally within 12 spaces gains +1 action (replaces Unparalleled Tactics).',
    category: 'combat'
  }
];

// Rigorous Training feature
const rigorousTraining: ClassFeature = {
  id: 'commander-rigorous-training',
  level: 1,
  type: 'passive_feature',
  name: 'Rigorous Training',
  description: 'Whenever you train with your party or other soldiers during a Safe Rest, you may choose different Commander options available to you.',
  category: 'utility'
};

export const commanderClass: ClassDefinition = {
  id: 'commander',
  name: 'Commander',
  description: 'A tactical leader who excels at coordinating allies and controlling the battlefield. Commanders inspire their allies and create opportunities through superior tactics and teamwork.',
  hitDieSize: 10,
  keyAttributes: ['strength', 'intelligence'],
  startingHP: 17,
  armorProficiencies: [
    { type: 'mail' },
    { type: 'shields' }
  ],
  weaponProficiencies: [
    { type: 'freeform', name: 'All Martial Weapons' }
  ],
  saveAdvantages: {
    strength: 'advantage',
    dexterity: 'disadvantage'
  },
  startingEquipment: [
    'hand-axe',
    'javelins-4',
    'rusty-mail'
  ],
  features: [
    ...commanderFeatures,
    rigorousTraining
  ],
  featurePools: [
    {
      id: 'commanders-orders-pool',
      name: "Commander's Orders",
      description: 'Tactical commands that Commanders can issue to coordinate their allies.',
      features: commandersOrdersFeatures
    },
    {
      id: 'combat-tactics-pool',
      name: 'Combat Tactics',
      description: 'Special combat maneuvers that Commanders can perform using Combat Dice.',
      features: combatTacticsFeatures
    },
    {
      id: 'weapon-mastery-pool',
      name: 'Weapon Mastery',
      description: 'Specialized weapon techniques for different damage types.',
      features: weaponMasteryFeatures
    }
  ]
};