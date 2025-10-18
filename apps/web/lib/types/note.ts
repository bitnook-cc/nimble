export interface DiceRoll {
  id: string;
  name: string;
  formula: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
  diceRolls: DiceRoll[];
}
