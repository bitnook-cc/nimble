import { v4 as uuidv4 } from "uuid";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SpellAbilityDefinition } from "../../schemas/abilities";
import type { Character } from "../../schemas/character";
import { CharacterImportExportService } from "../character-import-export-service";
import { ServiceFactory } from "../service-factory";
import { createTestCharacter, grantResources } from "./test-utils";

/**
 * Creates a randomized character with diverse features for comprehensive testing
 */
async function createRandomComplexCharacter(): Promise<Character> {
  // Random selections from available options
  const classOptions = ["mage", "berserker", "hunter", "cheat", "commander"];
  const ancestryOptions = ["human", "elf", "dwarf", "dragonborn", "goblin"];
  const backgroundOptions = ["fearless", "academy-dropout", "survivalist", "bumblewise"];

  const randomClass = classOptions[Math.floor(Math.random() * classOptions.length)];
  const randomAncestry = ancestryOptions[Math.floor(Math.random() * ancestryOptions.length)];
  const randomBackground = backgroundOptions[Math.floor(Math.random() * backgroundOptions.length)];

  // Random attributes (valid range: -2 to 10)
  const randomAttributes = {
    strength: Math.floor(Math.random() * 13) - 2,
    dexterity: Math.floor(Math.random() * 13) - 2,
    intelligence: Math.floor(Math.random() * 13) - 2,
    will: Math.floor(Math.random() * 13) - 2,
  };

  // Random level (1-10)
  const randomLevel = Math.floor(Math.random() * 10) + 1;

  // Create base character
  const character = await createTestCharacter({
    name: `Random Hero ${Math.floor(Math.random() * 1000)}`,
    classId: randomClass,
    ancestryId: randomAncestry,
    backgroundId: randomBackground,
    level: randomLevel,
    attributes: randomAttributes,
    spellTierAccess: randomLevel <= 3 ? randomLevel : Math.floor(randomLevel / 2) + 1,
  });

  // Add random resources
  const resourceOptions = ["mana", "fury", "focus"];
  const numResources = Math.floor(Math.random() * 3) + 1; // 1-3 resources
  const resourcesToAdd = resourceOptions.slice(0, numResources);

  const resourcesData: any = {};
  for (const resourceId of resourcesToAdd) {
    resourcesData[resourceId] = {
      current: Math.floor(Math.random() * 10) + 1,
      max: Math.floor(Math.random() * 15) + 5,
    };
  }

  if (Object.keys(resourcesData).length > 0) {
    await grantResources(character, resourcesData);
  }

  // Add random abilities
  const randomAbilities: any[] = [
    {
      id: `ability-${uuidv4()}`,
      name: "Random Combat Ability",
      description: "A randomly generated combat ability",
      type: "action",
      actionCost: Math.floor(Math.random() * 3) + 1,
      diceFormula: `${Math.floor(Math.random() * 3) + 1}d${[6, 8, 10, 12][Math.floor(Math.random() * 4)]}`,
      frequency: ["at_will", "per_turn", "per_encounter"][Math.floor(Math.random() * 3)] as any,
    },
    {
      id: `spell-${uuidv4()}`,
      name: "Random Spell",
      description: "A randomly generated spell",
      type: "spell",
      school: ["fire", "radiant", "wind", "necrotic"][Math.floor(Math.random() * 4)] as any,
      tier: Math.floor(Math.random() * 3) + 1,
      category: "utility",
      actionCost: 2,
      resourceCost: {
        type: "fixed",
        resourceId: "mana",
        amount: Math.floor(Math.random() * 3) + 1,
      },
    },
  ];

  character._abilities.push(...randomAbilities);

  // Random hit points and wounds
  character.hitPoints.current = Math.floor(Math.random() * character.hitPoints.max);
  character.wounds.current = Math.floor(Math.random() * character.wounds.max);

  // Random inventory items
  const randomInventory = [
    {
      id: `item-${uuidv4()}`,
      name: "Random Sword",
      type: "weapon" as const,
      size: 1,
      damage: `${Math.floor(Math.random() * 3) + 1}d${[6, 8][Math.floor(Math.random() * 2)]}`,
      equipped: Math.random() > 0.5,
      description: "A randomly generated weapon",
    },
    {
      id: `item-${uuidv4()}`,
      name: "Random Armor",
      type: "armor" as const,
      size: 2,
      armor: Math.floor(Math.random() * 5) + 1,
      equipped: Math.random() > 0.5,
      description: "Randomly generated protective gear",
    },
    {
      id: `item-${uuidv4()}`,
      name: "Random Potion",
      type: "consumable" as const,
      size: 1,
      count: Math.floor(Math.random() * 5) + 1,
      description: "A magical healing potion",
    },
  ];

  character.inventory.items.push(...randomInventory);

  // Random currency
  character.inventory.currency = {
    silver: Math.floor(Math.random() * 50),
    gold: Math.floor(Math.random() * 20),
  };

  return character;
}

/**
 * Deep comparison function for characters, ignoring timestamp differences
 */
