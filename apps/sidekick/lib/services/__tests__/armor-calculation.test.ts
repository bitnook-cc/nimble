import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Character } from "../../schemas/character";
import type { ArmorItem } from "../../schemas/inventory";
import { CharacterService } from "../character-service";
import { ServiceFactory, getCharacterService } from "../service-factory";
import { createTestCharacter, loadCharacterForTesting } from "./test-utils";

// Use a background with no stat bonuses to avoid interfering with armor calculations
const TEST_BACKGROUND = "academy-dropout";

describe("Armor Calculation", () => {
  let characterService: CharacterService;

  beforeEach(() => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");
    characterService = getCharacterService();
  });

  afterEach(() => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  function addArmorItem(
    character: Character,
    overrides: Partial<ArmorItem> & { armor: number },
  ): ArmorItem {
    const item: ArmorItem = {
      id: `armor-${character.inventory.items.length}`,
      name: "Test Armor",
      type: "armor",
      size: 1,
      equipped: true,
      ...overrides,
    };
    character.inventory.items.push(item);
    return item;
  }

  describe("Unarmored (no main armor)", () => {
    it("should default to DEX when no armor is equipped", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 3 },
      });
      await loadCharacterForTesting(character);

      const effectiveDex = characterService.getAttributes().dexterity;
      expect(characterService.getArmorValue()).toBe(effectiveDex);
    });

    it("should use class baseArmorFormula when defined (Zephyr: STR + DEX)", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "zephyr",
        attributes: { strength: 2, dexterity: 3 },
      });
      await loadCharacterForTesting(character);

      const attrs = characterService.getAttributes();
      // Zephyr formula is STR + DEX
      expect(characterService.getArmorValue()).toBe(attrs.strength + attrs.dexterity);
    });

    it("should add non-main armor (shield) to base armor formula", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "zephyr",
        attributes: { strength: 2, dexterity: 3 },
      });
      addArmorItem(character, { name: "Shield", armor: 2, isMainArmor: false });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      const attrs = characterService.getAttributes();
      // STR + DEX + shield(2)
      expect(characterService.getArmorValue()).toBe(attrs.strength + attrs.dexterity + 2);
    });

    it("should add non-main armor (shield) to default DEX base", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 3 },
      });
      addArmorItem(character, { name: "Shield", armor: 2, isMainArmor: false });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      const effectiveDex = characterService.getAttributes().dexterity;
      // DEX + shield(2)
      expect(characterService.getArmorValue()).toBe(effectiveDex + 2);
    });

    it("should handle zero attributes gracefully", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 0 },
      });
      await loadCharacterForTesting(character);

      const effectiveDex = characterService.getAttributes().dexterity;
      expect(characterService.getArmorValue()).toBe(effectiveDex);
    });
  });

  describe("Armored (main armor equipped)", () => {
    it("should use main armor + DEX when no dex cap", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 3 },
      });
      addArmorItem(character, { name: "Light Armor", armor: 4, isMainArmor: true });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      const effectiveDex = characterService.getAttributes().dexterity;
      // armor(4) + DEX
      expect(characterService.getArmorValue()).toBe(4 + effectiveDex);
    });

    it("should cap DEX by maxDexBonus on main armor", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 4 },
      });
      addArmorItem(character, {
        name: "Medium Armor",
        armor: 6,
        isMainArmor: true,
        maxDexBonus: 2,
      });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      const effectiveDex = characterService.getAttributes().dexterity;
      // armor(6) + min(DEX, 2)
      expect(characterService.getArmorValue()).toBe(6 + Math.min(effectiveDex, 2));
    });

    it("should not cap DEX when DEX is below maxDexBonus", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 1 },
      });
      addArmorItem(character, {
        name: "Medium Armor",
        armor: 6,
        isMainArmor: true,
        maxDexBonus: 5,
      });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      const effectiveDex = characterService.getAttributes().dexterity;
      // DEX below cap, no capping: armor(6) + DEX
      expect(characterService.getArmorValue()).toBe(6 + effectiveDex);
    });

    it("should add non-main armor to main armor value", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 2 },
      });
      addArmorItem(character, { name: "Plate Armor", armor: 8, isMainArmor: true, maxDexBonus: 0 });
      addArmorItem(character, { name: "Shield", armor: 2, isMainArmor: false });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      // armor(8) + shield(2) + min(DEX, 0) = 10
      expect(characterService.getArmorValue()).toBe(8 + 2 + 0);
    });

    it("should use lowest maxDexBonus across all armor pieces", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "mage",
        attributes: { dexterity: 5 },
      });
      addArmorItem(character, {
        name: "Medium Armor",
        armor: 6,
        isMainArmor: true,
        maxDexBonus: 3,
      });
      addArmorItem(character, {
        name: "Heavy Shield",
        armor: 3,
        isMainArmor: false,
        maxDexBonus: 1,
      });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      const effectiveDex = characterService.getAttributes().dexterity;
      // armor(6) + shield(3) + min(DEX, min(3,1)) = 6 + 3 + 1
      expect(characterService.getArmorValue()).toBe(6 + 3 + Math.min(effectiveDex, 1));
    });

    it("should ignore baseArmorFormula when main armor is equipped", async () => {
      const character = await createTestCharacter({
        backgroundId: TEST_BACKGROUND,
        classId: "zephyr",
        attributes: { strength: 4, dexterity: 3 },
      });
      addArmorItem(character, { name: "Chain Mail", armor: 6, isMainArmor: true, maxDexBonus: 2 });
      await characterService.updateCharacter(character);
      await loadCharacterForTesting(character);

      const attrs = characterService.getAttributes();
      // Should NOT use STR+DEX formula; should use armor(6) + min(DEX, 2)
      expect(characterService.getArmorValue()).toBe(6 + Math.min(attrs.dexterity, 2));
      // Verify it's different from what baseArmorFormula would give
      expect(characterService.getArmorValue()).not.toBe(attrs.strength + attrs.dexterity);
    });
  });
});
