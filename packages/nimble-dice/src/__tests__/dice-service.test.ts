import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiceService } from "../index";

// Type for accessing private methods in tests
type DiceServiceWithPrivates = DiceService & {
  rollSingleDie(sides: number): number;
};

describe("DiceService", () => {
  let diceService: DiceService;

  beforeEach(() => {
    vi.clearAllMocks();
    diceService = new DiceService();
  });

  describe("Basic dice formulas", () => {
    it("should evaluate a simple dice formula", () => {
      // Mock dice rolls: 2, 1, 4
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(4);

      const result = diceService.evaluateDiceFormula("3d6 + 2");

      expect(result.displayString).toBe("[2] + [1] + [4] + 2");
      expect(result.total).toBe(9); // 2 + 1 + 4 + 2 = 9
      expect(result.formula).toBe("3d6 + 2");
    });

    it("should handle d6 as 1d6", () => {
      vi.spyOn(
        diceService as unknown as DiceServiceWithPrivates,
        "rollSingleDie",
      ).mockReturnValueOnce(4);

      const result = diceService.evaluateDiceFormula("d6 + 3");

      expect(result.displayString).toBe("[4] + 3");
      expect(result.total).toBe(7);
    });

    it("should evaluate complex expressions", () => {
      // Mock dice rolls: 3, 5
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("(2d6) * 2 + 4");

      expect(result.displayString).toBe("([3] + [5]) * 2 + 4");
      expect(result.total).toBe(20); // (3 + 5) * 2 + 4 = 20
    });
  });

  describe("Advantage and disadvantage", () => {
    it("should handle advantage correctly", () => {
      // Roll 2d6 with advantage 1 (roll 3 dice, drop lowest)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("2d6", {
        advantageLevel: 1,
      });

      // The 2 should be dropped (lowest), keeping 4 and 5
      expect(result.displayString).toBe("[4] + ~~[2]~~ + [5]");
      expect(result.total).toBe(9); // 4 + 5 = 9
    });

    it("should handle disadvantage correctly", () => {
      // Roll 2d6 with disadvantage 1 (roll 3 dice, drop highest)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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

  describe("Critical hits", () => {
    it("should handle exploding criticals", () => {
      // Roll 1d6, get a 6 (critical), then 6 again, then 3
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(3); // Normal roll

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
      });

      expect(result.displayString).toBe("[6] + [6] + [3]");
      expect(result.total).toBe(15);
    });

    it("should handle vicious on critical hit", () => {
      // Roll 1d6, get a 6 (critical), then 3 (normal), then 4 (vicious)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Exploding roll (not a crit, so stops)
        .mockReturnValueOnce(4); // Vicious die

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[6] + [3] + [4]");
      expect(result.total).toBe(13); // 6 + 3 + 4
    });

    it("should handle vicious with multiple exploding crits", () => {
      // Roll 1d6: 6 (crit) -> 6 (exploding crit) -> 2 (normal) -> 5 (vicious 1) -> 3 (vicious 2)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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
      vi.spyOn(
        diceService as unknown as DiceServiceWithPrivates,
        "rollSingleDie",
      ).mockReturnValueOnce(3);

      const result = diceService.evaluateDiceFormula("1d6", {
        allowCriticals: true,
        vicious: true,
      });

      expect(result.displayString).toBe("[3]");
      expect(result.total).toBe(3);
    });

    it("should check first kept die for critical with advantage", () => {
      // Roll 1d6 with advantage 1, rolls are [2, 6]
      // 2 is dropped, 6 is kept and should trigger critical
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(3) // tens
        .mockReturnValueOnce(2); // ones

      const result = diceService.evaluateDiceFormula("d44");

      expect(result.displayString).toBe("[3] [2] = 32");
      expect(result.total).toBe(32);
    });

    it("should roll d66 correctly", () => {
      // Roll d66: [5] for tens, [4] for ones = 54
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(5) // tens
        .mockReturnValueOnce(4); // ones

      const result = diceService.evaluateDiceFormula("d66");

      expect(result.displayString).toBe("[5] [4] = 54");
      expect(result.total).toBe(54);
    });

    it("should roll d88 correctly", () => {
      // Roll d88: [7] for tens, [8] for ones = 78
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(7) // tens
        .mockReturnValueOnce(8); // ones

      const result = diceService.evaluateDiceFormula("d88");

      expect(result.displayString).toBe("[7] [8] = 78");
      expect(result.total).toBe(78);
    });

    it("should handle d44 with advantage", () => {
      // Roll d44 with advantage 1:
      // Tens: [3], [4] - keep [4] (higher)
      // Ones: [1], [2] - keep [2] (higher)
      // Result = 42
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(4) // tens (max for d4)
        .mockReturnValueOnce(4); // ones (max for d4)

      const result = diceService.evaluateDiceFormula("d44", {
        allowCriticals: true,
      });

      expect(result.displayString).toBe("[4] [4] = 44");
      expect(result.total).toBe(44);
      // Should not have any additional dice from criticals
    });
  });

  describe("Error handling", () => {
    it("should throw on invalid dice types", () => {
      expect(() => diceService.evaluateDiceFormula("3d7")).toThrow("Invalid dice type: d7");
    });

    it("should throw on zero dice count", () => {
      expect(() => diceService.evaluateDiceFormula("0d6")).toThrow("Invalid dice count: 0");
    });

    it("should support formulas with no dice notation", () => {
      const result = diceService.evaluateDiceFormula("2 + 3");
      expect(result.displayString).toBe("2 + 3 = 5");
      expect(result.total).toBe(5);
    });

    it("should handle invalid characters gracefully", () => {
      expect(() => diceService.evaluateDiceFormula("2d6 + foo")).toThrow(
        "Invalid characters in expression",
      );
    });
  });

  describe("Postfix modifiers (! and v)", () => {
    it("should handle exploding criticals with ! postfix", () => {
      // Roll 1d6!, get a 6 (critical), then 6 again, then 3
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(3); // Normal roll

      const result = diceService.evaluateDiceFormula("1d6!");

      expect(result.displayString).toBe("[6] + [6] + [3]");
      expect(result.total).toBe(15);
    });

    it("should handle vicious with v postfix", () => {
      // Roll 1d6v, get a 6 (critical), then 3 (normal), then 4 (vicious)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3) // Exploding roll
        .mockReturnValueOnce(4); // Vicious die

      const result = diceService.evaluateDiceFormula("1d6v");

      expect(result.displayString).toBe("[6] + [3] + [4]");
      expect(result.total).toBe(13);
    });

    it("should handle combined !v postfix", () => {
      // Roll 1d6!v, get a 6 (critical), then 6 again, then 2, then 5 and 4 (2 vicious dice)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(6) // Exploding critical
        .mockReturnValueOnce(2) // Normal roll
        .mockReturnValueOnce(5) // First vicious die (for first crit)
        .mockReturnValueOnce(4); // Second vicious die (for second crit)

      const result = diceService.evaluateDiceFormula("1d6!v");

      expect(result.displayString).toBe("[6] + [6] + [2] + [5] + [4]");
      expect(result.total).toBe(23);
    });

    it("should override allowCriticals option with ! postfix", () => {
      // Roll 1d6! with allowCriticals: false - postfix should override
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(6) // Initial critical
        .mockReturnValueOnce(3); // Exploding roll

      const result = diceService.evaluateDiceFormula("1d6!", { allowCriticals: false });

      expect(result.displayString).toBe("[6] + [3]");
      expect(result.total).toBe(9);
    });

    it("should handle postfix with no critical rolled", () => {
      // Roll 1d6! but don't get a 6
      vi.spyOn(
        diceService as unknown as DiceServiceWithPrivates,
        "rollSingleDie",
      ).mockReturnValueOnce(3);

      const result = diceService.evaluateDiceFormula("1d6!");

      expect(result.displayString).toBe("[3]");
      expect(result.total).toBe(3);
    });

    it("should handle postfix in complex expressions", () => {
      // Roll 2d6! + 1d4v + 3
      // Processing right to left: 1d4v first, then 2d6!
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
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

    it("should ignore postfixes on double-digit dice", () => {
      // Double-digit dice cannot crit or be vicious
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(4) // tens
        .mockReturnValueOnce(4); // ones

      const result = diceService.evaluateDiceFormula("1d44!v");

      expect(result.displayString).toBe("[4] [4] = 44");
      expect(result.total).toBe(44);
    });

    it("should handle !! notation for all dice exploding", () => {
      // Roll 4d4!! where 3 dice roll 4 (critical) and should all explode
      // Die 1: 2 (normal)
      // Die 2: 4 (crit) -> explodes to 3
      // Die 3: 4 (crit) -> explodes to 4 -> explodes to 2
      // Die 4: 1 (normal)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(2) // Die 1
        .mockReturnValueOnce(4) // Die 2 (critical)
        .mockReturnValueOnce(4) // Die 3 (critical)
        .mockReturnValueOnce(1) // Die 4
        .mockReturnValueOnce(3) // Die 2's explosion
        .mockReturnValueOnce(4) // Die 3's first explosion (also critical)
        .mockReturnValueOnce(2); // Die 3's second explosion

      const result = diceService.evaluateDiceFormula("4d4!!");

      // Expected: [2] + [4] + [4] + [1] + [3] + [4] + [2]
      expect(result.displayString).toBe("[2] + [4] + [4] + [1] + [3] + [4] + [2]");
      expect(result.total).toBe(20); // 2 + 4 + 4 + 1 + 3 + 4 + 2
      expect(result.diceData?.criticalHits).toBe(3); // Three criticals total (2 initial + 1 from explosion)
    });

    it("should handle !! with vicious", () => {
      // Roll 2d6!!v where both dice crit and explode, then add vicious dice
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(6) // Die 1 (critical)
        .mockReturnValueOnce(6) // Die 2 (critical)
        .mockReturnValueOnce(3) // Die 1's explosion
        .mockReturnValueOnce(6) // Die 2's explosion (also critical)
        .mockReturnValueOnce(2) // Die 2's second explosion
        .mockReturnValueOnce(4) // Vicious die 1 (for first crit)
        .mockReturnValueOnce(5) // Vicious die 2 (for second crit)
        .mockReturnValueOnce(3); // Vicious die 3 (for third crit)

      const result = diceService.evaluateDiceFormula("2d6!!v");

      expect(result.displayString).toBe("[6] + [6] + [3] + [6] + [2] + [4] + [5] + [3]");
      expect(result.total).toBe(35); // 6 + 6 + 3 + 6 + 2 + 4 + 5 + 3
      expect(result.diceData?.criticalHits).toBe(3); // Three criticals total
    });
  });

  describe("Advantage/Disadvantage postfix notation", () => {
    it("should handle 1d20a for single advantage", () => {
      // Roll 1d20 with advantage (a postfix)
      // Rolls [10], [15] - keeps [15] (higher)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(15);

      const result = diceService.evaluateDiceFormula("1d20a");

      expect(result.displayString).toBe("~~[10]~~ + [15]");
      expect(result.total).toBe(15);
    });

    it("should handle 1d20a1 for single advantage", () => {
      // Roll 1d20 with advantage 1 (a1 postfix)
      // Rolls [8], [12] - keeps [12] (higher)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(12);

      const result = diceService.evaluateDiceFormula("1d20a1");

      expect(result.displayString).toBe("~~[8]~~ + [12]");
      expect(result.total).toBe(12);
    });

    it("should handle 1d20a3 for triple advantage", () => {
      // Roll 1d20 with triple advantage (a3 postfix)
      // Rolls [5], [10], [18], [7] - keeps [18] (highest)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(18)
        .mockReturnValueOnce(7);

      const result = diceService.evaluateDiceFormula("1d20a3");

      expect(result.displayString).toBe("~~[5]~~ + ~~[10]~~ + [18] + ~~[7]~~");
      expect(result.total).toBe(18);
    });

    it("should handle 1d20d for single disadvantage", () => {
      // Roll 1d20 with disadvantage (d postfix)
      // Rolls [15], [8] - keeps [8] (lower)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(15)
        .mockReturnValueOnce(8);

      const result = diceService.evaluateDiceFormula("1d20d");

      expect(result.displayString).toBe("~~[15]~~ + [8]");
      expect(result.total).toBe(8);
    });

    it("should handle 1d20d2 for double disadvantage", () => {
      // Roll 1d20 with double disadvantage (d2 postfix)
      // Rolls [18], [12], [6] - keeps [6] (lowest)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(18)
        .mockReturnValueOnce(12)
        .mockReturnValueOnce(6);

      const result = diceService.evaluateDiceFormula("1d20d2");

      expect(result.displayString).toBe("~~[18]~~ + ~~[12]~~ + [6]");
      expect(result.total).toBe(6);
    });

    it("should work with modifiers like 1d20!a for advantage with exploding crits", () => {
      // Roll 1d20 with advantage and exploding crits (a! postfix)
      // Rolls [10], [20] - keeps [20] (higher and critical)
      // Then explodes with [15]
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(20) // Critical!
        .mockReturnValueOnce(15); // Explosion

      const result = diceService.evaluateDiceFormula("1d20!a", { allowCriticals: true });

      expect(result.displayString).toBe("~~[10]~~ + [20] + [15]");
      expect(result.total).toBe(35);
    });

    it("should work in complex expressions like 1d20a + 5", () => {
      // Roll 1d20 with advantage plus modifier
      // Rolls [7], [14] - keeps [14] (higher), then adds 5
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(7)
        .mockReturnValueOnce(14);

      const result = diceService.evaluateDiceFormula("1d20a + 5");

      expect(result.displayString).toBe("~~[7]~~ + [14] + 5");
      expect(result.total).toBe(19);
    });

    it("should handle multiple dice with postfixes", () => {
      // Roll 2d6a with single advantage
      // Rolls [3, 4], [5, 6] - keeps [5, 6] (higher sum)
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(5);

      const result = diceService.evaluateDiceFormula("2d6a");

      expect(result.displayString).toBe("[4] + ~~[3]~~ + [5]");
      expect(result.total).toBe(9);
    });

    it("should handle d44a for double-digit dice with advantage", () => {
      // Roll d44 with advantage
      // Tens: [2], [4] - keep [4] (higher)
      // Ones: [1], [3] - keep [3] (higher)
      // Result = 43
      vi.spyOn(diceService as unknown as DiceServiceWithPrivates, "rollSingleDie")
        .mockReturnValueOnce(2) // tens die 1
        .mockReturnValueOnce(4) // tens die 2 (kept - higher)
        .mockReturnValueOnce(1) // ones die 1
        .mockReturnValueOnce(3); // ones die 2 (kept - higher)

      const result = diceService.evaluateDiceFormula("d44a");

      expect(result.displayString).toBe("~~[2]~~ [4] ~~[1]~~ [3] = 43");
      expect(result.total).toBe(43);
    });
  });

  describe("Real dice rolls (integration)", () => {
    it("should generate valid results with real random rolls", () => {
      // Test without mocking to ensure real dice rolling works
      const newService = new DiceService();
      const result = newService.evaluateDiceFormula("3d6 + 2");

      // Check that total is within valid range
      expect(result.total).toBeGreaterThanOrEqual(5); // min: 3*1 + 2
      expect(result.total).toBeLessThanOrEqual(20); // max: 3*6 + 2

      // Check that display string has the right format
      expect(result.displayString).toMatch(/\[\d\] \+ \[\d\] \+ \[\d\] \+ 2/);
    });

    it("should handle advantage with real rolls", () => {
      const newService = new DiceService();
      const result = newService.evaluateDiceFormula("1d20", { advantageLevel: 1 });

      // Check that we have 2 dice rolled (1 original + 1 for advantage)
      expect(result.displayString).toMatch(/(\[\d+\]|~~\[\d+\]~~) \+ (\[\d+\]|~~\[\d+\]~~)/);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeLessThanOrEqual(20);
    });
  });
});
