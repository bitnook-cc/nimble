import { afterEach, describe, expect, it, vi } from "vitest";
import { addDieToFormula, roll } from "./rolls";
afterEach(() => vi.restoreAllMocks());
describe("adding dice to formulas", () => {
  it.each([
    ["", 8, "1d8"],
    ["1d8", 8, "2d8"],
    ["2d8", 8, "3d8"],
    ["d8", 8, "2d8"],
    ["2D8+3", 8, "3D8+3"],
    ["1d6 + 2d8 - 3", 8, "1d6 + 3d8 - 3"],
    ["1d8 + 1d8", 8, "2d8 + 1d8"],
    ["1d80", 8, "1d80 + 1d8"],
    ["2d8! + 3", 8, "2d8! + 3 + 1d8"],
    ["1d8v + 1d8a2", 8, "1d8v + 1d8a2 + 1d8"],
    ["3 - 1d8", 8, "3 - 1d8 + 1d8"],
    ["-1d8", 8, "-1d8 + 1d8"],
    ["1d8 * 2", 8, "1d8 * 2 + 1d8"],
    ["2 / 1d8", 8, "2 / 1d8 + 1d8"],
    ["2 * (1d8 + 1d8)", 8, "2 * (1d8 + 1d8) + 1d8"],
    ["2 * (1d8) + 1d8", 8, "2 * (1d8) + 2d8"],
    ["1d8 + ", 8, "1d8 + 1d8"],
    ["1d8 * ", 8, "1d8 * 1d8"],
  ])(
    "updates %s with d%s without changing other terms",
    (formula, sides, expected) => {
      expect(addDieToFormula(formula, sides)).toBe(expected);
    },
  );
});
describe("shared dice engine adapter", () => {
  it("retains individual dice and arithmetic without attack rules by default", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const entry = roll("2d6+3", { allowFumbles: false, allowCriticals: false });
    expect(entry.result.total).toBe(5);
    expect(entry.result.tokens[0].type).toBe("dice");
    expect(entry.formula).toBe("2d6+3");
  });
  it("retains discarded advantage dice", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.9);
    const entry = roll("1d20", { advantageLevel: 1 });
    const token = entry.result.tokens[0];
    if (token.type !== "dice") throw new Error("No dice");
    expect(token.diceData.dice).toHaveLength(2);
    expect(token.diceData.dice.filter((d) => !d.kept)).toHaveLength(1);
  });
  it("rejects unsupported notation, unresolved variables, and skipped characters", () => {
    for (const formula of ["1d3", "1d6 + STR", "", "1d6@2", "1d6_2"])
      expect(() => roll(formula, {})).toThrow();
  });
  it("keeps options and immutable result IDs for future delivery", () => {
    const options = { advantageLevel: 1 };
    const entry = roll("1d20", options);
    options.advantageLevel = 0;
    expect(entry.options.advantageLevel).toBe(1);
    expect(roll("1d20", {}).id).not.toBe(entry.id);
  });
});
