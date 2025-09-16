import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Character } from "../../schemas/character";
import { diceService } from "../dice-service";
import { getCharacterService, getClassService } from "../service-factory";

// We'll mock the rollSingleDie method directly on the service instance

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

    // Setup class service mock (return null for no class)
    (getClassService as any).mockReturnValue({
      getCharacterClass: () => null,
    });
  });

  describe("Basic dice formulas", () => {
    it("should evaluate a simple dice formula", () => {
      // Mock dice rolls: 2, 1, 4
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(4);

      const result = diceService.evaluateDiceFormula("3d6 + 2");

      expect(result.displayString).toBe("[2] + [1] + [4] + 2");
      expect(result.total).toBe(9); // 2 + 1 + 4 + 2 = 9
      expect(result.formula).toBe("3d6 + 2");

      // Check diceData
      expect(result.diceData).toBeDefined();
      expect(result.diceData?.dice).toHaveLength(3);
      expect(result.diceData?.dice[0]).toEqual({
        value: 2,
        size: 6,
        kept: true,
        category: "normal",
        index: 0,
      });
      expect(result.diceData?.dice[1]).toEqual({
        value: 1,
        size: 6,
        kept: true,
        category: "normal",
        index: 1,
      });
      expect(result.diceData?.dice[2]).toEqual({
        value: 4,
        size: 6,
        kept: true,
        category: "normal",
        index: 2,
      });
      expect(result.diceData?.total).toBe(9);
    });

    it("should handle d6 as 1d6", () => {
      vi.spyOn(diceService as any, "rollSingleDie").mockReturnValueOnce(4);

      const result = diceService.evaluateDiceFormula("d6 + 3");

      expect(result.displayString).toBe("[4] + 3");
      expect(result.total).toBe(7);
    });

    it("should evaluate complex expressions", () => {
      // Mock dice rolls: 3, 5
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("(2d6) * 2 + 4");

      expect(result.displayString).toBe("([3] + [5]) * 2 + 4");
      expect(result.total).toBe(20); // (3 + 5) * 2 + 4 = 20
    });
  });

  describe("Variable substitution", () => {
    it("should substitute attribute variables", () => {
      // STR = 3, so 3d6
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(6);

      const result = diceService.evaluateDiceFormula("STRd6 + WIL");

      expect(result.displayString).toBe("[2] + [4] + [6] + 4");
      expect(result.total).toBe(16); // 2 + 4 + 6 + 4 = 16
      expect(result.substitutedFormula).toBe("3d6 + 4");
    });

    it("should handle level substitution", () => {
      // LEVEL = 5, so 5d4
      for (let i = 0; i < 5; i++) {
        vi.spyOn(diceService as any, "rollSingleDie").mockReturnValueOnce(2);
      }

      const result = diceService.evaluateDiceFormula("LEVELd4");

      expect(result.displayString).toBe("[2] + [2] + [2] + [2] + [2]");
      expect(result.total).toBe(10);
      expect(result.substitutedFormula).toBe("5d4");
    });
  });

  describe("Advantage and disadvantage", () => {
    it("should handle advantage correctly", () => {
      // Roll 2d6 with advantage 1 (roll 3 dice, drop lowest)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("2d6", {
        advantageLevel: 1,
      });

      // The 2 should be dropped (lowest), keeping 4 and 5
      expect(result.displayString).toBe("[4] + ~~[2]~~ + [5]");
      expect(result.total).toBe(9); // 4 + 5 = 9

      // Check diceData
      expect(result.diceData).toBeDefined();
      expect(result.diceData?.advantageLevel).toBe(1);
      expect(result.diceData?.dice).toHaveLength(3);
      expect(result.diceData?.dice[0]).toMatchObject({ value: 4, kept: true, category: "normal" });
      expect(result.diceData?.dice[1]).toMatchObject({
        value: 2,
        kept: false,
        category: "dropped",
      });
      expect(result.diceData?.dice[2]).toMatchObject({ value: 5, kept: true, category: "normal" });
    });

    it("should handle disadvantage correctly", () => {
      // Roll 2d6 with disadvantage 1 (roll 3 dice, drop highest)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("2d6", {
        advantageLevel: -1,
      });

      // The 5 should be dropped (highest), keeping 4 and 2
      expect(result.displayString).toBe("[4] + [2] + ~~[5]~~");
      expect(result.total).toBe(6); // 4 + 2 = 6
    });

    it("should maintain roll order with multiple advantage", () => {
      // Roll 1d6 with advantage 2 (roll 3 dice, drop lowest 2)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("1d6", {
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
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(3); // Normal roll

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
      });

      expect(result.displayString).toBe("[6] + [6] + [3]");
      expect(result.total).toBe(15);

      // Check diceData
      expect(result.diceData).toBeDefined();
      expect(result.diceData?.criticalHits).toBe(2); // Initial crit + one exploded crit
      expect(result.diceData?.dice).toHaveLength(3);
      expect(result.diceData?.dice[0]).toMatchObject({ value: 6, kept: true, category: "normal" });
      expect(result.diceData?.dice[1]).toMatchObject({
        value: 6,
        kept: true,
        category: "critical",
      });
      expect(result.diceData?.dice[2]).toMatchObject({
        value: 3,
        kept: true,
        category: "critical",
      });
    });

    it("should handle vicious on critical hit", () => {
      // Roll 1d6, get a 6 (critical), then 3 (normal), then 4 (vicious)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Exploding roll (not a crit, so stops)
        .mockReturnValueOnce(4); // Vicious die

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [3] + [4]");
      expect(result.total).toBe(13); // 6 + 3 + 4

      // Check diceData
      expect(result.diceData).toBeDefined();
      expect(result.diceData?.criticalHits).toBe(1); // Only the initial crit
      expect(result.diceData?.dice).toHaveLength(3);
      expect(result.diceData?.dice[0]).toMatchObject({ value: 6, kept: true, category: "normal" });
      expect(result.diceData?.dice[1]).toMatchObject({
        value: 3,
        kept: true,
        category: "critical",
      });
      expect(result.diceData?.dice[2]).toMatchObject({ value: 4, kept: true, category: "vicious" });
    });

    it("should handle vicious with multiple exploding crits", () => {
      // Roll 1d6: 6 (crit) -> 6 (exploding crit) -> 2 (normal) -> 5 (vicious 1) -> 3 (vicious 2)
      // Since we have 2 crits, we should get 2 vicious dice
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(2) // Normal roll (stops exploding)
        .mockReturnValueOnce(5) // First vicious die (for first crit)
        .mockReturnValueOnce(3); // Second vicious die (for second crit)

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [6] + [2] + [5] + [3]");
      expect(result.total).toBe(22); // 6 + 6 + 2 + 5 + 3
    });

    it("should not add vicious die without critical", () => {
      // Roll 1d6, get a 3 (no critical)
      vi.spyOn(diceService as any, "rollSingleDie").mockReturnValueOnce(3); // No critical

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[3]");
      expect(result.total).toBe(3);
    });

    it("should add one vicious die per critical hit", () => {
      // Roll 1d6 with vicious, get 3 exploding crits
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // First exploding critical
        .mockReturnValueOnce(6) // Second exploding critical
        .mockReturnValueOnce(3) // Normal roll (stops exploding)
        .mockReturnValueOnce(5) // First vicious die
        .mockReturnValueOnce(4) // Second vicious die
        .mockReturnValueOnce(2); // Third vicious die

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [6] + [6] + [3] + [5] + [4] + [2]");
      expect(result.total).toBe(32);
      expect(result.diceData?.criticalHits).toBe(3);
      // Verify we have 3 vicious dice
      const viciousDice = result.diceData?.dice.filter((d) => d.category === "vicious");
      expect(viciousDice).toHaveLength(3);
    });

    it("should handle vicious die that rolls max (but doesn't explode)", () => {
      // Roll 1d6: 6 (crit) -> 3 (normal) -> 6 (vicious, max but doesn't explode)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Normal roll
        .mockReturnValueOnce(6); // Vicious die (max but doesn't explode)

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [3] + [6]");
      expect(result.total).toBe(15); // 6 + 3 + 6
      // Note: Only 3 dice total, vicious die doesn't trigger another roll
    });

    it("should handle fumbles on d20", () => {
      // Roll 1d20, first die is 1 (fumble)
      vi.spyOn(diceService as any, "rollSingleDie").mockReturnValueOnce(1);

      const result = diceService.evaluateDiceFormula("1d20 + 3", {
        allowFumbles: true,
      });

      expect(result.displayString).toBe("[1] + 3");
      expect(result.total).toBe(0); // Fumble results in 0 total

      // Check diceData
      expect(result.diceData).toBeDefined();
      expect(result.diceData?.isFumble).toBe(true);
      expect(result.diceData?.dice).toHaveLength(1);
      expect(result.diceData?.dice[0]).toMatchObject({ value: 1, kept: true, category: "fumble" });
    });

    it("should not fumble on non-d20 dice", () => {
      // Roll 2d6, first die is 1 (but not a d20)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("2d6 + 3", {
        allowFumbles: true,
      });

      expect(result.displayString).toBe("[1] + [5] + 3");
      expect(result.total).toBe(9); // Not a fumble since it's not d20

      // Check diceData
      expect(result.diceData).toBeDefined();
      expect(result.diceData?.isFumble).toBe(false);
      expect(result.diceData?.dice[0]).toMatchObject({ value: 1, kept: true, category: "normal" });
      expect(result.diceData?.dice[1]).toMatchObject({ value: 5, kept: true, category: "normal" });
    });

    it("should check first kept die for critical/fumble with advantage", () => {
      // Roll 1d6 with advantage 1, rolls are [2, 6]
      // 2 is dropped, 6 is kept and should trigger critical
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(6) // This becomes the first kept die
        .mockReturnValueOnce(4); // Exploding roll

      const result = diceService.evaluateDiceFormula("1d6", {
        advantageLevel: 1,
        allowCriticals: true,
      });

      expect(result.displayString).toBe("~~[2]~~ + [6] + [4]");
      expect(result.total).toBe(10); // 6 + 4
    });
  });

  describe("Double-digit dice", () => {
    it("should roll d44 correctly", () => {
      // Roll d44: [3] for tens, [2] for ones = 32
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(3) // tens
        .mockReturnValueOnce(2); // ones

      const result = diceService.evaluateDiceFormula("d44");

      expect(result.displayString).toBe("[3] [2] = 32");
      expect(result.total).toBe(32);

      // Check diceData
      expect(result.diceData).toBeDefined();
      expect(result.diceData?.isDoubleDigit).toBe(true);
      expect(result.diceData?.dice).toHaveLength(2);
      expect(result.diceData?.dice[0]).toMatchObject({
        value: 3,
        size: 4,
        kept: true,
        category: "normal",
      });
      expect(result.diceData?.dice[1]).toMatchObject({
        value: 2,
        size: 4,
        kept: true,
        category: "normal",
      });
      expect(result.diceData?.total).toBe(32);
    });

    it("should roll d66 correctly", () => {
      // Roll d66: [5] for tens, [4] for ones = 54
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(5) // tens
        .mockReturnValueOnce(4); // ones

      const result = diceService.evaluateDiceFormula("d66");

      expect(result.displayString).toBe("[5] [4] = 54");
      expect(result.total).toBe(54);
    });

    it("should roll d88 correctly", () => {
      // Roll d88: [7] for tens, [8] for ones = 78
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(7) // tens
        .mockReturnValueOnce(8); // ones

      const result = diceService.evaluateDiceFormula("d88");

      expect(result.displayString).toBe("[7] [8] = 78");
      expect(result.total).toBe(78);
    });

    it("should handle d44 with advantage", () => {
      // Roll d44 with advantage 1:
      // Tens: [3], [4] - keep [4]
      // Ones: [1], [2] - keep [2]
      // Result = 42
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(3) // tens die 1
        .mockReturnValueOnce(4) // tens die 2 (kept - higher)
        .mockReturnValueOnce(1) // ones die 1
        .mockReturnValueOnce(2); // ones die 2 (kept - higher)

      const result = diceService.evaluateDiceFormula("d44", {
        advantageLevel: 1,
      });

      expect(result.displayString).toBe("~~[3]~~ [4] ~~[1]~~ [2] = 42");
      expect(result.total).toBe(42);
    });

    it("should handle d66 with disadvantage", () => {
      // Roll d66 with disadvantage 1:
      // Tens: [5], [3] - keep [3] (lower)
      // Ones: [6], [2] - keep [2] (lower)
      // Result = 32
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(5) // tens die 1
        .mockReturnValueOnce(3) // tens die 2 (kept - lower)
        .mockReturnValueOnce(6) // ones die 1
        .mockReturnValueOnce(2); // ones die 2 (kept - lower)

      const result = diceService.evaluateDiceFormula("d66", {
        advantageLevel: -1,
      });

      expect(result.displayString).toBe("~~[5]~~ [3] ~~[6]~~ [2] = 32");
      expect(result.total).toBe(32);
    });

    it("should work in expressions", () => {
      // Roll d44: [2] [3] = 23, then add 10
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(2) // tens
        .mockReturnValueOnce(3); // ones

      const result = diceService.evaluateDiceFormula("d44 + 10");

      expect(result.displayString).toBe("[2] [3] = 23 + 10");
      expect(result.total).toBe(33);
    });

    it("should throw error for multiple double-digit dice", () => {
      expect(() => diceService.evaluateDiceFormula("2d44")).toThrow(
        "Double-digit dice (d44) can only be rolled one at a time",
      );
    });

    it("should not allow criticals on double-digit dice", () => {
      // Roll d44: [4] [4] = 44 (max for both dice, but shouldn't crit)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(4) // tens (max for d4)
        .mockReturnValueOnce(4); // ones (max for d4)

      const result = diceService.evaluateDiceFormula("d44", {
        allowCriticals: true,
      });

      expect(result.displayString).toBe("[4] [4] = 44");
      expect(result.total).toBe(44);
      // Should not have any additional dice from criticals
    });

    it("should not allow vicious on double-digit dice", () => {
      // Roll d44: [4] [4] = 44 (max, but vicious shouldn't add extra die)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(4) // tens
        .mockReturnValueOnce(4); // ones

      const result = diceService.evaluateDiceFormula("d44", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[4] [4] = 44");
      expect(result.total).toBe(44);
      // Should not have any additional dice from vicious
    });
  });

  describe("Error handling", () => {
    it("should throw on invalid dice types", () => {
      expect(() => diceService.evaluateDiceFormula("3d7")).toThrow("Invalid dice type: d7");
    });

    it("should throw on zero dice count", () => {
      expect(() => diceService.evaluateDiceFormula("0d6")).toThrow("Invalid dice count: 0");
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

      expect(() => diceService.evaluateDiceFormula("STRd6")).toThrow("Invalid dice count: -1");
    });

    it("should support formulas with no dice notation", () => {
      const result = diceService.evaluateDiceFormula("2 + 3");
      expect(result.displayString).toBe("2 + 3 = 5");
      expect(result.total).toBe(5);
    });

    it("should throw on potentially unsafe patterns", () => {
      expect(() => diceService.evaluateDiceFormula("alert('hack')")).toThrow(
        "Potentially unsafe pattern",
      );
    });
  });

  describe("Postfix modifiers (! and v)", () => {
    it("should handle exploding criticals with ! postfix", () => {
      // Roll 1d6!, get a 6 (critical), then 6 again, then 3
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(3); // Normal roll

      const result = diceService.evaluateDiceFormula("1d6!");

      expect(result.displayString).toBe("[6] + [6] + [3]");
      expect(result.total).toBe(15);
      expect(result.diceData?.criticalHits).toBe(2);
    });

    it("should handle vicious with v postfix", () => {
      // Roll 1d6v, get a 6 (critical), then 3 (normal), then 4 (vicious)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Exploding roll
        .mockReturnValueOnce(4); // Vicious die

      const result = diceService.evaluateDiceFormula("1d6v");

      expect(result.displayString).toBe("[6] + [3] + [4]");
      expect(result.total).toBe(13);
      expect(result.diceData?.dice[2]).toMatchObject({ value: 4, kept: true, category: "vicious" });
    });

    it("should handle combined !v postfix", () => {
      // Roll 1d6!v, get a 6 (critical), then 6 again, then 2, then 5 and 4 (2 vicious dice)
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(2) // Normal roll
        .mockReturnValueOnce(5) // First vicious die (for first crit)
        .mockReturnValueOnce(4); // Second vicious die (for second crit)

      const result = diceService.evaluateDiceFormula("1d6!v");

      expect(result.displayString).toBe("[6] + [6] + [2] + [5] + [4]");
      expect(result.total).toBe(23);
      expect(result.diceData?.criticalHits).toBe(2);
      expect(result.diceData?.dice[3]).toMatchObject({ value: 5, kept: true, category: "vicious" });
      expect(result.diceData?.dice[4]).toMatchObject({ value: 4, kept: true, category: "vicious" });
    });

    it("should handle v! postfix (redundant but valid)", () => {
      // v implies criticals, so v! is redundant but should work
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Exploding roll
        .mockReturnValueOnce(4); // Vicious die

      const result = diceService.evaluateDiceFormula("1d6v!");

      expect(result.displayString).toBe("[6] + [3] + [4]");
      expect(result.total).toBe(13);
    });

    it("should override allowCriticals option with ! postfix", () => {
      // Roll 1d6! with allowCriticals: false - postfix should override
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3); // Exploding roll

      const result = diceService.evaluateDiceFormula("1d6!", { allowCriticals: false });

      expect(result.displayString).toBe("[6] + [3]");
      expect(result.total).toBe(9);
      expect(result.diceData?.criticalHits).toBe(1);
    });

    it("should handle postfix with no critical rolled", () => {
      // Roll 1d6! but don't get a 6
      vi.spyOn(diceService as any, "rollSingleDie").mockReturnValueOnce(3);

      const result = diceService.evaluateDiceFormula("1d6!");

      expect(result.displayString).toBe("[3]");
      expect(result.total).toBe(3);
      expect(result.diceData?.criticalHits).toBe(0);
    });

    it("should handle postfix in complex expressions", () => {
      // Roll 2d6! + 1d4v + 3
      // Note: We process dice notations from right to left (reverse order)
      // So 1d4v is rolled first, then 2d6!
      // 1d4v gets 1 crit, so 1 vicious die. 2d6! gets 1 crit, no vicious.
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(4) // d4 (critical for 1d4v)
        .mockReturnValueOnce(2) // Exploding roll from d4
        .mockReturnValueOnce(3) // Vicious die for d4's crit
        .mockReturnValueOnce(6) // First d6 (critical for 2d6!)
        .mockReturnValueOnce(2) // Second d6
        .mockReturnValueOnce(3); // Exploding roll from first d6

      const result = diceService.evaluateDiceFormula("2d6! + 1d4v + 3");

      expect(result.displayString).toBe("[6] + [2] + [3] + [4] + [2] + [3] + 3");
      expect(result.total).toBe(23);
    });

    it("should handle postfixes with variables", () => {
      // Roll STRd6! where STR = 3 (3 dice)
      // Only the first die can trigger exploding crits
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(6) // First d6 (critical - triggers exploding)
        .mockReturnValueOnce(2) // Second d6
        .mockReturnValueOnce(3) // Third d6
        .mockReturnValueOnce(4); // Exploding roll from first d6's critical

      const result = diceService.evaluateDiceFormula("STRd6!");

      expect(result.displayString).toBe("[6] + [2] + [3] + [4]");
      expect(result.total).toBe(15);
      expect(result.substitutedFormula).toBe("3d6!");
    });

    it("should ignore postfixes on double-digit dice", () => {
      // Double-digit dice cannot crit or be vicious
      vi.spyOn(diceService as any, "rollSingleDie")
        .mockReturnValueOnce(4) // tens
        .mockReturnValueOnce(4); // ones

      const result = diceService.evaluateDiceFormula("1d44!v");

      expect(result.displayString).toBe("[4] [4] = 44");
      expect(result.total).toBe(44);
      expect(result.diceData?.isDoubleDigit).toBe(true);
      expect(result.diceData?.criticalHits).toBe(0);
    });
  });
});
