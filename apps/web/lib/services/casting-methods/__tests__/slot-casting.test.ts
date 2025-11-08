import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import type { Character } from "@/lib/schemas/character";
import type { ResourceDefinition } from "@/lib/schemas/resources";

import { createTestCharacter } from "../../__tests__/test-utils";
import { activityLogService } from "../../activity-log-service";
import { getCharacterService } from "../../service-factory";
import type { SlotCastingOptions } from "../../spell-casting-types";
import { SlotCastingHandler } from "../slot-casting";

// Mock activity log service
vi.mock("../../activity-log-service", () => ({
  activityLogService: {
    createSpellCastEntry: vi.fn((name, school, tier, actionCost, resource) => ({
      type: "spell_cast",
      spell: name,
      school,
      tier,
      actionCost,
      resource,
      timestamp: new Date().toISOString(),
    })),
    addLogEntry: vi.fn(),
  },
}));

// Mock effect service
vi.mock("../../effect-service", () => ({
  effectService: {
    applyEffects: vi.fn(),
  },
}));

describe("SlotCastingHandler", () => {
  let handler: SlotCastingHandler;
  let character: Character;
  let testSpell: SpellAbilityDefinition;
  let pilferedPowerResource: ResourceDefinition;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create handler
    handler = new SlotCastingHandler();

    // Create pilfered power resource definition
    pilferedPowerResource = {
      id: "pilfered_power",
      name: "Pilfered Power",
      description: "Slots borrowed from your patron",
      colorScheme: "purple-mystic",
      icon: "gem",
      resetCondition: "safe_rest",
      resetType: "to_max",
      minValue: { type: "fixed", value: 0 },
      maxValue: { type: "formula", expression: "DEX" }, // Max = DEX attribute
    };

    // Create test character with DEX = 3
    character = await createTestCharacter({
      name: "Slot Caster",
      classId: "mage",
      attributes: {
        dexterity: 3,
        intelligence: 2,
        will: 1,
        strength: 0,
      },
    });

    // Grant pilfered power resource with 3 current slots (max = DEX = 3)
    character._resourceDefinitions.push(pilferedPowerResource);
    character._resourceValues.set("pilfered_power", { type: "numerical", value: 3 });
    character._spellTierAccess = 5; // Tier 5 access

    // Update character in service
    const characterService = getCharacterService();
    await characterService.updateCharacter(character);
    await characterService.loadCharacter(character.id);

    // Create test spell (tier 2 fire spell)
    testSpell = {
      id: "fireball",
      name: "Fireball",
      description: "A ball of fire",
      type: "spell",
      tier: 2,
      school: "fire",
      category: "combat",
      actionCost: 1,
    };
  });

  describe("isAvailable", () => {
    it("should be available for tiered spells when character has pilfered power resource", () => {
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      expect(handler.isAvailable(context)).toBe(true);
    });

    it("should be available for cantrips (tier 0) without pilfered power resource", async () => {
      // Remove the pilfered power resource
      character._resourceDefinitions = [];
      character._resourceValues.clear();
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const cantripSpell: SpellAbilityDefinition = {
        ...testSpell,
        tier: 0,
      };
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: cantripSpell, options };

      expect(handler.isAvailable(context)).toBe(true);
    });

    it("should not be available when character lacks pilfered power resource", async () => {
      // Remove the pilfered power resource
      character._resourceDefinitions = [];
      character._resourceValues.clear();

      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      expect(handler.isAvailable(context)).toBe(false);
    });

    it("should not be available when spell tier exceeds character tier access", async () => {
      // Set tier access to 1, spell is tier 2
      character._spellTierAccess = 1;

      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      expect(handler.isAvailable(context)).toBe(false);
    });

    it("should not be available for invalid method type", () => {
      const options = { methodType: "mana" as const, targetTier: 2 };
      const context = { spell: testSpell, options };

      expect(handler.isAvailable(context)).toBe(false);
    });
  });

  describe("calculateCost", () => {
    it("should calculate cantrips as free (0 slots)", async () => {
      // Remove pilfered power to ensure cantrips don't need it
      character._resourceDefinitions = [];
      character._resourceValues.clear();
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const cantripSpell: SpellAbilityDefinition = {
        ...testSpell,
        tier: 0,
      };
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: cantripSpell, options };

      const cost = handler.calculateCost(context);

      expect(cost.canAfford).toBe(true);
      expect(cost.description).toBe("0 slots (cantrip)");
      expect(cost.riskLevel).toBe("none");
      expect(cost.warningMessage).toBeUndefined();
    });

    it("should calculate cost as 1 slot when slots are available", () => {
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const cost = handler.calculateCost(context);

      expect(cost.canAfford).toBe(true);
      expect(cost.description).toBe("1 Slot (cast at tier 5)"); // Max tier access = 5
      expect(cost.riskLevel).toBe("none");
      expect(cost.warningMessage).toBeUndefined();
    });

    it("should show correct effective tier based on spell tier access", async () => {
      // Set tier access to 3
      character._spellTierAccess = 3;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const cost = handler.calculateCost(context);

      expect(cost.description).toBe("1 Slot (cast at tier 3)");
    });

    it("should cap effective tier at 9", async () => {
      // Set tier access to 9 (max allowed)
      character._spellTierAccess = 9;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const cost = handler.calculateCost(context);

      expect(cost.description).toBe("1 Slot (cast at tier 9)");
    });

    it("should indicate cannot afford when no slots available", async () => {
      // Set current slots to 0
      character._resourceValues.set("pilfered_power", { type: "numerical", value: 0 });
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const cost = handler.calculateCost(context);

      expect(cost.canAfford).toBe(false);
      expect(cost.description).toBe("No slots available");
      expect(cost.warningMessage).toContain("No pilfered power slots remaining");
    });

    it("should handle missing resource definition", async () => {
      // Remove resource definition
      character._resourceDefinitions = [];
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const cost = handler.calculateCost(context);

      expect(cost.canAfford).toBe(false);
      expect(cost.description).toBe("Missing pilfered power resource");
      expect(cost.warningMessage).toContain("does not have the pilfered power resource");
    });

    it("should return error for invalid method type", () => {
      const options = { methodType: "mana" as const, targetTier: 2 };
      const context = { spell: testSpell, options };

      const cost = handler.calculateCost(context);

      expect(cost.canAfford).toBe(false);
      expect(cost.description).toBe("Invalid casting method");
    });
  });

  describe("cast", () => {
    it("should successfully cast cantrip without pilfered power resource", async () => {
      // Remove pilfered power resource
      character._resourceDefinitions = [];
      character._resourceValues.clear();
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const cantripSpell: SpellAbilityDefinition = {
        ...testSpell,
        tier: 0,
        actionCost: 0,
      };
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: cantripSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(true);
      expect(result.effectiveSpellTier).toBe(0); // Cantrips are tier 0
    });

    it("should successfully cast spell and spend 1 slot", async () => {
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(true);
      expect(result.effectiveSpellTier).toBe(5); // Max tier access

      // Verify slot was spent
      const characterService = getCharacterService();
      const updatedCharacter = characterService.getCurrentCharacter();
      const currentSlots = updatedCharacter?._resourceValues.get("pilfered_power");
      expect(currentSlots?.type).toBe("numerical");
      if (currentSlots?.type === "numerical") {
        expect(currentSlots.value).toBe(2); // Started with 3, spent 1
      }
    });

    it("should cast at highest unlocked tier", async () => {
      // Spell tier 2, character has tier 7 access
      character._spellTierAccess = 7;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(true);
      expect(result.effectiveSpellTier).toBe(7);
    });

    it("should cap effective tier at 9", async () => {
      // Character has tier 9 access (max allowed)
      character._spellTierAccess = 9;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(true);
      expect(result.effectiveSpellTier).toBe(9);
    });

    it("should deduct action cost when in encounter", async () => {
      // Put character in encounter with 2 actions
      character.inEncounter = true;
      character.actionTracker.current = 2;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options }; // Spell has actionCost: 1

      const result = await handler.cast(context);

      expect(result.success).toBe(true);

      // Verify action was spent
      const updatedCharacter = characterService.getCurrentCharacter();
      expect(updatedCharacter?.actionTracker.current).toBe(1); // Started with 2, spent 1
    });

    it("should fail when not enough actions available", async () => {
      // Put character in encounter with 0 actions
      character.inEncounter = true;
      character.actionTracker.current = 0;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options }; // Spell has actionCost: 1

      const result = await handler.cast(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not enough actions");
    });

    it("should not deduct actions when not in encounter", async () => {
      character.inEncounter = false;
      character.actionTracker.current = 0;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(true);
      // Actions should remain at 0
      const updatedCharacter = characterService.getCurrentCharacter();
      expect(updatedCharacter?.actionTracker.current).toBe(0);
    });

    it("should fail when no slots available", async () => {
      // Set current slots to 0
      character._resourceValues.set("pilfered_power", { type: "numerical", value: 0 });
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot afford to cast spell");
    });

    it("should fail when resource definition missing", async () => {
      // Remove resource definition
      character._resourceDefinitions = [];
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot afford to cast spell");
    });

    it("should log cantrip cast without resource cost", async () => {
      // Remove pilfered power resource
      character._resourceDefinitions = [];
      character._resourceValues.clear();
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const cantripSpell: SpellAbilityDefinition = {
        ...testSpell,
        tier: 0,
        actionCost: 0,
      };
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: cantripSpell, options };

      await handler.cast(context);

      expect(activityLogService.createSpellCastEntry).toHaveBeenCalledWith(
        "Fireball",
        "fire",
        0, // Cantrip tier
        0, // Action cost
        undefined, // No resource cost for cantrips
      );

      expect(activityLogService.addLogEntry).toHaveBeenCalled();
    });

    it("should log the spell cast with correct details", async () => {
      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: testSpell, options };

      await handler.cast(context);

      expect(activityLogService.createSpellCastEntry).toHaveBeenCalledWith(
        "Fireball",
        "fire",
        5, // Effective tier
        1, // Action cost
        {
          resourceId: "pilfered_power",
          resourceName: "Pilfered Power",
          amount: 1,
        },
      );

      expect(activityLogService.addLogEntry).toHaveBeenCalled();
    });

    it("should apply spell effects if present", async () => {
      const spellWithEffects: SpellAbilityDefinition = {
        ...testSpell,
        effects: [
          {
            type: "damage",
            diceFormula: "2d6+5",
          },
        ],
      };

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: spellWithEffects, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(true);

      // Import should have been called
      const { effectService } = await import("../../effect-service");
      expect(effectService.applyEffects).toHaveBeenCalledWith(spellWithEffects.effects, "Fireball");
    });

    it("should handle spells with 0 action cost", async () => {
      const freeActionSpell: SpellAbilityDefinition = {
        ...testSpell,
        actionCost: 0,
      };

      character.inEncounter = true;
      character.actionTracker.current = 1;
      const characterService = getCharacterService();
      await characterService.updateCharacter(character);

      const options: SlotCastingOptions = { methodType: "slot" };
      const context = { spell: freeActionSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(true);

      // Actions should remain unchanged
      const updatedCharacter = characterService.getCurrentCharacter();
      expect(updatedCharacter?.actionTracker.current).toBe(1);
    });

    it("should fail for invalid method type", async () => {
      const options = { methodType: "mana" as const, targetTier: 2 };
      const context = { spell: testSpell, options };

      const result = await handler.cast(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid casting method");
    });
  });

  describe("getDescription", () => {
    it("should return appropriate description", () => {
      const description = handler.getDescription();

      expect(description).toContain("patron");
      expect(description).toContain("maximum tier");
    });
  });

  describe("getDisplayName", () => {
    it("should return 'Slot Casting'", () => {
      expect(handler.getDisplayName()).toBe("Slot Casting");
    });
  });

  describe("methodType", () => {
    it("should have methodType 'slot'", () => {
      expect(handler.methodType).toBe("slot");
    });
  });
});
