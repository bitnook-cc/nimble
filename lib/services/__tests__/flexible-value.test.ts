import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Character } from "../../schemas/character";
import { FlexibleValue } from "../../schemas/flexible-value";
import { calculateFlexibleValue } from "../../types/flexible-value";
import { formulaEvaluatorService } from "../formula-evaluator-service";
import { getCharacterService } from "../service-factory";

// Mock the character service
vi.mock("../service-factory", () => ({
  getCharacterService: vi.fn(),
}));

describe("FlexibleValue", () => {
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

  describe("calculateFlexibleValue", () => {
    it("should return fixed value for fixed type", () => {
      const flexValue: FlexibleValue = {
        type: "fixed",
        value: 10,
      };

      const result = calculateFlexibleValue(flexValue);
      expect(result).toBe(10);
    });

    it("should evaluate formula for formula type", () => {
      const flexValue: FlexibleValue = {
        type: "formula",
        expression: "5 + 3",
      };

      const result = calculateFlexibleValue(flexValue);
      expect(result).toBe(8);
    });

    it("should handle attribute substitution in formulas", () => {
      const flexValue: FlexibleValue = {
        type: "formula",
        expression: "STR + DEX",
      };

      const result = calculateFlexibleValue(flexValue);
      expect(result).toBe(5); // 3 + 2
    });

    it("should handle level substitution in formulas", () => {
      const flexValue: FlexibleValue = {
        type: "formula",
        expression: "LEVEL * 2",
      };

      const result = calculateFlexibleValue(flexValue);
      expect(result).toBe(10); // 5 * 2
    });

    it("should handle complex formulas", () => {
      const flexValue: FlexibleValue = {
        type: "formula",
        expression: "(STR + WIL) * LEVEL",
      };

      const result = calculateFlexibleValue(flexValue);
      expect(result).toBe(35); // (3 + 4) * 5
    });
  });

  describe("FormulaEvaluatorService", () => {
    describe("evaluateFormula", () => {
      it("should evaluate simple arithmetic", () => {
        const result = formulaEvaluatorService.evaluateFormula("2 + 2 * 3");
        expect(result).toBe(8); // 2 + 6
      });

      it("should handle parentheses correctly", () => {
        const result = formulaEvaluatorService.evaluateFormula("(2 + 2) * 3");
        expect(result).toBe(12); // 4 * 3
      });

      it("should substitute all attribute types", () => {
        const result = formulaEvaluatorService.evaluateFormula("STR + DEX + INT + WIL");
        expect(result).toBe(10); // 3 + 2 + 1 + 4
      });

      it("should substitute full attribute names", () => {
        const result = formulaEvaluatorService.evaluateFormula("STRENGTH + DEXTERITY + INTELLIGENCE + WILL");
        expect(result).toBe(10); // 3 + 2 + 1 + 4
      });

      it("should handle division and floor the result", () => {
        const result = formulaEvaluatorService.evaluateFormula("7 / 2");
        expect(result).toBe(3); // floor(3.5)
      });

      it("should return 0 for negative results", () => {
        const result = formulaEvaluatorService.evaluateFormula("2 - 10");
        expect(result).toBe(0); // max(0, -8)
      });

      it("should throw when character is missing and formula has variables", () => {
        (getCharacterService as any).mockReturnValue({
          getCurrentCharacter: () => null,
          getAttributes: () => null,
        });

        // Should throw when trying to evaluate formula with variables
        expect(() => {
          formulaEvaluatorService.evaluateFormula("STR + 3");
        }).toThrow("No character available");
      });

      it("should throw for invalid expressions", () => {
        // Should throw for expressions with invalid characters
        expect(() => {
          formulaEvaluatorService.evaluateFormula("invalid expression");
        }).toThrow("Invalid characters in expression");
      });

      it("should reject potentially dangerous expressions", () => {
        const dangerous = [
          { expr: "alert('hack')", error: "Potentially unsafe pattern" },
          { expr: "window.location = 'evil.com'", error: "Potentially unsafe pattern" },
          { expr: "eval('malicious')", error: "Potentially unsafe pattern" },
          { expr: "function() { return 1; }", error: "Potentially unsafe pattern" },
          { expr: "[1,2,3].map(x => x)", error: "Potentially unsafe pattern" },
          { expr: "{a: 1}", error: "Potentially unsafe pattern" },
          { expr: "1; 2", error: "Potentially unsafe pattern" },
        ];

        dangerous.forEach(({ expr, error }) => {
          expect(() => {
            formulaEvaluatorService.evaluateFormula(expr);
          }).toThrow(error);
        });
      });
    });

    describe("evaluateFlexibleValue", () => {
      it("should handle fixed values", () => {
        const flexValue: FlexibleValue = {
          type: "fixed",
          value: 42,
        };

        const result = formulaEvaluatorService.evaluateFlexibleValue(flexValue);
        expect(result).toBe(42);
      });

      it("should handle formula values", () => {
        const flexValue: FlexibleValue = {
          type: "formula",
          expression: "STR * 3 + LEVEL",
        };

        const result = formulaEvaluatorService.evaluateFlexibleValue(flexValue);
        expect(result).toBe(14); // 3 * 3 + 5
      });
    });

    describe("previewFormula", () => {
      it("should return both result and substituted expression", () => {
        const preview = formulaEvaluatorService.previewFormula("STR + WIL");
        
        expect(preview.result).toBe(7); // 3 + 4
        expect(preview.substituted).toBe("3 + 4");
      });

      it("should show level substitution", () => {
        const preview = formulaEvaluatorService.previewFormula("LEVEL * 2 + DEX");
        
        expect(preview.result).toBe(12); // 5 * 2 + 2
        expect(preview.substituted).toBe("5 * 2 + 2");
      });

      it("should handle complex expressions", () => {
        const preview = formulaEvaluatorService.previewFormula("(STR + DEX) * (WIL - INT)");
        
        expect(preview.result).toBe(15); // (3 + 2) * (4 - 1) = 5 * 3
        expect(preview.substituted).toBe("(3 + 2) * (4 - 1)");
      });
    });

    describe("Edge cases", () => {
      it("should handle zero attributes", () => {
        (getCharacterService as any).mockReturnValue({
          getCurrentCharacter: () => ({
            ...mockCharacter,
            _attributes: {
              strength: 0,
              dexterity: 0,
              intelligence: 0,
              will: 0,
            },
          }),
          getAttributes: () => ({
            strength: 0,
            dexterity: 0,
            intelligence: 0,
            will: 0,
          }),
        });

        const result = formulaEvaluatorService.evaluateFormula("STR + DEX + INT + WIL");
        expect(result).toBe(0);
      });

      it("should handle negative attributes", () => {
        (getCharacterService as any).mockReturnValue({
          getCurrentCharacter: () => ({
            ...mockCharacter,
            _attributes: {
              strength: -2,
              dexterity: 3,
              intelligence: -1,
              will: 4,
            },
          }),
          getAttributes: () => ({
            strength: -2,
            dexterity: 3,
            intelligence: -1,
            will: 4,
          }),
        });

        const result = formulaEvaluatorService.evaluateFormula("STR + DEX");
        expect(result).toBe(1); // -2 + 3
      });

      it("should handle very large numbers", () => {
        const result = formulaEvaluatorService.evaluateFormula("999999 * 999999");
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(Infinity);
      });

      it("should handle nested parentheses", () => {
        const result = formulaEvaluatorService.evaluateFormula("((2 + 3) * (4 + 5)) + ((6 - 1) * 2)");
        expect(result).toBe(55); // (5 * 9) + (5 * 2) = 45 + 10
      });

      it("should handle all operators", () => {
        const result = formulaEvaluatorService.evaluateFormula("10 + 5 - 3 * 2 / 2");
        expect(result).toBe(12); // 10 + 5 - 3 = 12
      });
    });
  });
});