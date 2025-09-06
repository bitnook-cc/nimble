export type DiceType = 4 | 6 | 8 | 10 | 12 | 20 | 66 | 100;

export interface DiceExpression {
  count: number; // number of dice
  sides: DiceType; // type of dice
}
