export interface SkillDefinition {
  name: string;
  label: string;
  attribute: 'strength' | 'dexterity' | 'intelligence' | 'will';
}

export interface GameConfig {
  dice: {
    maxCriticalHitsInRow: number;
  };
  combat: {
    criticalHitOnMaxRoll: boolean;
    missOnFirstDieOne: boolean;
  };
  character: {
    attributeRange: {
      min: number;
      max: number;
    };
    skillModifierRange: {
      min: number;
      max: number;
    };
    initialSkillPoints: number;
    defaultSpeed: number;
  };
  skills: SkillDefinition[];
  storage: {
    maxRollHistory: number;
  };
  equipment: {
    maxWeaponSize: number;
  };
  defaults: {
    classId: string;
    ancestryId: string;
    backgroundId: string;
  };
}

export const gameConfig: GameConfig = {
  dice: {
    maxCriticalHitsInRow: 20,
  },
  combat: {
    criticalHitOnMaxRoll: true,
    missOnFirstDieOne: true,
  },
  character: {
    attributeRange: {
      min: -2,
      max: 10,
    },
    skillModifierRange: {
      min: 0,
      max: 12,
    },
    initialSkillPoints: 4,
    defaultSpeed: 6,
  },
  skills: [
    { name: 'arcana', label: 'Arcana', attribute: 'intelligence' },
    { name: 'examination', label: 'Examination', attribute: 'intelligence' },
    { name: 'finesse', label: 'Finesse', attribute: 'dexterity' },
    { name: 'influence', label: 'Influence', attribute: 'will' },
    { name: 'insight', label: 'Insight', attribute: 'will' },
    { name: 'might', label: 'Might', attribute: 'strength' },
    { name: 'lore', label: 'Lore', attribute: 'intelligence' },
    { name: 'naturecraft', label: 'Naturecraft', attribute: 'will' },
    { name: 'perception', label: 'Perception', attribute: 'will' },
    { name: 'stealth', label: 'Stealth', attribute: 'dexterity' },
  ],
  storage: {
    maxRollHistory: 100,
  },
  equipment: {
    maxWeaponSize: 2,
  },
  defaults: {
    classId: 'cheat',
    ancestryId: 'goblin',
    backgroundId: 'former-con-artist',
  },
};