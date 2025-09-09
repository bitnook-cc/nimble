import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Character } from "../../schemas/character";
import { diceFormulaService } from "../dice-formula-service";
import { diceService } from "../dice-service";
import { getCharacterService } from "../service-factory";

// Mock the dice service
vi.mock("../dice-service", () => ({
  diceService: {
    rollSingleDie: vi.fn(),
  },
}));

// Mock the character service
vi.mock("../service-factory", () => ({
  getCharacterService: vi.fn(),
}));

describe("DiceFormulaService", () => {
  const mockCharacter: Partial<Character> = {
    level: 5,
    _attributes: {
      strength: 3,
      dexterity: 2,
      intelligence: 1,
      will: 4,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

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
  });

  describe("Basic dice formulas", () => {
    it("should evaluate a simple dice formula", () => {
      // Mock dice rolls: 2, 1, 4
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(4);

      const result = diceFormulaService.evaluateDiceFormula("3d6 + 2");

      expect(result.displayString).toBe("[2] + [1] + [4] + 2");
      expect(result.total).toBe(9); // 2 + 1 + 4 + 2 = 9
      expect(result.formula).toBe("3d6 + 2");
    });

    it("should handle d6 as 1d6", () => {
      (diceService.rollSingleDie as any).mockReturnValueOnce(4);

      const result = diceFormulaService.evaluateDiceFormula("d6 + 3");

      expect(result.displayString).toBe("[4] + 3");
      expect(result.total).toBe(7);
    });

    it("should evaluate complex expressions", () => {
      // Mock dice rolls: 3, 5
      (diceService.rollSingleDie as any).mockReturnValueOnce(3).mockReturnValueOnce(5);

      const result = diceFormulaService.evaluateDiceFormula("(2d6) * 2 + 4");

      expect(result.displayString).toBe("([3] + [5]) * 2 + 4");
      expect(result.total).toBe(20); // (3 + 5) * 2 + 4 = 20
    });
  });

  describe("Variable substitution", () => {
    it("should substitute attribute variables", () => {
      // STR = 3, so 3d6
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(6);

      const result = diceFormulaService.evaluateDiceFormula("STRd6 + WIL");

      expect(result.displayString).toBe("[2] + [4] + [6] + 4");
      expect(result.total).toBe(16); // 2 + 4 + 6 + 4 = 16
      expect(result.substitutedFormula).toBe("3d6 + 4");
    });

    it("should handle level substitution", () => {
      // LEVEL = 5, so 5d4
      for (let i = 0; i < 5; i++) {
        (diceService.rollSingleDie as any).mockReturnValueOnce(2);
      }

      const result = diceFormulaService.evaluateDiceFormula("LEVELd4");

      expect(result.displayString).toBe("[2] + [2] + [2] + [2] + [2]");
      expect(result.total).toBe(10);
      expect(result.substitutedFormula).toBe("5d4");
    });
  });

  describe("Advantage and disadvantage", () => {
    it("should handle advantage correctly", () => {
      // Roll 2d6 with advantage 1 (roll 3 dice, drop lowest)
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(5);

      const result = diceFormulaService.evaluateDiceFormula("2d6", {
        advantageLevel: 1,
      });

      // The 2 should be dropped (lowest), keeping 4 and 5
      expect(result.displayString).toBe("[4] + ~~[2]~~ + [5]");
      expect(result.total).toBe(9); // 4 + 5 = 9
    });

    it("should handle disadvantage correctly", () => {
      // Roll 2d6 with disadvantage 1 (roll 3 dice, drop highest)
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(5);

      const result = diceFormulaService.evaluateDiceFormula("2d6", {
        advantageLevel: -1,
      });

      // The 5 should be dropped (highest), keeping 4 and 2
      expect(result.displayString).toBe("[4] + [2] + ~~[5]~~");
      expect(result.total).toBe(6); // 4 + 2 = 6
    });

    it("should maintain roll order with multiple advantage", () => {
      // Roll 1d6 with advantage 2 (roll 3 dice, drop lowest 2)
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(5);

      const result = diceFormulaService.evaluateDiceFormula("1d6", {
        advantageLevel: 2,
      });

      // The 1 and 3 should be dropped (lowest two), keeping only 5
      expect(result.displayString).toBe("~~[3]~~ + ~~[1]~~ + [5]");
      expect(result.total).toBe(5);
    });
  });

  describe("Critical hits and fumbles", () => {
    it("should handle exploding criticals", () => {
      // Roll 1d6, get a 6 (critical), then 6 again, then 3
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(3); // Normal roll

      const result = diceFormulaService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
      });

      expect(result.displayString).toBe("[6] + [6] + [3]");
      expect(result.total).toBe(15);
    });

    it("should handle vicious on critical hit", () => {
      // Roll 1d6, get a 6 (critical), then 3 (normal), then 4 (vicious)
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Exploding roll (not a crit, so stops)
        .mockReturnValueOnce(4); // Vicious die

      const result = diceFormulaService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [3] + [4]");
      expect(result.total).toBe(13); // 6 + 3 + 4
    });

    it("should handle vicious with multiple exploding crits", () => {
      // Roll 1d6: 6 (crit) -> 6 (exploding crit) -> 2 (normal) -> 5 (vicious)
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(2) // Normal roll (stops exploding)
        .mockReturnValueOnce(5); // Vicious die

      const result = diceFormulaService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [6] + [2] + [5]");
      expect(result.total).toBe(19); // 6 + 6 + 2 + 5
    });

    it("should not add vicious die without critical", () => {
      // Roll 1d6, get a 3 (no critical)
      (diceService.rollSingleDie as any).mockReturnValueOnce(3); // No critical

      const result = diceFormulaService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[3]");
      expect(result.total).toBe(3);
    });

    it("should handle vicious die that rolls max (but doesn't explode)", () => {
      // Roll 1d6: 6 (crit) -> 3 (normal) -> 6 (vicious, max but doesn't explode)
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Normal roll
        .mockReturnValueOnce(6); // Vicious die (max but doesn't explode)

      const result = diceFormulaService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [3] + [6]");
      expect(result.total).toBe(15); // 6 + 3 + 6
      // Note: Only 3 dice total, vicious die doesn't trigger another roll
    });

    it("should handle fumbles", () => {
      // Roll 2d6, first die is 1 (fumble)
      (diceService.rollSingleDie as any).mockReturnValueOnce(1).mockReturnValueOnce(5);

      const result = diceFormulaService.evaluateDiceFormula("2d6 + 3", {
        allowFumbles: true,
      });

      expect(result.displayString).toBe("[1] + [5] + 3");
      expect(result.total).toBe(0); // Fumble results in 0 total
    });

    it("should check first kept die for critical/fumble with advantage", () => {
      // Roll 1d6 with advantage 1, rolls are [2, 6]
      // 2 is dropped, 6 is kept and should trigger critical
      (diceService.rollSingleDie as any)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(6) // This becomes the first kept die
        .mockReturnValueOnce(4); // Exploding roll

      const result = diceFormulaService.evaluateDiceFormula("1d6", {
        advantageLevel: 1,
        allowCriticals: true,
      });

      expect(result.displayString).toBe("~~[2]~~ + [6] + [4]");
      expect(result.total).toBe(10); // 6 + 4
    });
  });

  describe("Error handling", () => {
    it("should throw on invalid dice types", () => {
      expect(() => diceFormulaService.evaluateDiceFormula("3d7")).toThrow("Invalid dice type: d7");
    });

    it("should throw on zero dice count", () => {
      expect(() => diceFormulaService.evaluateDiceFormula("0d6")).toThrow("Invalid dice count: 0");
    });

    it("should throw on negative dice count after substitution", () => {
      // Mock negative attribute
      (getCharacterService as any).mockReturnValue({
        getCurrentCharacter: () => mockCharacter,
        getAttributes: () => ({
          strength: -1,
          dexterity: 2,
          intelligence: 1,
          will: 4,
        }),
      });

      expect(() => diceFormulaService.evaluateDiceFormula("STRd6")).toThrow(
        "Invalid dice count: -1",
      );
    });

    it("should throw on formulas with no dice notation", () => {
      expect(() => diceFormulaService.evaluateDiceFormula("2 + 3")).toThrow(
        "No valid dice notation found",
      );
    });

    it("should throw on potentially unsafe patterns", () => {
      expect(() => diceFormulaService.evaluateDiceFormula("alert('hack')")).toThrow(
        "Potentially unsafe pattern",
      );
    });
  });
});
