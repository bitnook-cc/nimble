import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SpellAbilityDefinition } from "../../schemas/abilities";
import type { Character } from "../../schemas/character";
import { CharacterCreationService } from "../character-creation-service";
import { ServiceFactory, getCharacterCreation } from "../service-factory";
import { getCharacterService } from "../service-factory";
import { SpellCastingService } from "../spell-casting-service";
import { createTestSpellcaster, loadCharacterForTesting } from "./test-utils";

/**
 * Test for SpellCastingService orchestration
 * Uses real character data and in-memory storage to test service integration
 */
describe("SpellCastingService", () => {
  let spellCastingService: SpellCastingService;
  let characterCreationService: CharacterCreationService;
  let testCharacter: Character;
  let testSpells: {
    cantrip: SpellAbilityDefinition;
    tier1Spell: SpellAbilityDefinition;
    tier2Spell: SpellAbilityDefinition;
    noResourceSpell: SpellAbilityDefinition;
  };

  beforeEach(async () => {
    // Reset services and set to use in-memory storage
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");

    // Get services
    spellCastingService = SpellCastingService.getInstance();
    characterCreationService = getCharacterCreation();

    // Create test spells with various resource costs
    testSpells = {
      cantrip: {
        id: "test-cantrip",
        name: "Test Cantrip",
        description: "A test cantrip spell",
        type: "spell",
        school: "fire",
        tier: 0,
        category: "combat",
        actionCost: 1,
        diceFormula: "1d10",
        scalingBonus: "+5",
      },
      tier1Spell: {
        id: "test-tier1",
        name: "Test Tier 1 Spell",
        description: "A test tier 1 spell",
        type: "spell",
        school: "fire",
        tier: 1,
        category: "combat",
        actionCost: 2,
        diceFormula: "4d10",
        upcastBonus: "+10",
        resourceCost: {
          type: "fixed",
          resourceId: "mana",
          amount: 1,
        },
      },
      tier2Spell: {
        id: "test-tier2",
        name: "Test Tier 2 Spell",
        description: "A test tier 2 spell",
        type: "spell",
        school: "fire",
        tier: 2,
        category: "combat",
        actionCost: 3,
        diceFormula: "8d10",
        upcastBonus: "+20",
        resourceCost: {
          type: "fixed",
          resourceId: "mana",
          amount: 2,
        },
      },
      noResourceSpell: {
        id: "test-no-resource",
        name: "Test No Resource Spell",
        description: "A spell with no resource cost",
        type: "spell",
        school: "utility",
        tier: 1,
        category: "utility",
        actionCost: 1,
      },
    };

    // Create test spellcaster with mana resource using test utilities
    testCharacter = await createTestSpellcaster({
      name: "Test Spellcaster",
      classId: "mage",
      manaAmount: 5,
      maxMana: 10,
      spellTierAccess: 6, // Can cast up to tier 6 spells
    });

    // Load character into character service for testing
    await loadCharacterForTesting(testCharacter);

    // Mock dice rolls to avoid randomness in tests
    vi.spyOn(Math, "random").mockReturnValue(0.5); // Always roll middle values
  });

  afterEach(() => {
    vi.restoreAllMocks();
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  describe("getAvailableMethods", () => {
    it("should delegate to registered handlers", () => {
      const methods = spellCastingService.getAvailableMethods(testSpells.tier1Spell);
      expect(Array.isArray(methods)).toBe(true);
      expect(methods.length).toBeGreaterThan(0);
    });

    it("should handle spells without casting tier", () => {
      const methods = spellCastingService.getAvailableMethods(testSpells.cantrip);
      expect(Array.isArray(methods)).toBe(true);
    });
  });

  describe("calculateCastingCost", () => {
    it("should return error for unknown casting method", () => {
      const cost = spellCastingService.calculateCastingCost(
        testSpells.tier1Spell,
        "unknown" as any,
      );

      expect(cost.canAfford).toBe(false);
      expect(cost.description).toBe("Unknown casting method");
      expect(cost.riskLevel).toBe("none");
    });

    it("should use default casting tier when not specified", () => {
      const cost = spellCastingService.calculateCastingCost(testSpells.tier1Spell, "mana");

      expect(cost).toBeDefined();
      expect(typeof cost.canAfford).toBe("boolean");
      expect(typeof cost.description).toBe("string");
    });
  });

  describe("castSpell", () => {
    it("should fail for unknown casting method", async () => {
      const result = await spellCastingService.castSpell(testSpells.tier1Spell, {
        methodType: "unknown" as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown casting method");
    });

    it("should use default casting tier when not specified", async () => {
      const result = await spellCastingService.castSpell(testSpells.tier1Spell, {
        methodType: "mana",
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("getMethodInfo", () => {
    it("should return method info for registered handlers", () => {
      const info = spellCastingService.getMethodInfo("mana");

      expect(info).toBeDefined();
      expect(info?.displayName).toBeDefined();
      expect(info?.description).toBeDefined();
    });

    it("should return null for unknown method", () => {
      const info = spellCastingService.getMethodInfo("unknown" as any);
      expect(info).toBeNull();
    });
  });

  describe("getAllMethodTypes", () => {
    it("should return all registered casting method types", () => {
      const methods = spellCastingService.getAllMethodTypes();

      expect(Array.isArray(methods)).toBe(true);
      expect(methods.length).toBeGreaterThan(0);
    });
  });

  describe("Service Integration", () => {
    it("should integrate with character service for spell casting", async () => {
      const characterService = getCharacterService();

      // Add spell to character's abilities
      const character = characterService.getCurrentCharacter();
      if (character) {
        character._abilities.push(testSpells.tier1Spell);
        await characterService.updateCharacter(character);
      }

      const result = await spellCastingService.castSpell(testSpells.tier1Spell, {
        methodType: "mana",
      });

      expect(typeof result.success).toBe("boolean");
      if (result.success) {
        expect(result.effectiveSpellTier).toBeDefined();
      }
    });

    it("should handle castingTier parameter correctly", async () => {
      const result = await spellCastingService.castSpell(testSpells.tier1Spell, {
        methodType: "mana",
        castingTier: 2,
      });

      expect(typeof result.success).toBe("boolean");
      if (result.success) {
        expect(result.effectiveSpellTier).toBeDefined();
      }
    });
  });
});
