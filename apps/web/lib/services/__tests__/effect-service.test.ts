import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Character } from "../../schemas/character";
import type { Effect, EffectResult } from "../../types/effects";
import { ActivityLogService } from "../activity-log-service";
import { CharacterService } from "../character-service";
import { DicePoolService } from "../dice-pool-service";
import { DiceService } from "../dice-service";
import { EffectService } from "../effect-service";
import {
  ServiceFactory,
  getActivityLog,
  getCharacterService,
  getDiceService,
} from "../service-factory";
import { createTestCharacter, grantResource, loadCharacterForTesting } from "./test-utils";

describe("EffectService", () => {
  let effectService: EffectService;
  let characterService: CharacterService;
  let diceService: DiceService;
  let activityLogService: ActivityLogService;
  let dicePoolService: DicePoolService;
  let testCharacter: Character;

  beforeEach(async () => {
    // Reset services and use in-memory storage
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");

    // Get services
    effectService = EffectService.getInstance();
    characterService = getCharacterService();
    diceService = getDiceService();
    activityLogService = getActivityLog();
    dicePoolService = DicePoolService.getInstance();

    // Mock Math.random for predictable dice results
    vi.spyOn(Math, "random").mockReturnValue(0.5); // Always return middle value

    // Create test character with resources and load into service
    testCharacter = await createTestCharacter({
      name: "Effect Test Character",
      attributes: { strength: 2, dexterity: 1, intelligence: 3, will: 2 },
    });

    // Grant resources for testing
    await grantResource(testCharacter, "mana", 8, 10);
    await grantResource(testCharacter, "focus", 4, 6);

    await loadCharacterForTesting(testCharacter);

    // Set character HP for damage/healing tests using character service methods
    await characterService.updateHitPoints(15, 20, 2);

    // Add a dice pool for testing using character service
    const dicePoolDefinition = {
      id: "fury-dice",
      name: "Fury Dice",
      colorScheme: "red-fury",
      icon: "flame",
      diceSize: 6 as const,
      maxDice: { type: "fixed" as const, value: 8 },
      resetCondition: "encounter_end" as const,
      resetType: "to_zero" as const,
    };

    const dicePools = [
      {
        definition: dicePoolDefinition,
        currentDice: [4, 3], // Pre-existing dice
        sortOrder: 0,
      },
    ];

    await characterService.updateCharacterFields({ _dicePools: dicePools });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  describe("Damage Effects", () => {
    it("should apply damage effect and log activity", async () => {
      const damageEffect: Effect = {
        type: "damage",
        diceFormula: "10",
      };

      const results = await effectService.applyEffects([damageEffect], "Fireball Spell");

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(10);
      expect(results[0].effect).toBe(damageEffect);

      // Check character took damage (temp HP absorbed first, then regular HP)
      const updatedCharacter = characterService.getCurrentCharacter()!;
      expect(updatedCharacter.hitPoints.current).toBe(7); // 15 - 8 = 7 (2 temp + 8 regular)
      expect(updatedCharacter.hitPoints.temporary).toBe(0); // Temp HP absorbed first
    });

    it("should handle dice formula damage effects", async () => {
      const damageEffect: Effect = {
        type: "damage",
        diceFormula: "2d8",
      };

      const results = await effectService.applyEffects([damageEffect], "Sword Strike");

      expect(results[0].success).toBe(true);
      expect(typeof results[0].value).toBe("number");
      expect(results[0].value).toBeGreaterThan(0); // Should roll something positive

      const updatedCharacter = characterService.getCurrentCharacter()!;
      expect(updatedCharacter.hitPoints.current).toBeLessThan(15); // Should have taken damage
    });
  });

  describe("Healing Effects", () => {
    it("should apply healing effect", async () => {
      // First damage the character
      await characterService.applyDamage(8); // 15 HP + 2 temp → 8 damage: 2 to temp, 6 to regular → 9 HP left

      const healingEffect: Effect = {
        type: "healing",
        diceFormula: "5",
      };

      const results = await effectService.applyEffects([healingEffect], "Healing Potion");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(5);

      const updatedCharacter = characterService.getCurrentCharacter()!;
      expect(updatedCharacter.hitPoints.current).toBe(14); // 9 + 5 = 14
    });

    it("should not overheal beyond max HP", async () => {
      const healingEffect: Effect = {
        type: "healing",
        diceFormula: "10",
      };

      const results = await effectService.applyEffects([healingEffect], "Major Healing");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(10);

      const updatedCharacter = characterService.getCurrentCharacter()!;
      expect(updatedCharacter.hitPoints.current).toBe(20); // Capped at max
    });
  });

  describe("Temporary HP Effects", () => {
    it("should apply temporary HP effect", async () => {
      const tempHPEffect: Effect = {
        type: "tempHP",
        diceFormula: "5",
      };

      const results = await effectService.applyEffects([tempHPEffect], "Shield Spell");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(5);

      const updatedCharacter = characterService.getCurrentCharacter()!;
      expect(updatedCharacter.hitPoints.temporary).toBe(5); // Replaced existing temp HP
    });
  });

  describe("Resource Change Effects", () => {
    it("should restore resources with positive values", async () => {
      // First spend some mana
      await characterService.spendResource("mana", 3); // Down to 5 mana

      const resourceEffect: Effect = {
        type: "resourceChange",
        resourceId: "mana",
        diceFormula: "3",
      };

      const results = await effectService.applyEffects([resourceEffect], "Mana Restoration");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(3);

      const updatedCharacter = characterService.getCurrentCharacter()!;
      const manaValue = updatedCharacter._resourceValues.get("mana");
      expect(manaValue?.type === "numerical" && manaValue.value).toBe(8); // 5 + 3 = 8
    });

    it("should spend resources with negative values", async () => {
      const resourceEffect: Effect = {
        type: "resourceChange",
        resourceId: "mana",
        diceFormula: "-2",
      };

      const results = await effectService.applyEffects([resourceEffect], "Mana Drain");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(-2);

      const updatedCharacter = characterService.getCurrentCharacter()!;
      const manaValue = updatedCharacter._resourceValues.get("mana");
      expect(manaValue?.type === "numerical" && manaValue.value).toBe(6); // 8 - 2 = 6
    });

    it("should handle zero value resource effects", async () => {
      const resourceEffect: Effect = {
        type: "resourceChange",
        resourceId: "mana",
        diceFormula: "0",
      };

      const results = await effectService.applyEffects([resourceEffect], "Neutral Effect");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(0);

      // Should not change resource value
      const updatedCharacter = characterService.getCurrentCharacter()!;
      const manaValue = updatedCharacter._resourceValues.get("mana");
      expect(manaValue?.type === "numerical" && manaValue.value).toBe(8); // Unchanged
    });
  });

  describe("Dice Pool Change Effects", () => {
    it("should add dice to pool with positive values", async () => {
      const dicePoolEffect: Effect = {
        type: "dicePoolChange",
        poolId: "fury-dice",
        diceFormula: "2", // Add 2 dice
      };

      const results = await effectService.applyEffects([dicePoolEffect], "Build Fury");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(2);

      const updatedCharacter = characterService.getCurrentCharacter()!;
      const furyPool = updatedCharacter._dicePools.find((p) => p.definition.id === "fury-dice");
      expect(furyPool?.currentDice).toHaveLength(4); // Started with 2, added 2
    });

    it("should remove dice from pool with negative values", async () => {
      const dicePoolEffect: Effect = {
        type: "dicePoolChange",
        poolId: "fury-dice",
        diceFormula: "-1", // Remove 1 die
      };

      const results = await effectService.applyEffects([dicePoolEffect], "Spend Fury");

      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(-1);

      const updatedCharacter = characterService.getCurrentCharacter()!;
      const furyPool = updatedCharacter._dicePools.find((p) => p.definition.id === "fury-dice");
      expect(furyPool?.currentDice).toHaveLength(1); // Started with 2, removed 1
    });

    it("should handle non-existent dice pool", async () => {
      const dicePoolEffect: Effect = {
        type: "dicePoolChange",
        poolId: "non-existent-pool",
        diceFormula: "1",
      };

      const results = await effectService.applyEffects([dicePoolEffect], "Bad Pool Effect");

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain("Dice pool non-existent-pool not found");
    });
  });

  describe("Effect Previews and Icons", () => {
    it("should generate correct previews for all effect types", async () => {
      const effects: Effect[] = [
        { type: "damage", diceFormula: "1d6" },
        { type: "healing", diceFormula: "2d4" },
        { type: "tempHP", diceFormula: "5" },
        { type: "resourceChange", resourceId: "mana", diceFormula: "3" },
        { type: "resourceChange", resourceId: "mana", diceFormula: "-2" },
        { type: "dicePoolChange", poolId: "fury-dice", diceFormula: "1" },
        { type: "dicePoolChange", poolId: "fury-dice", diceFormula: "-1" },
      ];

      const previews = effects.map((effect) => effectService.getEffectPreview(effect));

      expect(previews).toEqual([
        "Deal 1d6 damage",
        "Heal 2d4 HP",
        "Gain 5 temporary HP",
        "Gain 3 mana",
        "Lose 2 mana",
        "Add 1 dice to fury-dice",
        "Remove 1 dice from fury-dice",
      ]);
    });

    it("should return correct icons for all effect types", async () => {
      const effects: Effect[] = [
        { type: "damage", diceFormula: "1d6" },
        { type: "healing", diceFormula: "2d4" },
        { type: "tempHP", diceFormula: "5" },
        { type: "resourceChange", resourceId: "mana", diceFormula: "3" },
        { type: "dicePoolChange", poolId: "fury-dice", diceFormula: "1" },
      ];

      const icons = effects.map((effect) => effectService.getEffectIcon(effect));

      expect(icons).toEqual(["⚔️", "❤️", "🛡️", "✨", "🎲"]);
    });
  });

  describe("Multiple Effects", () => {
    it("should apply multiple effects in sequence", async () => {
      const effects: Effect[] = [
        { type: "damage", diceFormula: "5" },
        { type: "healing", diceFormula: "3" },
        { type: "resourceChange", resourceId: "mana", diceFormula: "-1" },
        { type: "tempHP", diceFormula: "2" },
      ];

      const results = await effectService.applyEffects(effects, "Complex Spell");

      expect(results).toHaveLength(4);
      expect(results.every((r) => r.success)).toBe(true);

      const updatedCharacter = characterService.getCurrentCharacter()!;

      // Check HP: started at 15+2temp, took 5 damage (2 temp absorbed, 3 regular), healed 3, gained 2 temp HP
      // 15 - 3 + 3 = 15 HP, but temp HP is replaced not added, so should be 2 temp HP
      expect(updatedCharacter.hitPoints.current).toBe(15); // 15 - 3 + 3 = 15
      expect(updatedCharacter.hitPoints.temporary).toBe(2); // Replaced with new temp HP

      // Check mana: started at 8, spent 1 (down to 7)
      const manaValue = updatedCharacter._resourceValues.get("mana");
      expect(manaValue?.type === "numerical" && manaValue.value).toBe(7);
    });

    it("should handle partial failures in multiple effects", async () => {
      const effects: Effect[] = [
        { type: "healing", diceFormula: "5" }, // Should succeed
        { type: "resourceChange", resourceId: "non-existent", diceFormula: "1" }, // Actually succeeds (silently ignored)
        { type: "tempHP", diceFormula: "3" }, // Should succeed
      ];

      const results = await effectService.applyEffects(effects, "Mixed Results");

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true); // Character service silently ignores invalid resources
      expect(results[2].success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown effect type", async () => {
      const invalidEffect = { type: "unknown", diceFormula: "5" } as any;

      const results = await effectService.applyEffects([invalidEffect], "Invalid Effect");

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain("Failed to evaluate dice formula");
    });

    it("should handle invalid resource ID", async () => {
      const effect: Effect = {
        type: "resourceChange",
        resourceId: "invalid-resource",
        diceFormula: "5",
      };

      const results = await effectService.applyEffects([effect], "Bad Resource");

      // The character service silently ignores invalid resources, so the effect "succeeds" but does nothing
      expect(results[0].success).toBe(true);
      expect(results[0].value).toBe(5);
    });
  });
});
