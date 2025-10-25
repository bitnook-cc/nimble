#!/usr/bin/env tsx
/**
 * Damage Calculator Script
 * Simulates 10,000 attack rolls per weapon type against different armor types
 * Uses the dice service to account for exploding crits and fumbles
 */
import { evaluateDiceFormula } from "@nimble/dice";

const ITERATIONS = 10000;
const MODIFIER = 4;

type WeaponType = "1d4" | "1d6" | "1d8" | "1d10" | "1d12";
type ArmorType = "unarmored" | "medium" | "heavy";

interface DamageResults {
  weapon: WeaponType;
  unarmored: number;
  medium: number;
  heavy: number;
}

function calculateDamage(
  diceResult: number,
  modifier: number,
  armorType: ArmorType,
  isFumble: boolean,
  isCritical: boolean,
): number {
  // Fumbles always deal 0 damage
  if (isFumble) {
    return 0;
  }

  // Critical hits bypass armor entirely
  if (isCritical) {
    return diceResult + modifier;
  }

  switch (armorType) {
    case "unarmored":
      return diceResult + modifier;
    case "medium":
      return diceResult;
    case "heavy":
      return Math.floor((diceResult + modifier) / 2);
  }
}

function simulateWeapon(weapon: WeaponType): DamageResults {
  let totalUnarmored = 0;
  let totalMedium = 0;
  let totalHeavy = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    // Roll using the dice service with criticals and fumbles enabled
    const result = evaluateDiceFormula(weapon, {
      allowCriticals: true,
      allowFumbles: true,
    });

    const diceTotal = result.total;
    const isFumble = result.isFumble;
    const isCritical = (result.numCriticals || 0) > 0;

    totalUnarmored += calculateDamage(diceTotal, MODIFIER, "unarmored", isFumble, isCritical);
    totalMedium += calculateDamage(diceTotal, MODIFIER, "medium", isFumble, isCritical);
    totalHeavy += calculateDamage(diceTotal, MODIFIER, "heavy", isFumble, isCritical);
  }

  return {
    weapon,
    unarmored: totalUnarmored / ITERATIONS,
    medium: totalMedium / ITERATIONS,
    heavy: totalHeavy / ITERATIONS,
  };
}

function main() {
  const weapons: WeaponType[] = ["1d4", "1d6", "1d8", "1d10", "1d12"];
  const results: DamageResults[] = [];

  console.log(
    `\nDamage Simulation (${ITERATIONS.toLocaleString()} rolls per weapon, +${MODIFIER} modifier)`,
  );
  console.log("Includes exploding criticals and fumbles (nat 1 = 0 damage)\n");

  for (const weapon of weapons) {
    results.push(simulateWeapon(weapon));
  }

  // Print table header
  console.log("┌────────┬───────────┬────────┬────────┐");
  console.log("│ Weapon │ Unarmored │ Medium │ Heavy  │");
  console.log("├────────┼───────────┼────────┼────────┤");

  // Print results
  for (const result of results) {
    console.log(
      `│ ${result.weapon.padEnd(6)} │ ${result.unarmored.toFixed(2).padStart(9)} │ ${result.medium.toFixed(2).padStart(6)} │ ${result.heavy.toFixed(2).padStart(6)} │`,
    );
  }

  console.log("└────────┴───────────┴────────┴────────┘\n");
}

main();
