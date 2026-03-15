import { describe, expect, it } from "vitest";

import type { ResourceDefinition } from "../../schemas/resources";
import { ResourceService } from "../resource-service";

describe("ResourceService", () => {
  const resourceService = new ResourceService();

  const createTestResource = (overrides?: Partial<ResourceDefinition>): ResourceDefinition => ({
    id: "test-mana",
    name: "Mana",
    description: "Magical energy",
    colorScheme: "blue-magic",
    icon: "sparkles",
    resetCondition: "safe_rest",
    resetType: "to_max",
    minValue: { type: "fixed", value: 0 },
    maxValue: { type: "fixed", value: 10 },
    ...overrides,
  });

  describe("calculateInitialValue", () => {
    it("should return max value for to_max reset type", () => {
      const resource = createTestResource({ resetType: "to_max" });
      expect(resourceService.calculateInitialValue(resource)).toBe(10);
    });

    it("should return min value for to_zero reset type", () => {
      const resource = createTestResource({
        resetType: "to_zero",
        minValue: { type: "fixed", value: 0 },
      });
      expect(resourceService.calculateInitialValue(resource)).toBe(0);
    });

    it("should return reset value for to_default reset type", () => {
      const resource = createTestResource({
        resetType: "to_default",
        resetValue: { type: "fixed", value: 5 },
      });
      expect(resourceService.calculateInitialValue(resource)).toBe(5);
    });

    it("should return max value when to_default has no reset value", () => {
      const resource = createTestResource({
        resetType: "to_default",
        resetValue: undefined,
      });
      expect(resourceService.calculateInitialValue(resource)).toBe(10);
    });
  });

  describe("spendResource - first use behavior", () => {
    it("should default to initial value when resource does not exist in currentValues", () => {
      const resource = createTestResource({
        resetType: "to_max",
        minValue: { type: "fixed", value: 0 },
        maxValue: { type: "fixed", value: 10 },
      });

      const currentValues = new Map();

      // Spend 2 from a resource that doesn't exist yet
      const newValues = resourceService.spendResource("test-mana", 2, resource, currentValues);

      // Should start from initial value (10) and subtract 2 = 8
      const result = newValues.get("test-mana");
      expect(result).toBeDefined();
      expect(result?.type).toBe("numerical");
      if (result?.type === "numerical") {
        expect(result.value).toBe(8);
      }
    });

    it("should use existing value when resource exists in currentValues", () => {
      const resource = createTestResource({
        resetType: "to_max",
        minValue: { type: "fixed", value: 0 },
        maxValue: { type: "fixed", value: 10 },
      });

      const currentValues = new Map();
      currentValues.set("test-mana", { type: "numerical", value: 6 });

      // Spend 2 from existing value of 6
      const newValues = resourceService.spendResource("test-mana", 2, resource, currentValues);

      const result = newValues.get("test-mana");
      expect(result).toBeDefined();
      expect(result?.type).toBe("numerical");
      if (result?.type === "numerical") {
        expect(result.value).toBe(4);
      }
    });

    it("should clamp to minimum when spending more than available on first use", () => {
      const resource = createTestResource({
        resetType: "to_max",
        minValue: { type: "fixed", value: 0 },
        maxValue: { type: "fixed", value: 10 },
      });

      const currentValues = new Map();

      // Spend 15 from initial value of 10
      const newValues = resourceService.spendResource("test-mana", 15, resource, currentValues);

      const result = newValues.get("test-mana");
      expect(result).toBeDefined();
      expect(result?.type).toBe("numerical");
      if (result?.type === "numerical") {
        expect(result.value).toBe(0); // Clamped to minimum
      }
    });
  });

  describe("restoreResource - first use behavior", () => {
    it("should default to initial value when resource does not exist in currentValues", () => {
      const resource = createTestResource({
        resetType: "to_max",
        minValue: { type: "fixed", value: 0 },
        maxValue: { type: "fixed", value: 10 },
      });

      const currentValues = new Map();

      // Restore 2 to a resource that doesn't exist yet
      const newValues = resourceService.restoreResource("test-mana", 2, resource, currentValues);

      // Should start from initial value (10) and add 2 = 10 (clamped to max)
      const result = newValues.get("test-mana");
      expect(result).toBeDefined();
      expect(result?.type).toBe("numerical");
      if (result?.type === "numerical") {
        expect(result.value).toBe(10); // Clamped to max
      }
    });

    it("should use existing value when resource exists in currentValues", () => {
      const resource = createTestResource({
        resetType: "to_max",
        minValue: { type: "fixed", value: 0 },
        maxValue: { type: "fixed", value: 10 },
      });

      const currentValues = new Map();
      currentValues.set("test-mana", { type: "numerical", value: 6 });

      // Restore 2 to existing value of 6
      const newValues = resourceService.restoreResource("test-mana", 2, resource, currentValues);

      const result = newValues.get("test-mana");
      expect(result).toBeDefined();
      expect(result?.type).toBe("numerical");
      if (result?.type === "numerical") {
        expect(result.value).toBe(8);
      }
    });
  });

  describe("resetResourcesByCondition", () => {
    it("should reset resources with matching reset condition", () => {
      const resources: ResourceDefinition[] = [
        createTestResource({
          id: "mana",
          resetCondition: "safe_rest",
          resetType: "to_max",
          maxValue: { type: "fixed", value: 10 },
        }),
        createTestResource({
          id: "focus",
          resetCondition: "encounter_end",
          resetType: "to_max",
          maxValue: { type: "fixed", value: 5 },
        }),
      ];

      const currentValues = new Map();
      currentValues.set("mana", { type: "numerical", value: 3 });
      currentValues.set("focus", { type: "numerical", value: 2 });

      const newValues = resourceService.resetResourcesByCondition(
        resources,
        currentValues,
        "safe_rest",
      );

      // Mana should reset to max (10)
      const manaResult = newValues.get("mana");
      expect(manaResult?.type).toBe("numerical");
      if (manaResult?.type === "numerical") {
        expect(manaResult.value).toBe(10);
      }

      // Focus should also reset (hierarchical reset)
      const focusResult = newValues.get("focus");
      expect(focusResult?.type).toBe("numerical");
      if (focusResult?.type === "numerical") {
        expect(focusResult.value).toBe(5);
      }
    });
  });
});
