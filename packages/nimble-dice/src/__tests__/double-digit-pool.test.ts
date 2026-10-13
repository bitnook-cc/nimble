import { describe, expect, it, vi } from "vitest";
import { DiceService, calculateAverageDamage, generateHistogram } from "../index";

const kinds = [44, 66, 88, 100];
function fixture(values: number[]) {
  const service = new DiceService();
  const roll = vi.spyOn(
    service as unknown as { rollSingleDie(sides: number): number },
    "rollSingleDie",
  );
  for (const value of values) roll.mockReturnValueOnce(value);
  return { service, roll };
}

describe.each(kinds)("d%i shared digit pool", (sides) => {
  const base = sides === 100 ? 10 : sides / 11;
  it.each([
    { advantage: 0, rolls: [2, 4], kept: [2, 4], total: 24 },
    { advantage: 1, rolls: [2, 4, 1], kept: [2, 4], total: 24 },
    { advantage: -1, rolls: [4, 1, 3], kept: [1, 3], total: 13 },
    { advantage: 2, rolls: [2, 4, 1, 3], kept: [4, 3], total: 43 },
    { advantage: -2, rolls: [4, 1, 3, 2], kept: [1, 2], total: 12 },
  ])(
    "retains chronological digit order at advantage $advantage",
    ({ advantage, rolls, kept, total }) => {
      const { service, roll } = fixture(rolls);
      const result = service.evaluateDiceFormula(`1d${sides}`, { advantageLevel: advantage });
      const token = result.tokens.find((t) => t.type === "dice")!;
      expect(result.total).toBe(total);
      expect(roll).toHaveBeenCalledTimes(2 + Math.abs(advantage));
      expect(roll.mock.calls.every(([size]) => size === base)).toBe(true);
      expect(token.diceData.isDoubleDigit).toBe(true);
      expect(token.diceData.dice.map((d) => d.value)).toEqual(rolls);
      expect(token.diceData.dice.filter((d) => d.kept).map((d) => d.value)).toEqual(kept);
      expect(token.diceData.dice.filter((d) => !d.kept)).toHaveLength(Math.abs(advantage));
      expect(token.diceData.dice.map((d) => d.index)).toEqual(rolls.map((_, i) => i));
      expect(token.diceData.dice.every((d) => d.category === (d.kept ? "normal" : "dropped"))).toBe(
        true,
      );
    },
  );

  it.each(["a", "a1"])("postfix %s overrides a disadvantage option", (postfix) => {
    const { service, roll } = fixture([2, 4, 1]);
    expect(service.evaluateDiceFormula(`d${sides}${postfix}+5`, { advantageLevel: -1 }).total).toBe(
      29,
    );
    expect(roll).toHaveBeenCalledTimes(3);
  });
  it.each(["d", "d1"])("postfix %s overrides an advantage option", (postfix) => {
    const { service, roll } = fixture([4, 1, 3]);
    expect(service.evaluateDiceFormula(`d${sides}${postfix}+5`, { advantageLevel: 1 }).total).toBe(
      18,
    );
    expect(roll).toHaveBeenCalledTimes(3);
  });
  it.each([
    { advantage: 1, rolls: [1, 4, 1], keptIndices: [1, 2] },
    { advantage: -1, rolls: [4, 1, 4], keptIndices: [0, 1] },
  ])(
    "ties discard one die consistently at advantage $advantage",
    ({ advantage, rolls, keptIndices }) => {
      const { service } = fixture(rolls);
      const result = service.evaluateDiceFormula(`d${sides}`, { advantageLevel: advantage });
      const token = result.tokens.find((t) => t.type === "dice")!;
      expect(token.diceData.dice.filter((d) => d.kept).map((d) => d.index)).toEqual(keptIndices);
      expect(result.total).toBe(41);
    },
  );
  it.each([-10, 10])("stacked advantage %i still keeps just two digits", (advantageLevel) => {
    const { service, roll } = fixture(Array(12).fill(2));
    const result = service.evaluateDiceFormula(`d${sides}`, { advantageLevel });
    expect(roll).toHaveBeenCalledTimes(12);
    expect(result.total).toBe(22);
    const token = result.tokens.find((t) => t.type === "dice")!;
    expect(token.diceData.dice.filter((d) => d.kept)).toHaveLength(2);
  });
  it("never explodes or fumbles a digit, even with critical/vicious options", () => {
    const { service, roll } = fixture([base, base, 1]);
    const result = service.evaluateDiceFormula(`d${sides}!!va`, {
      allowCriticals: true,
      allowFumbles: true,
      explodeAll: true,
      vicious: true,
    });
    expect(roll).toHaveBeenCalledTimes(3);
    expect(result.isFumble).toBe(false);
    expect(result.numCriticals).toBe(0);
  });
});

