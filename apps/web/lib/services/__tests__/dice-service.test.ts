import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Character } from "../../schemas/character";
import { diceService } from "../dice-service";
import { getCharacterService, getClassService } from "../service-factory";

// Mock the @nimble/dice module
vi.mock("@nimble/dice", () => ({
  evaluateDiceFormula: vi.fn(),
  diceTypeSchema: {},
  diceCategorySchema: {},
  categorizedDieSchema: {},
  diceRollDataSchema: {},
}));

// Mock the character service and class service
vi.mock("../service-factory", () => ({
  getCharacterService: vi.fn(),
  getClassService: vi.fn(),
}));

describe("DiceService", () => {
  const mockCharacter: Partial<Character> = {
    level: 5,
    _attributes: {
      strength: 3,
      dexterity: 2,
      intelligence: 1,
      will: 4,
    },
  };

  let mockEvaluateDiceFormula: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked function
    const nimbleDice = await import("@nimble/dice");
    mockEvaluateDiceFormula = nimbleDice.evaluateDiceFormula as any;

    // Setup character service mock
    (getCharacterService as any).mockReturnValue({
      getCurrentCharacter: () => mockCharacter,
      getAttributes: () => ({
        strength: 3,
        dexterity: 2,
        intelligence: 1,
        will: 4,
      }),
    });

    // Setup class service mock (return null for no class)
    (getClassService as any).mockReturnValue({
      getCharacterClass: () => null,
    });
  });

  describe("Basic dice formulas", () => {
    it("should evaluate a simple dice formula", () => {
      // Mock the base dice service response
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[2] + [1] + [4] + 2",
        total: 9,
        formula: "3d6 + 2",
        diceData: {
          dice: [
            { value: 2, size: 6, kept: true, category: "normal", index: 0 },
            { value: 1, size: 6, kept: true, category: "normal", index: 1 },
            { value: 4, size: 6, kept: true, category: "normal", index: 2 },
          ],
          total: 9,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("3d6 + 2");

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("3d6 + 2", {});
      expect(result.displayString).toBe("[2] + [1] + [4] + 2");
      expect(result.total).toBe(9);
      expect(result.formula).toBe("3d6 + 2");
      expect(result.diceData?.dice).toHaveLength(3);
      expect(result.diceData?.total).toBe(9);
    });

    it("should handle d6 as 1d6", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[4] + 3",
        total: 7,
        formula: "d6 + 3",
        diceData: {
          dice: [{ value: 4, size: 6, kept: true, category: "normal", index: 0 }],
          total: 7,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("d6 + 3");

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("d6 + 3", {});
      expect(result.displayString).toBe("[4] + 3");
      expect(result.total).toBe(7);
    });

    it("should evaluate complex expressions", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "([3] + [5]) * 2 + 4",
        total: 20,
        formula: "(2d6) * 2 + 4",
        diceData: {
          dice: [
            { value: 3, size: 6, kept: true, category: "normal", index: 0 },
            { value: 5, size: 6, kept: true, category: "normal", index: 1 },
          ],
          total: 20,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("(2d6) * 2 + 4");

      expect(result.total).toBe(20);
      expect(result.diceData?.dice).toHaveLength(2);
    });
  });

  describe("Variable substitution", () => {
    it("should substitute attribute variables", () => {
      // STR = 3, so 3d6
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[2] + [4] + [6] + 4",
        total: 16,
        formula: "3d6 + WIL",
        substitutedFormula: "3d6 + 4",
        diceData: {
          dice: [
            { value: 2, size: 6, kept: true, category: "normal", index: 0 },
            { value: 4, size: 6, kept: true, category: "normal", index: 1 },
            { value: 6, size: 6, kept: true, category: "normal", index: 2 },
          ],
          total: 16,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("STRd6 + WIL");

      // Should be called with substituted formula
      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("3d6 + 4", {});
      expect(result.substitutedFormula).toBe("3d6 + 4");
      expect(result.total).toBe(16);
    });

    it("should handle level substitution", () => {
      // LEVEL = 5, so 5d4
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[2] + [3] + [4] + [1] + [2]",
        total: 12,
        formula: "LEVELd4",
        substitutedFormula: "5d4",
        diceData: {
          dice: [
            { value: 2, size: 4, kept: true, category: "normal", index: 0 },
            { value: 3, size: 4, kept: true, category: "normal", index: 1 },
            { value: 4, size: 4, kept: true, category: "normal", index: 2 },
            { value: 1, size: 4, kept: true, category: "normal", index: 3 },
            { value: 2, size: 4, kept: true, category: "normal", index: 4 },
          ],
          total: 12,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("LEVELd4");

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("5d4", {});
      expect(result.substitutedFormula).toBe("5d4");
      expect(result.total).toBe(12);
    });
  });

  describe("Advantage and disadvantage", () => {
    it("should handle advantage correctly", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "~~[2]~~ + ~~[1]~~ + [4] + [5] + [5] + [6]",
        total: 20,
        formula: "2d6",
        diceData: {
          dice: [
            { value: 4, size: 6, kept: true, category: "normal", index: 0 },
            { value: 2, size: 6, kept: false, category: "dropped", index: 1 },
            { value: 5, size: 6, kept: true, category: "normal", index: 2 },
            { value: 1, size: 6, kept: false, category: "dropped", index: 3 },
            { value: 5, size: 6, kept: true, category: "normal", index: 4 },
            { value: 6, size: 6, kept: true, category: "normal", index: 5 },
          ],
          total: 20,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 1,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("2d6", { advantageLevel: 1 });

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("2d6", { advantageLevel: 1 });
      expect(result.total).toBe(20);
      expect(result.diceData?.advantageLevel).toBe(1);
    });

    it("should handle disadvantage correctly", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[2] + ~~[4]~~ + [1] + ~~[5]~~",
        total: 3,
        formula: "2d6",
        diceData: {
          dice: [
            { value: 4, size: 6, kept: false, category: "dropped", index: 0 },
            { value: 2, size: 6, kept: true, category: "normal", index: 1 },
            { value: 5, size: 6, kept: false, category: "dropped", index: 2 },
            { value: 1, size: 6, kept: true, category: "normal", index: 3 },
          ],
          total: 3,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: -1,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("2d6", { advantageLevel: -1 });

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("2d6", { advantageLevel: -1 });
      expect(result.total).toBe(3);
      expect(result.diceData?.advantageLevel).toBe(-1);
    });
  });

  describe("Critical hits and fumbles", () => {
    it("should handle exploding criticals", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[6] + [6] + [3]",
        total: 15,
        formula: "1d6",
        diceData: {
          dice: [
            { value: 6, size: 6, kept: true, category: "normal", index: 0 },
            { value: 6, size: 6, kept: true, category: "critical", index: 1 },
            { value: 3, size: 6, kept: true, category: "critical", index: 2 },
          ],
          total: 15,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 2,
        },
      });

      const result = diceService.evaluateDiceFormula("1d6", { allowCriticals: true });

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("1d6", { allowCriticals: true });
      expect(result.total).toBe(15);
      expect(result.diceData?.criticalHits).toBe(2);
    });

    it("should handle fumbles on d20", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[1]",
        total: 0,
        formula: "1d20",
        diceData: {
          dice: [{ value: 1, size: 20, kept: true, category: "fumble", index: 0 }],
          total: 0,
          isDoubleDigit: false,
          isFumble: true,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("1d20", { allowFumbles: true });

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("1d20", { allowFumbles: true });
      expect(result.total).toBe(0);
      expect(result.diceData?.isFumble).toBe(true);
    });
  });

  describe("Double-digit dice", () => {
    it("should roll d44 correctly", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[3] [2] = 32",
        total: 32,
        formula: "1d44",
        diceData: {
          dice: [
            { value: 3, size: 4, kept: true, category: "normal", index: 0 },
            { value: 2, size: 4, kept: true, category: "normal", index: 1 },
          ],
          total: 32,
          isDoubleDigit: true,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("1d44");

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("1d44", {});
      expect(result.total).toBe(32);
      expect(result.diceData?.isDoubleDigit).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should throw on invalid dice types", () => {
      mockEvaluateDiceFormula.mockImplementation(() => {
        throw new Error("Invalid dice type: d7");
      });

      expect(() => diceService.evaluateDiceFormula("1d7")).toThrowError(
        'Failed to evaluate dice formula "1d7"',
      );
    });

    it("should throw on zero dice count", () => {
      mockEvaluateDiceFormula.mockImplementation(() => {
        throw new Error("Invalid dice count: 0. Must be positive.");
      });

      expect(() => diceService.evaluateDiceFormula("0d6")).toThrowError(
        'Failed to evaluate dice formula "0d6"',
      );
    });

    it("should throw on negative dice count after substitution", () => {
      // Mock character with negative strength
      (getCharacterService as any).mockReturnValue({
        getCurrentCharacter: () => ({
          ...mockCharacter,
          _attributes: { ...mockCharacter._attributes, strength: -1 },
        }),
        getAttributes: () => ({
          strength: -1,
          dexterity: 2,
          intelligence: 1,
          will: 4,
        }),
      });

      mockEvaluateDiceFormula.mockImplementation(() => {
        throw new Error("Invalid dice count: -1. Must be positive.");
      });

      expect(() => diceService.evaluateDiceFormula("STRd6")).toThrowError(
        'Failed to evaluate dice formula "STRd6"',
      );
    });

    it("should support formulas with no dice notation", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "3 + 4 = 7",
        total: 7,
        formula: "3 + 4",
        diceData: {
          dice: [],
          total: 7,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 0,
        },
      });

      const result = diceService.evaluateDiceFormula("3 + 4");

      expect(result.total).toBe(7);
      expect(result.diceData?.dice).toHaveLength(0);
    });
  });

  describe("Postfix modifiers (! and v)", () => {
    it("should handle exploding criticals with ! postfix", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[6] + [6] + [4]",
        total: 16,
        formula: "1d6!",
        diceData: {
          dice: [
            { value: 6, size: 6, kept: true, category: "normal", index: 0 },
            { value: 6, size: 6, kept: true, category: "critical", index: 1 },
            { value: 4, size: 6, kept: true, category: "critical", index: 2 },
          ],
          total: 16,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 2,
        },
      });

      const result = diceService.evaluateDiceFormula("1d6!");

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("1d6!", {});
      expect(result.total).toBe(16);
      expect(result.diceData?.criticalHits).toBe(2);
    });

    it("should handle vicious with v postfix", () => {
      mockEvaluateDiceFormula.mockReturnValue({
        displayString: "[6] + [3]",
        total: 9,
        formula: "1d6v",
        diceData: {
          dice: [
            { value: 6, size: 6, kept: true, category: "normal", index: 0 },
            { value: 3, size: 6, kept: true, category: "vicious", index: 1 },
          ],
          total: 9,
          isDoubleDigit: false,
          isFumble: false,
          advantageLevel: 0,
          criticalHits: 1,
        },
      });

      const result = diceService.evaluateDiceFormula("1d6v");

      expect(mockEvaluateDiceFormula).toHaveBeenCalledWith("1d6v", {});
      expect(result.total).toBe(9);
      expect(result.diceData?.criticalHits).toBe(1);
    });
  });
});
