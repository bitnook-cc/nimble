import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Character } from "../../schemas/character";
import type { ClassDefinition } from "../../schemas/class";
import { getCharacterService, getClassService } from "../../services/service-factory";
import {
  getExampleFormulas,
  getSupportedVariables,
  substituteVariables,
  substituteVariablesForDice,
  validateDiceFormula,
} from "../formula-utils";

// Mock the service factory
vi.mock("../../services/service-factory", () => ({
  getCharacterService: vi.fn(),
  getClassService: vi.fn(),
}));

describe("Formula Utils - KEY Variable Support", () => {
  const mockCharacter: Partial<Character> = {
    level: 5,
    classId: "mage",
    _attributes: {
      strength: 2,
      dexterity: 3,
      intelligence: 5,
      will: 4,
    },
  };

  const mockMageClass: Partial<ClassDefinition> = {
    id: "mage",
    name: "Mage",
    keyAttributes: ["intelligence", "will"],
  };

  const mockFighterClass: Partial<ClassDefinition> = {
    id: "fighter",
    name: "Fighter",
    keyAttributes: ["strength", "dexterity"],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup character service mock
    (getCharacterService as any).mockReturnValue({
      getCurrentCharacter: () => mockCharacter,
      getAttributes: () => ({
        strength: 2,
        dexterity: 3,
        intelligence: 5,
        will: 4,
      }),
    });

    // Setup class service mock - default to mage
    (getClassService as any).mockReturnValue({
      getCharacterClass: () => mockMageClass,
    });
  });

  describe("substituteVariables", () => {
    it("should replace KEY with the highest key attribute value", () => {
      const result = substituteVariables("1d20 + KEY");
      expect(result).toBe("1d20 + 5"); // INT (5) is higher than WIL (4)
    });

    it("should handle KEY with different class key attributes", () => {
      // Switch to fighter class
      (getClassService as any).mockReturnValue({
        getCharacterClass: () => mockFighterClass,
      });

      const result = substituteVariables("KEY + 2");
      expect(result).toBe("3 + 2"); // DEX (3) is higher than STR (2)
    });

    it("should handle multiple KEY references", () => {
      const result = substituteVariables("KEY + KEY * 2");
      expect(result).toBe("5 + 5 * 2");
    });

    it("should handle KEY with other variables", () => {
      const result = substituteVariables("KEY + STR + LEVEL");
      expect(result).toBe("5 + 2 + 5");
    });

    it("should handle KEY when class has no key attributes", () => {
      (getClassService as any).mockReturnValue({
        getCharacterClass: () => ({ id: "test", name: "Test", keyAttributes: [] }),
      });

      const result = substituteVariables("1d20 + KEY");
      expect(result).toBe("1d20 + KEY"); // KEY is not replaced
    });

    it("should handle KEY when no class is set", () => {
      (getClassService as any).mockReturnValue({
        getCharacterClass: () => null,
      });

      const result = substituteVariables("1d20 + KEY");
      expect(result).toBe("1d20 + KEY"); // KEY is not replaced
    });
  });

  describe("substituteVariablesForDice", () => {
    it("should replace KEY in dice notation", () => {
      const result = substituteVariablesForDice("KEYd6");
      expect(result.substituted).toBe("5d6"); // INT (5) is highest
      expect(result.hasVariables).toBe(true);
    });

    it("should replace KEY in math expressions", () => {
      const result = substituteVariablesForDice("2d6 + KEY");
      expect(result.substituted).toBe("2d6 + 5");
      expect(result.hasVariables).toBe(true);
    });

    it("should handle KEY with fighter class", () => {
      (getClassService as any).mockReturnValue({
        getCharacterClass: () => mockFighterClass,
      });

      const result = substituteVariablesForDice("KEYd8 + KEY");
      expect(result.substituted).toBe("3d8 + 3"); // DEX (3) is highest
      expect(result.hasVariables).toBe(true);
    });

    it("should handle case-insensitive KEY", () => {
      const result1 = substituteVariablesForDice("keyd6");
      expect(result1.substituted).toBe("5d6");

      const result2 = substituteVariablesForDice("Key + 2");
      expect(result2.substituted).toBe("5 + 2");
    });

    it("should not replace KEY when no character exists", () => {
      (getCharacterService as any).mockReturnValue({
        getCurrentCharacter: () => null,
        getAttributes: () => null,
      });

      const result = substituteVariablesForDice("KEYd6 + KEY");
      expect(result.substituted).toBe("KEYd6 + KEY");
      expect(result.hasVariables).toBe(false);
    });
  });

  describe("validateDiceFormula", () => {
    it("should validate formulas with KEY variable", () => {
      const result1 = validateDiceFormula("1d20 + KEY");
      expect(result1.valid).toBe(true);

      // KEYd6 would need to be treated differently as it needs expansion
      // Since validation happens without character context, this should be tested differently
      const result2 = validateDiceFormula("1d6 + KEY");
      expect(result2.valid).toBe(true);

      const result3 = validateDiceFormula("2d8 + KEY");
      expect(result3.valid).toBe(true);
    });

    it("should handle KEY in complex formulas", () => {
      const result = validateDiceFormula("(1d4 + KEY) * 2 + STR");
      expect(result.valid).toBe(true);
    });
  });

  describe("getSupportedVariables", () => {
    it("should include KEY in the list of supported variables", () => {
      const variables = getSupportedVariables();
      expect(variables).toContain("KEY");
    });
  });

  describe("getExampleFormulas", () => {
    it("should include an example with KEY", () => {
      const examples = getExampleFormulas();
      const hasKeyExample = examples.some((example) => example.includes("KEY"));
      expect(hasKeyExample).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle when all key attributes are equal", () => {
      (getCharacterService as any).mockReturnValue({
        getCurrentCharacter: () => mockCharacter,
        getAttributes: () => ({
          strength: 3,
          dexterity: 3,
          intelligence: 3,
          will: 3,
        }),
      });

      const result = substituteVariables("KEY");
      expect(result).toBe("3"); // All are equal, so it returns 3
    });

    it("should handle negative key attribute values", () => {
      (getCharacterService as any).mockReturnValue({
        getCurrentCharacter: () => mockCharacter,
        getAttributes: () => ({
          strength: -2,
          dexterity: -1,
          intelligence: 0,
          will: 1,
        }),
      });

      const result = substituteVariables("KEY + 5");
      expect(result).toBe("1 + 5"); // WIL (1) is highest
    });
  });
});