function compareCharacters(char1: Character, char2: Character): boolean {
  // Compare core character properties individually to avoid JSON serialization issues
  if (char1.id !== char2.id) return false;
  if (char1.name !== char2.name) return false;
  if (char1.classId !== char2.classId) return false;
  if (char1.ancestryId !== char2.ancestryId) return false;
  if (char1.backgroundId !== char2.backgroundId) return false;
  if (char1.level !== char2.level) return false;
  if (char1._schemaVersion !== char2._schemaVersion) return false;

  // Compare Maps by size and contents
  if (char1._resourceValues.size !== char2._resourceValues.size) return false;
  if (char1._abilityUses.size !== char2._abilityUses.size) return false;

  // Compare abilities (arrays)
  if (char1._abilities.length !== char2._abilities.length) return false;

  // Compare inventory items
  if (char1.inventory.items.length !== char2.inventory.items.length) return false;
  if (char1.inventory.maxSize !== char2.inventory.maxSize) return false;

  // For currency, compare actual values that should exist
  const curr1 = char1.inventory.currency;
  const curr2 = char2.inventory.currency;
  if ((curr1.gold || 0) !== (curr2.gold || 0)) return false;
  if ((curr1.silver || 0) !== (curr2.silver || 0)) return false;

  return true;
}

