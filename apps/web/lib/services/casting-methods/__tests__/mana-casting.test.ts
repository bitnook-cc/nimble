import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SpellAbilityDefinition } from "../../../schemas/abilities";
import { createTestSpellcaster, loadCharacterForTesting } from "../../__tests__/test-utils";
import { ServiceFactory, getCharacterCreation } from "../../service-factory";
import { getCharacterService } from "../../service-factory";
import { ManaCastingHandler } from "../mana-casting";

/**
 * Test for ManaCastingHandler with focus on mana casting method
 * Uses real character data and in-memory storage to test actual spell casting mechanics
 */
describe("ManaCastingHandler", () => {
  let manaCastingHandler: ManaCastingHandler;
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

    // Get handler
    manaCastingHandler = new ManaCastingHandler();

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
    const testCharacter = await createTestSpellcaster({
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
  });

  describe("isAvailable", () => {
    it("should return true for spells with mana resource costs", () => {
      const context = {
        spell: testSpells.tier1Spell,
        options: { methodType: "mana" as const, targetTier: 1 },
      };
      const available = manaCastingHandler.isAvailable(context);
      expect(available).toBe(true);
    });

    it("should return true for cantrips without resource costs", () => {
      const context = {
        spell: testSpells.cantrip,
        options: { methodType: "mana" as const, targetTier: 0 },
      };
      const available = manaCastingHandler.isAvailable(context);
      expect(available).toBe(true);
    });

    it("should return false for spells above character tier access", () => {
      const tier7Spell: SpellAbilityDefinition = {
        ...testSpells.tier2Spell,
        id: "test-tier7",
        tier: 7,
        resourceCost: {
          type: "fixed",
          resourceId: "mana",
          amount: 7,
        },
      };

      const context = {
        spell: tier7Spell,
        options: { methodType: "mana" as const, targetTier: 7 },
      };
      const available = manaCastingHandler.isAvailable(context);
      expect(available).toBe(false);
    });

    it("should return false for spells without resource costs", () => {
      const context = {
        spell: testSpells.noResourceSpell,
        options: { methodType: "mana" as const, targetTier: 1 },
      };
      const available = manaCastingHandler.isAvailable(context);
      expect(available).toBe(false);
    });
  });

  describe("calculateCost", () => {
    it("should calculate correct cost for tier 1 spell", () => {
      const context = {
        spell: testSpells.tier1Spell,
        options: { methodType: "mana" as const, targetTier: 1 },
      };
      const cost = manaCastingHandler.calculateCost(context);

      expect(cost.canAfford).toBe(true);
      expect(cost.description).toBe("1 Mana");
      expect(cost.warningMessage).toBeUndefined();
    });

    it("should calculate correct cost with extra tiers", () => {
      const context = {
        spell: testSpells.tier1Spell,
        options: { methodType: "mana" as const, targetTier: 3 },
      };
      const cost = manaCastingHandler.calculateCost(context);

      expect(cost.canAfford).toBe(true);
      expect(cost.description).toBe("3 Mana"); // 1 base + 2 extra
    });

    it("should indicate insufficient resources when character doesn't have enough mana", () => {
      const context = {
        spell: testSpells.tier2Spell,
        options: { methodType: "mana" as const, targetTier: 6 },
      };
      const cost = manaCastingHandler.calculateCost(context);

      expect(cost.canAfford).toBe(false);
      expect(cost.description).toBe("6 Mana");
      expect(cost.warningMessage).toBeDefined();
    });

    it("should handle cantrips (no resource cost)", () => {
      const context = {
        spell: testSpells.cantrip,
        options: { methodType: "mana" as const, targetTier: 0 },
      };
      const cost = manaCastingHandler.calculateCost(context);

      expect(cost.canAfford).toBe(true);
      expect(cost.description).toBe("0 mana");
    });
  });

  describe("cast", () => {
    it("should successfully cast tier 1 spell and consume mana", async () => {
      const characterService = getCharacterService();
      const initialResources = characterService.getResources();
      const initialMana = initialResources.find((r) => r.definition.id === "mana")?.current || 0;

      const context = {
        spell: testSpells.tier1Spell,
        options: { methodType: "mana" as const, targetTier: 1 },
      };
      const result = await manaCastingHandler.cast(context);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.effectiveSpellTier).toBe(1);

      // Verify mana was consumed
      const finalResources = characterService.getResources();
      const finalMana = finalResources.find((r) => r.definition.id === "mana")?.current || 0;
      expect(finalMana).toBe(initialMana - 1);
    });

    it("should successfully cast cantrip without consuming mana", async () => {
      const characterService = getCharacterService();
      const initialResources = characterService.getResources();
      const initialMana = initialResources.find((r) => r.definition.id === "mana")?.current || 0;

      const context = {
        spell: testSpells.cantrip,
        options: { methodType: "mana" as const, targetTier: 0 },
      };
      const result = await manaCastingHandler.cast(context);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.effectiveSpellTier).toBe(0);

      // Verify no mana was consumed
      const finalResources = characterService.getResources();
      const finalMana = finalResources.find((r) => r.definition.id === "mana")?.current || 0;
      expect(finalMana).toBe(initialMana);
    });

    it("should successfully cast spell with extra tiers (upcasting)", async () => {
      const characterService = getCharacterService();
      const initialResources = characterService.getResources();
      const initialMana = initialResources.find((r) => r.definition.id === "mana")?.current || 0;

      const context = {
        spell: testSpells.tier1Spell,
        options: { methodType: "mana" as const, targetTier: 2 },
      };
      const result = await manaCastingHandler.cast(context);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.effectiveSpellTier).toBe(2);

      // Verify 2 mana was consumed (1 base + 1 extra)
      const finalResources = characterService.getResources();
      const finalMana = finalResources.find((r) => r.definition.id === "mana")?.current || 0;
      expect(finalMana).toBe(initialMana - 2);
    });

    it("should fail when character doesn't have enough mana", async () => {
      const context = {
        spell: testSpells.tier2Spell,
        options: { methodType: "mana" as const, targetTier: 6 },
      };
      const result = await manaCastingHandler.cast(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot afford to cast using Mana");
    });

    it("should handle multiple spell casts until mana is exhausted", async () => {
      const characterService = getCharacterService();
      let successfulCasts = 0;

      // Keep casting until we run out of mana
      for (let i = 0; i < 10; i++) {
        const context = {
          spell: testSpells.tier1Spell,
          options: { methodType: "mana" as const, targetTier: 1 },
        };
        const result = await manaCastingHandler.cast(context);

        if (result.success) {
          successfulCasts++;
        } else {
          break;
        }
      }

      // Should have cast 5 times (started with 5 mana, each spell costs 1)
      expect(successfulCasts).toBe(5);

      // Verify mana is now 0
      const resources = characterService.getResources();
      const manaResource = resources.find((r) => r.definition.id === "mana");
      expect(manaResource?.current).toBe(0);
    });
  });

  describe("getDescription", () => {
    it("should return correct description for mana casting method", () => {
      const description = manaCastingHandler.getDescription();

      expect(description).toContain("Traditional spellcasting");
      expect(description).toContain("Safe and predictable");
    });
  });

  describe("getDisplayName", () => {
    it("should return correct display name", () => {
      const displayName = manaCastingHandler.getDisplayName();
      expect(displayName).toBe("Mana");
    });
  });
});