describe("percentile digit conventions", () => {
  it.each([
    { raw: [10, 5], digits: [0, 5], total: 5 },
    { raw: [5, 10], digits: [5, 0], total: 50 },
    { raw: [10, 10], digits: [0, 0], total: 100 },
  ])("combines $digits as percentile $total", ({ raw, digits, total }) => {
    const { service } = fixture(raw);
    const result = service.evaluateDiceFormula("1d100");
    expect(result.total).toBe(total);
    expect(result.tokens.find((t) => t.type === "dice")!.diceData.dice.map((d) => d.value)).toEqual(
      digits,
    );
  });
  it.each([
    { advantageLevel: 1, total: 24 },
    { advantageLevel: -1, total: 2 },
  ])(
    "compares zero as the lowest digit at advantage $advantageLevel",
    ({ advantageLevel, total }) => {
      const { service, roll } = fixture([10, 2, 4]);
      expect(service.evaluateDiceFormula("d100", { advantageLevel }).total).toBe(total);
      expect(roll).toHaveBeenCalledTimes(3);
    },
  );
  it("continues to support multiple percentiles and formats each digit pair", () => {
    const { service, roll } = fixture([10, 10, 10, 5]);
    const result = service.evaluateDiceFormula("2d100+5");
    expect(result.total).toBe(110);
    expect(result.displayString).toContain("[0] [0] + [0] [5]");
    expect(roll).toHaveBeenCalledTimes(4);
  });
  it("uses a separate shared pool per percentile when rolling multiple results", () => {
    const { service, roll } = fixture([2, 4, 1, 4, 1, 3]);
    expect(service.evaluateDiceFormula("2d100a").total).toBe(24 + 43);
    expect(roll).toHaveBeenCalledTimes(6);
  });
});

describe("double-digit analytics", () => {
  // Exact expectations from enumerating all 3-/4-digit pools and retaining
  // their original order, including ties and percentile 00 = 100.
  it.each([
    [44, 23.0, 33.4, 19.9, 36.5],
    [66, 31.2, 47.3, 26.3, 52.1],
    [88, 39.4, 61.1, 32.9, 67.6],
    [100, 39.4, 64.0, 33.7, 72.1],
  ])(
    "d%i averages match shared pools in normal and Nimble modes",
    (sides, disadvantage, advantage, doubleDisadvantage, doubleAdvantage) => {
      for (const nimble of [false, true]) {
        expect(calculateAverageDamage(`d${sides}d`, nimble)).toBe(disadvantage);
        expect(calculateAverageDamage(`d${sides}a`, nimble)).toBe(advantage);
        expect(calculateAverageDamage(`d${sides}d2`, nimble)).toBe(doubleDisadvantage);
        expect(calculateAverageDamage(`d${sides}a2`, nimble)).toBe(doubleAdvantage);
      }
    },
  );
  it("sums averages for multiple independent percentile pools", () => {
    expect(calculateAverageDamage("2d100a+5")).toBe(132.9);
  });
  it("histograms use three underlying rolls per advantaged number", () => {
    const roll = vi.spyOn(Math, "random").mockReturnValue(0.45);
    try {
      const result = generateHistogram("1d100a", {}, 20);
      expect(result?.buckets).toEqual([{ value: 55, count: 20, percentage: 100 }]);
      expect(roll).toHaveBeenCalledTimes(60);
    } finally {
      roll.mockRestore();
    }
  });
});