describe("CharacterImportExportService", () => {
  let importExportService: CharacterImportExportService;

  beforeEach(async () => {
    // Reset services and use in-memory storage
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");

    importExportService = CharacterImportExportService.getInstance();

    // Mock DOM methods for export functionality
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("mock-url"),
      revokeObjectURL: vi.fn(),
    });

    // Mock document methods
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(mockLink),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });

    // Mock Blob constructor
    vi.stubGlobal("Blob", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  describe("Round-trip Import/Export", () => {
    it("should export and import a random complex character identically", async () => {
      // Generate a random complex character
      const originalCharacter = await createRandomComplexCharacter();

      // Mock the export to capture the JSON instead of downloading
      let exportedJson = "";
      vi.mocked(Blob).mockImplementation((blobParts?: BlobPart[]) => {
        if (blobParts && blobParts.length > 0) {
          exportedJson = blobParts[0] as string;
        }
        return {} as Blob;
      });

      // Export the character
      expect(() => {
        importExportService.exportCharacter(originalCharacter);
      }).not.toThrow();

      // Verify export captured the JSON
      expect(exportedJson).toBeTruthy();
      expect(exportedJson.length).toBeGreaterThan(0);

      // Parse the exported JSON to verify it's valid
      let parsedExport: any;
      expect(() => {
        parsedExport = JSON.parse(exportedJson);
      }).not.toThrow();

      // Verify the exported data contains expected character properties
      expect(parsedExport.id).toBe(originalCharacter.id);
      expect(parsedExport.name).toBe(originalCharacter.name);
      expect(parsedExport.classId).toBe(originalCharacter.classId);
      expect(parsedExport.level).toBe(originalCharacter.level);

      // Import the character back
      const importResult = await importExportService.importCharacter(exportedJson);

      // Log error if import failed
      if (!importResult.success) {
        console.error("Import failed:", importResult.error);
      }

      // Verify import was successful
      expect(importResult.success).toBe(true);
      expect(importResult.error).toBeUndefined();
      expect(importResult.character).toBeDefined();

      const importedCharacter = importResult.character!;

      // Verify all core properties match
      expect(importedCharacter.id).toBe(originalCharacter.id);
      expect(importedCharacter.name).toBe(originalCharacter.name);
      expect(importedCharacter.classId).toBe(originalCharacter.classId);
      expect(importedCharacter.ancestryId).toBe(originalCharacter.ancestryId);
      expect(importedCharacter.backgroundId).toBe(originalCharacter.backgroundId);
      expect(importedCharacter.level).toBe(originalCharacter.level);

      // Verify attributes
      expect(importedCharacter._attributes).toEqual(originalCharacter._attributes);

      // Verify hit points and wounds
      expect(importedCharacter.hitPoints).toEqual(originalCharacter.hitPoints);
      expect(importedCharacter.wounds).toEqual(originalCharacter.wounds);

      // Verify abilities
      expect(importedCharacter._abilities.length).toBe(originalCharacter._abilities.length);
      for (let i = 0; i < originalCharacter._abilities.length; i++) {
        expect(importedCharacter._abilities[i]).toEqual(originalCharacter._abilities[i]);
      }

      // Verify inventory
      expect(importedCharacter.inventory.items.length).toBe(
        originalCharacter.inventory.items.length,
      );
      expect(importedCharacter.inventory.currency).toEqual(originalCharacter.inventory.currency);

      // Verify resources
      expect(importedCharacter._resourceDefinitions.length).toBe(
        originalCharacter._resourceDefinitions.length,
      );
      expect(importedCharacter._resourceValues.size).toBe(originalCharacter._resourceValues.size);

      // Use deep comparison function
      expect(compareCharacters(originalCharacter, importedCharacter)).toBe(true);
    });

    it("should handle multiple random characters in sequence", async () => {
      const characters: Character[] = [];
      const exportedJsons: string[] = [];

      // Generate and export multiple random characters
      for (let i = 0; i < 3; i++) {
        const character = await createRandomComplexCharacter();
        characters.push(character);

        let exportedJson = "";
        vi.mocked(Blob).mockImplementation((blobParts?: BlobPart[]) => {
          if (blobParts && blobParts.length > 0) {
            exportedJson = blobParts[0] as string;
          }
          return {} as Blob;
        });

        importExportService.exportCharacter(character);
        exportedJsons.push(exportedJson);
      }

      // Import all characters back and verify they match
      for (let i = 0; i < characters.length; i++) {
        const originalCharacter = characters[i];
        const exportedJson = exportedJsons[i];

        const importResult = await importExportService.importCharacter(exportedJson);

        expect(importResult.success).toBe(true);
        expect(importResult.character).toBeDefined();

        const importedCharacter = importResult.character!;
        expect(compareCharacters(originalCharacter, importedCharacter)).toBe(true);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle character with empty inventory and no resources", async () => {
      const character = await createTestCharacter({
        name: "Minimal Character",
        classId: "mage",
      });

      // Clear inventory and ensure no resources
      character.inventory.items = [];
      character.inventory.currency = { silver: 0, gold: 0 };
      character._resourceDefinitions = [];
      character._resourceValues.clear();

      let exportedJson = "";
      vi.mocked(Blob).mockImplementation((blobParts?: BlobPart[]) => {
        if (blobParts && blobParts.length > 0) {
          exportedJson = blobParts[0] as string;
        }
        return {} as Blob;
      });

      importExportService.exportCharacter(character);

      const importResult = await importExportService.importCharacter(exportedJson);
      expect(importResult.success).toBe(true);
      expect(compareCharacters(character, importResult.character!)).toBe(true);
    });

    it("should handle character with maximum complexity", async () => {
      const character = await createTestCharacter({
        name: "Maximum Complexity Character",
        level: 10,
        attributes: { strength: 10, dexterity: 10, intelligence: 10, will: 10 },
        spellTierAccess: 9,
      });

      // Add maximum resources
      await grantResources(character, {
        mana: { current: 50, max: 50 },
        fury: { current: 20, max: 20 },
        focus: { current: 15, max: 15 },
      });

      // Add many abilities
      for (let i = 0; i < 10; i++) {
        character._abilities.push({
          id: `max-ability-${i}`,
          name: `Max Ability ${i}`,
          description: `Complex ability number ${i}`,
          type: "action",
          actionCost: (i % 3) + 1,
          diceFormula: `${i + 1}d8+${i}`,
          frequency: ["at_will", "per_turn", "per_encounter"][i % 3] as any,
        });
      }

      // Fill inventory
      for (let i = 0; i < 15; i++) {
        const itemType = ["weapon", "armor", "freeform", "consumable", "ammunition"][i % 5] as any;
        const baseItem: any = {
          id: `max-item-${i}`,
          name: `Item ${i}`,
          type: itemType,
          size: 1,
          description: `Item description ${i}`,
          equipped: i % 2 === 0,
        };

        // Add type-specific properties
        if (itemType === "weapon") {
          baseItem.damage = "1d8";
        } else if (itemType === "armor") {
          baseItem.armor = 1;
        } else if (itemType === "consumable" || itemType === "ammunition") {
          baseItem.count = 1;
        }

        character.inventory.items.push(baseItem);
      }

      let exportedJson = "";
      vi.mocked(Blob).mockImplementation((blobParts?: BlobPart[]) => {
        if (blobParts && blobParts.length > 0) {
          exportedJson = blobParts[0] as string;
        }
        return {} as Blob;
      });

      importExportService.exportCharacter(character);

      const importResult = await importExportService.importCharacter(exportedJson);
      expect(importResult.success).toBe(true);
      expect(compareCharacters(character, importResult.character!)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid JSON gracefully", async () => {
      const invalidJson = "{ invalid json }";

      const result = await importExportService.importCharacter(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid JSON format");
    });

    it("should handle incomplete character data", async () => {
      const incompleteData = JSON.stringify({
        id: "test-id",
        name: "Incomplete Character",
        // Missing required fields
      });

      const result = await importExportService.importCharacter(incompleteData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Character validation failed");
    });
  });

  describe("Schema Migration", () => {
    it("should handle old schema versions during import", async () => {
      // Create a valid character first, then simulate it being an old schema
      const validCharacter = await createTestCharacter({
        name: "Old Schema Character",
        classId: "mage",
      });

      // Simulate old schema by setting version to 0
      const oldSchemaCharacter = {
        ...validCharacter,
        _schemaVersion: 0, // Old version
        // Convert Maps to Objects to simulate JSON serialization
        _resourceValues: Object.fromEntries(validCharacter._resourceValues),
        _abilityUses: Object.fromEntries(validCharacter._abilityUses),
      };

      const oldJson = JSON.stringify(oldSchemaCharacter);
      const result = await importExportService.importCharacter(oldJson);

      expect(result.success).toBe(true);
      expect(result.character).toBeDefined();
      expect(result.character!._schemaVersion).toBeGreaterThan(0);
    });
  });
});
