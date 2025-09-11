import { SaveAdvantageType } from "../schemas/character";

/**
 * Helper function to combine global advantage level with permanent save advantage
 */
export function combineAdvantages(
  globalAdvantageLevel: number,
  saveAdvantage: SaveAdvantageType,
): number {
  let permanentAdvantage = 0;

  switch (saveAdvantage) {
    case "advantage":
      permanentAdvantage = 1;
      break;
    case "disadvantage":
      permanentAdvantage = -1;
      break;
    default:
      permanentAdvantage = 0;
  }

  // Combine global and permanent advantages (no clamping to allow advantage 2+)
  return globalAdvantageLevel + permanentAdvantage;
}
