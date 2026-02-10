import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Character } from "../../schemas/character";
import type {
  AttributeBoostFeatureTrait,
  FeatureTrait,
  PickFeatureFromPoolFeatureTrait,
  SpellSchoolChoiceFeatureTrait,
  SubclassChoiceFeatureTrait,
  UtilitySpellsFeatureTrait,
} from "../../schemas/features";
import { FeatureSelectionService } from "../feature-selection-service";
import { ServiceFactory } from "../service-factory";
import { createTestCharacter, loadCharacterForTesting } from "./test-utils";

describe("FeatureSelectionService", () => {
  let featureSelectionService: FeatureSelectionService;
  let testCharacter: Character;

  beforeEach(async () => {
    // Reset services and use in-memory storage
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");

    // Get service
    featureSelectionService = FeatureSelectionService.getInstance();

    // Create test character
    testCharacter = await createTestCharacter({
      name: "Feature Selection Test Character",
      classId: "mage",
      attributes: { strength: 1, dexterity: 2, intelligence: 3, will: 2 },
      spellTierAccess: 2,
    });

    await loadCharacterForTesting(testCharacter);
  });

  afterEach(() => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  describe("Pool Feature Selections", () => {
    it("should identify available pool selections with no existing selections", () => {
      const poolFeature: PickFeatureFromPoolFeatureTrait = {
        id: "test-pool-feature",
        type: "pick_feature_from_pool",
        poolId: "test-pool",
        choicesAllowed: 2,
      };

      const allEffects: FeatureTrait[] = [poolFeature];
      const result = featureSelectionService.getAvailableTraitSelections(testCharacter, allEffects);

      expect(result.poolSelections).toHaveLength(1);
      expect(result.poolSelections[0]).toBe(poolFeature);
    });

    it("should calculate remaining pool selections correctly", () => {
      const poolFeature: PickFeatureFromPoolFeatureTrait = {
        id: "test-pool-feature",
        type: "pick_feature_from_pool",
        poolId: "test-pool",
        choicesAllowed: 3,
      };

      // Add one existing selection
      testCharacter.traitSelections.push({
        type: "pool_feature",
        grantedByTraitId: "test-pool-feature",
        poolId: "test-pool",
        feature: {
          id: "selected-feature-1",
          name: "Selected Feature 1",
          description: "A selected feature",
          traits: [],
          level: 1,
        },
      });

      const remaining = featureSelectionService.getRemainingPoolSelections(
        testCharacter,
        poolFeature,
      );
      expect(remaining).toBe(2); // 3 allowed - 1 selected = 2 remaining
    });

    it("should return 0 remaining when all pool selections are made", () => {
      const poolFeature: PickFeatureFromPoolFeatureTrait = {
        id: "test-pool-feature",
        type: "pick_feature_from_pool",
        poolId: "test-pool",
        choicesAllowed: 2,
      };

      // Add all allowed selections
      testCharacter.traitSelections.push(
        {
          type: "pool_feature",
          grantedByTraitId: "test-pool-feature",
          poolId: "test-pool",
          feature: {
            id: "selected-feature-1",
            name: "Selected Feature 1",
            description: "A selected feature",
            traits: [],
            level: 1,
          },
        },
        {
          type: "pool_feature",
          grantedByTraitId: "test-pool-feature",
          poolId: "test-pool",
          feature: {
            id: "selected-feature-2",
            name: "Selected Feature 2",
            description: "Another selected feature",
            traits: [],
            level: 1,
          },
        },
      );

      const remaining = featureSelectionService.getRemainingPoolSelections(
        testCharacter,
        poolFeature,
      );
      expect(remaining).toBe(0);
    });
  });

  describe("Subclass Choice Selections", () => {
    it("should identify available subclass choices when none selected", () => {
      const subclassFeature: SubclassChoiceFeatureTrait = {
        id: "test-subclass-choice",
        type: "subclass_choice",
      };

      const allEffects: FeatureTrait[] = [subclassFeature];
      const result = featureSelectionService.getAvailableTraitSelections(testCharacter, allEffects);

      expect(result.subclassChoices).toHaveLength(1);
      expect(result.subclassChoices[0]).toBe(subclassFeature);
    });
  });

  describe("Spell School Choice Selections", () => {
    it("should identify available spell school choices with default count", () => {
      const schoolChoiceFeature: SpellSchoolChoiceFeatureTrait = {
        id: "test-school-choice",
        type: "spell_school_choice",
        availableSchools: ["fire", "radiant", "frost"],
        numberOfChoices: 1,
      };

      const allEffects: FeatureTrait[] = [schoolChoiceFeature];
      const result = featureSelectionService.getAvailableTraitSelections(testCharacter, allEffects);

      expect(result.spellSchoolSelections).toHaveLength(1);
      expect(result.spellSchoolSelections[0]).toBe(schoolChoiceFeature);
    });

    it("should calculate remaining spell school selections correctly", () => {
      const schoolChoiceFeature: SpellSchoolChoiceFeatureTrait = {
        id: "test-school-choice",
        type: "spell_school_choice",
        availableSchools: ["fire", "radiant", "frost"],
        numberOfChoices: 2,
      };

      // Add one existing selection
      testCharacter.traitSelections.push({
        type: "spell_school",
        grantedByTraitId: "test-school-choice",
        schoolId: "fire",
      });

      const remaining = featureSelectionService.getRemainingSpellSchoolSelections(
        testCharacter,
        schoolChoiceFeature,
      );
      expect(remaining).toBe(1); // 2 allowed - 1 selected = 1 remaining
    });
  });

  describe("Attribute Boost Selections", () => {
    it("should identify available attribute boosts when none selected", () => {
      const attributeBoostFeature: AttributeBoostFeatureTrait = {
        id: "test-attribute-boost",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      };

      const allEffects: FeatureTrait[] = [attributeBoostFeature];
      const result = featureSelectionService.getAvailableTraitSelections(testCharacter, allEffects);

      expect(result.attributeBoosts).toHaveLength(1);
      expect(result.attributeBoosts[0]).toBe(attributeBoostFeature);
    });

    it("should calculate remaining attribute boosts correctly", () => {
      const attributeBoostFeature: AttributeBoostFeatureTrait = {
        id: "test-attribute-boost",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 2,
      };

      const remaining = featureSelectionService.getRemainingAttributeBoosts(
        testCharacter,
        attributeBoostFeature,
      );
      expect(remaining).toBe(1); // Attribute boosts are single selection
    });

    it("should return 0 remaining when attribute boost is already selected", () => {
      const attributeBoostFeature: AttributeBoostFeatureTrait = {
        id: "test-attribute-boost",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      };

      // Add existing selection
      testCharacter.traitSelections.push({
        type: "attribute_boost",
        grantedByTraitId: "test-attribute-boost",
        attribute: "strength",
        amount: 1,
      });

      const remaining = featureSelectionService.getRemainingAttributeBoosts(
        testCharacter,
        attributeBoostFeature,
      );
      expect(remaining).toBe(0);
    });
  });

  describe("Utility Spell Selections", () => {
    it("should identify available utility spell selections in total mode", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "total",
        totalSpells: 3,
      };

      const allEffects: FeatureTrait[] = [utilitySpellFeature];
      const result = featureSelectionService.getAvailableTraitSelections(testCharacter, allEffects);

      expect(result.utilitySpellSelections).toHaveLength(1);
      expect(result.utilitySpellSelections[0]).toBe(utilitySpellFeature);
    });

    it("should calculate utility spell selection count for per_school mode", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "per_school",
        numberOfSpells: 2,
      };

      const availableSchools = ["fire", "radiant"];
      const count = featureSelectionService.getUtilitySpellSelectionCount(
        utilitySpellFeature,
        availableSchools,
      );
      expect(count).toBe(4); // 2 schools × 2 spells = 4
    });

    it("should calculate utility spell selection count for total mode", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "total",
        totalSpells: 3,
      };

      const availableSchools = ["fire", "radiant"];
      const count = featureSelectionService.getUtilitySpellSelectionCount(
        utilitySpellFeature,
        availableSchools,
      );
      expect(count).toBe(3); // totalSpells = 3
    });

    it("should calculate utility spell selection count for full_school mode", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "full_school",
      };

      const availableSchools = ["fire", "radiant"];
      const count = featureSelectionService.getUtilitySpellSelectionCount(
        utilitySpellFeature,
        availableSchools,
      );
      expect(count).toBe(1); // full_school mode = 1 school selection
    });

    it("should calculate remaining utility spell selections correctly", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "total",
        totalSpells: 3,
      };

      // Add one existing selection
      testCharacter.traitSelections.push({
        type: "utility_spells",
        grantedByTraitId: "test-utility-spells",
        schoolId: "fire",
        spellId: "fireball",
      });

      const remaining = featureSelectionService.getRemainingUtilitySpellSelections(
        testCharacter,
        utilitySpellFeature,
      );
      expect(remaining).toBe(2); // 3 total - 1 selected = 2 remaining
    });

    it("should handle full_school mode utility spell selections", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "full_school",
      };

      const remaining = featureSelectionService.getRemainingUtilitySpellSelections(
        testCharacter,
        utilitySpellFeature,
      );
      expect(remaining).toBe(1); // full_school mode requires 1 school selection
    });

    it("should get available schools for utility spells with specified schools", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "total",
        totalSpells: 2,
      };

      const schools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
        utilitySpellFeature,
        testCharacter,
      );
      expect(schools).toEqual(["fire", "radiant"]);
    });

    it("should validate utility spell selection correctly", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "total",
        totalSpells: 2,
      };

      const selectedSpells = [
        {
          id: "fireball",
          name: "Fireball",
          type: "spell" as const,
          school: "fire",
          tier: 1,
          category: "utility" as const,
          description: "A ball of fire",
          actionCost: 2,
        },
      ];

      const isValid = featureSelectionService.validateUtilitySpellSelection(
        utilitySpellFeature,
        selectedSpells,
        testCharacter,
      );
      expect(isValid).toBe(true); // 1 spell selected, max 2 allowed
    });

    it("should invalidate too many utility spell selections", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire"],
        selectionMode: "total",
        totalSpells: 1,
      };

      const selectedSpells = [
        {
          id: "fireball",
          name: "Fireball",
          type: "spell" as const,
          school: "fire",
          tier: 1,
          category: "utility" as const,
          description: "A ball of fire",
          actionCost: 2,
        },
        {
          id: "fire-shield",
          name: "Fire Shield",
          type: "spell" as const,
          school: "fire",
          tier: 1,
          category: "utility" as const,
          description: "A shield of fire",
          actionCost: 1,
        },
      ];

      const isValid = featureSelectionService.validateUtilitySpellSelection(
        utilitySpellFeature,
        selectedSpells,
        testCharacter,
      );
      expect(isValid).toBe(false); // 2 spells selected, max 1 allowed
    });

    it("should validate per_school mode utility spell selections", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire", "radiant"],
        selectionMode: "per_school",
        numberOfSpells: 1,
      };

      const selectedSpells = [
        {
          id: "fireball",
          name: "Fireball",
          type: "spell" as const,
          school: "fire",
          tier: 1,
          category: "utility" as const,
          description: "A ball of fire",
          actionCost: 2,
        },
        {
          id: "light",
          name: "Light",
          type: "spell" as const,
          school: "radiant",
          tier: 1,
          category: "utility" as const,
          description: "Creates light",
          actionCost: 1,
        },
      ];

      const isValid = featureSelectionService.validateUtilitySpellSelection(
        utilitySpellFeature,
        selectedSpells,
        testCharacter,
      );
      expect(isValid).toBe(true); // 1 spell per school, exactly what's allowed
    });

    it("should invalidate too many spells per school", () => {
      const utilitySpellFeature: UtilitySpellsFeatureTrait = {
        id: "test-utility-spells",
        type: "utility_spells",
        schools: ["fire"],
        selectionMode: "per_school",
        numberOfSpells: 1,
      };

      const selectedSpells = [
        {
          id: "fireball",
          name: "Fireball",
          type: "spell" as const,
          school: "fire",
          tier: 1,
          category: "utility" as const,
          description: "A ball of fire",
          actionCost: 2,
        },
        {
          id: "fire-shield",
          name: "Fire Shield",
          type: "spell" as const,
          school: "fire",
          tier: 1,
          category: "utility" as const,
          description: "A shield of fire",
          actionCost: 1,
        },
      ];

      const isValid = featureSelectionService.validateUtilitySpellSelection(
        utilitySpellFeature,
        selectedSpells,
        testCharacter,
      );
      expect(isValid).toBe(false); // 2 fire spells selected, max 1 per school
    });
  });

  describe("Mixed Feature Selections", () => {
    it("should identify all available selections from mixed feature types", () => {
      const mixedEffects: FeatureTrait[] = [
        {
          id: "pool-feature",
          type: "pick_feature_from_pool",
          poolId: "test-pool",
          choicesAllowed: 1,
        },
        {
          id: "subclass-feature",
          type: "subclass_choice",
        },
        {
          id: "school-feature",
          type: "spell_school_choice",
          availableSchools: ["fire", "radiant"],
          numberOfChoices: 1,
        },
        {
          id: "attribute-feature",
          type: "attribute_boost",
          allowedAttributes: ["strength", "dexterity"],
          amount: 1,
        },
        {
          id: "utility-feature",
          type: "utility_spells",
          schools: ["fire"],
          selectionMode: "total",
          totalSpells: 2,
        },
      ];

      const result = featureSelectionService.getAvailableTraitSelections(
        testCharacter,
        mixedEffects,
      );

      expect(result.poolSelections).toHaveLength(1);
      expect(result.subclassChoices).toHaveLength(1);
      expect(result.spellSchoolSelections).toHaveLength(1);
      expect(result.attributeBoosts).toHaveLength(1);
      expect(result.utilitySpellSelections).toHaveLength(1);
    });

    it("should exclude completed selections from available list", () => {
      // Add existing selections for all types
      testCharacter.traitSelections.push(
        {
          type: "pool_feature",
          grantedByTraitId: "pool-feature",
          poolId: "test-pool",
          feature: {
            id: "selected-feature",
            name: "Selected Feature",
            description: "A selected feature",
            traits: [],
            level: 1,
          },
        },
        {
          type: "spell_school",
          grantedByTraitId: "school-feature",
          schoolId: "fire",
        },
        {
          type: "attribute_boost",
          grantedByTraitId: "attribute-feature",
          attribute: "strength",
          amount: 1,
        },
        {
          type: "utility_spells",
          grantedByTraitId: "utility-feature",
          schoolId: "fire",
          spellId: "fireball",
        },
        {
          type: "utility_spells",
          grantedByTraitId: "utility-feature",
          schoolId: "fire",
          spellId: "fire-shield",
        },
      );

      const mixedEffects: FeatureTrait[] = [
        {
          id: "pool-feature",
          type: "pick_feature_from_pool",
          poolId: "test-pool",
          choicesAllowed: 1, // Fully selected
        },
        {
          id: "subclass-feature",
          type: "subclass_choice", // Still available
        },
        {
          id: "school-feature",
          type: "spell_school_choice",
          availableSchools: ["fire", "radiant"],
          numberOfChoices: 1, // Fully selected
        },
        {
          id: "attribute-feature",
          type: "attribute_boost",
          allowedAttributes: ["strength", "dexterity"],
          amount: 1, // Fully selected
        },
        {
          id: "utility-feature",
          type: "utility_spells",
          schools: ["fire"],
          selectionMode: "total",
          totalSpells: 2, // Fully selected
        },
      ];

      const result = featureSelectionService.getAvailableTraitSelections(
        testCharacter,
        mixedEffects,
      );

      expect(result.poolSelections).toHaveLength(0); // Completed
      expect(result.subclassChoices).toHaveLength(1); // Still available
      expect(result.spellSchoolSelections).toHaveLength(0); // Completed
      expect(result.attributeBoosts).toHaveLength(0); // Completed
      expect(result.utilitySpellSelections).toHaveLength(0); // Completed
    });
  });
});
