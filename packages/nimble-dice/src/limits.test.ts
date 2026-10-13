import { describe, it, expect } from "vitest";
import { DiceService, generateHistogram } from "./index.js";
const dice = new DiceService();
describe("dice resource limits", () => {
  it.each(["101d6", "60d6+41d6", "1d6a11", "1d6d11", "999999999999d6", "51d66"])(
    "rejects oversized formula %s",
    (formula) => expect(() => dice.evaluateDiceFormula(formula)).toThrow(),
  );
  it("accepts rolls at the dice and advantage limits", () => {
    expect(dice.evaluateDiceFormula("100d6").tokens).toHaveLength(1);
    expect(() => dice.evaluateDiceFormula("1d20a10")).not.toThrow();
  });
  it.each([Infinity, NaN, 0.5, 11, -11])("rejects invalid advantage %s", (advantageLevel) =>
    expect(() => dice.evaluateDiceFormula("1d6", { advantageLevel })).toThrow(),
  );
  it("limits supplied tokens as well as parsed formulas", () => {
    const tokens = dice.tokenize("1d6");
    expect(() => dice.evaluateTokenizedFormula(Array(101).fill(tokens[0]))).toThrow();
  });
  it("counts underlying digit dice, including stacked advantage", () => {
    expect(dice.validateRoll(dice.tokenize("1d66a"))).toBe(3);
    expect(dice.validateRoll(dice.tokenize("1d88d2"))).toBe(4);
    expect(dice.validateRoll(dice.tokenize("1d100a10"))).toBe(12);
    expect(dice.validateRoll(dice.tokenize("33d100a"))).toBe(99);
    expect(() => dice.tokenize("34d100a")).toThrow("at most 100 dice");
    expect(() => dice.tokenize("51d100")).toThrow("at most 100 dice");
  });
  it("validates single-only digit dice before rolling any expression token", () => {
    expect(() => dice.tokenize("1d6+2d44")).toThrow("can only be rolled one at a time");
  });
  it("bounds histogram samples and total work", () => {
    expect(generateHistogram("1d6", {}, 100001)).toBeNull();
    expect(generateHistogram("100d6", {}, 100000)).toBeNull();
    expect(generateHistogram("1d6", {}, -1)).toBeNull();
  });
  it("rejects very long formulas before parsing", () =>
    expect(() => dice.tokenize("1+".repeat(501))).toThrow());
});
