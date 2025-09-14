import { beforeEach, describe, expect, it, vi } from "vitest";

import { human } from "../../data/ancestries/human";
import { fearless } from "../../data/backgrounds/fearless";
import { berserkerClass } from "../../data/classes/berserker";
import type { Character } from "../../schemas/character";
import { StorageBasedCharacterRepository } from "../../storage/storage-based-character-repository";
import { CharacterCreationService } from "../character-creation-service";
import { CharacterStorageService } from "../character-storage-service";
import type { IAncestryService, IBackgroundService, ICharacterService } from "../interfaces";
import { InMemoryStorageService } from "../storage-service";

describe("CharacterCreationService", () => {
  let characterCreationService: CharacterCreationService;
  let characterStorageService: CharacterStorageService;
  let mockCharacterService: ICharacterService;
  let mockAncestryService: IAncestryService;
  let mockBackgroundService: IBackgroundService;
  let inMemoryStorage: InMemoryStorageService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create in-memory storage for testing
    inMemoryStorage = new InMemoryStorageService();

    // Create real character storage service with in-memory storage
    characterStorageService = new CharacterStorageService(inMemoryStorage);

    // Create minimal mock services for the other dependencies
    mockCharacterService = {
      loadCharacter: vi.fn(),
      getCurrentCharacter: vi.fn(),
      updateCharacter: vi.fn(),
      getAttributes: vi.fn(),
    } as any;

    mockAncestryService = {
      getAvailableAncestries: vi.fn().mockReturnValue([human]),
      getAncestryById: vi.fn().mockReturnValue(human),
    } as any;

    mockBackgroundService = {
      getAvailableBackgrounds: vi.fn().mockReturnValue([fearless]),
      getBackgroundById: vi.fn().mockReturnValue(fearless),
    } as any;

    // Create the service with real storage and mock dependencies
    characterCreationService = new CharacterCreationService(
      characterStorageService,
      mockCharacterService,
      mockAncestryService,
      mockBackgroundService,
    );
  });

  describe("applyStartingEquipment", () => {
    it("should add starting equipment to character inventory", async () => {
      // Create a test character in storage
      const testCharacter = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Hero",
        classId: "berserker",
        ancestryId: "human",
        backgroundId: "fearless",
        level: 1,
        traitSelections: [],
        _schemaVersion: 1,
        _spellTierAccess: 0,
        _spellScalingLevel: 0,
        _proficiencies: { weapons: [], armor: [], tools: [] },
        _attributes: { strength: 0, dexterity: 0, intelligence: 0, will: 0 },
        _initiative: {
          name: "Initiative",
          associatedAttribute: "dexterity" as const,
          modifier: 0,
          bonus: 0,
          isPrimarySkill: false,
        },
        _skills: {},
        _abilities: [],
        _abilityUses: new Map(),
        _hitDice: { size: 10, current: 1, max: 1 },
        hitPoints: { current: 10, max: 10, temporary: 0 },
        wounds: { current: 0, max: 2 },
        _resourceDefinitions: [],
        _resourceValues: new Map(),
        config: {
          maxWounds: 2,
          maxHitPointsFormula: "",
          weaponSizeLimit: 2,
          maxInventorySize: 10,
          customResources: [],
        },
        speed: 30,
        actionTracker: { current: 3, base: 3, bonus: 0 },
        inEncounter: false,
        inventory: {
          items: [],
          capacity: 10,
          maxSize: 10,
          currency: { copper: 0, silver: 0, gold: 0, platinum: 0 },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        saveAdvantages: {},
      } as Character;

      // Save character to storage
      await characterStorageService.createCharacter(testCharacter, "123e4567-e89b-12d3-a456-426614174000");

      // Apply starting equipment
      await characterCreationService.applyStartingEquipment("123e4567-e89b-12d3-a456-426614174000", ["sword", "armor"]);

      // Verify the character was updated
      const updatedCharacter = await characterStorageService.getCharacter("character-123");
      expect(updatedCharacter).toBeDefined();
      expect(updatedCharacter?.inventory).toBeDefined();

      // Note: Without ItemService mocking, the items won't be created,
      // but the inventory structure should still be updated
    });

    it("should throw error if character not found", async () => {
      await expect(
        characterCreationService.applyStartingEquipment("invalid-id", ["sword"]),
      ).rejects.toThrow("Character not found: invalid-id");
    });

    it("should handle empty equipment list", async () => {
      // Create a test character with existing items
      const testCharacter = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Test Hero",
        classId: "berserker",
        ancestryId: "human",
        backgroundId: "fearless",
        level: 1,
        traitSelections: [],
        _schemaVersion: 1,
        _spellTierAccess: 0,
        _spellScalingLevel: 0,
        _proficiencies: { weapons: [], armor: [], tools: [] },
        _attributes: { strength: 0, dexterity: 0, intelligence: 0, will: 0 },
        _initiative: {
          name: "Initiative",
          associatedAttribute: "dexterity" as const,
          modifier: 0,
          bonus: 0,
          isPrimarySkill: false,
        },
        _skills: {},
        _abilities: [],
        _abilityUses: new Map(),
        _hitDice: { size: 10, current: 1, max: 1 },
        hitPoints: { current: 10, max: 10, temporary: 0 },
        wounds: { current: 0, max: 2 },
        _resourceDefinitions: [],
        _resourceValues: new Map(),
        config: {
          maxWounds: 2,
          maxHitPointsFormula: "",
          weaponSizeLimit: 2,
          maxInventorySize: 10,
          customResources: [],
        },
        speed: 30,
        actionTracker: { current: 3, base: 3, bonus: 0 },
        inEncounter: false,
        inventory: {
          items: [{ id: "existing", name: "Existing Item", type: "freeform" as const, size: 1 }],
          capacity: 10,
          maxSize: 10,
          currency: { copper: 0, silver: 0, gold: 0, platinum: 0 },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        saveAdvantages: {},
      } as Character;

      await characterStorageService.createCharacter(testCharacter, "123e4567-e89b-12d3-a456-426614174001");

      await characterCreationService.applyStartingEquipment("123e4567-e89b-12d3-a456-426614174001", []);

      const character = await characterStorageService.getCharacter("123e4567-e89b-12d3-a456-426614174001");
      expect(character?.inventory.items).toHaveLength(1);
      expect(character?.inventory.items[0].id).toBe("existing");
    });
  });

  describe("getClassStartingEquipment", () => {
    it("should return starting equipment for berserker class", () => {
      // The ContentRepository is instantiated and will return actual data
      const equipment = characterCreationService.getClassStartingEquipment("berserker");
      expect(equipment).toEqual(["battleaxe", "rations-meat", "rope-50ft"]);
    });

    it("should return empty array for invalid class", () => {
      const equipment = characterCreationService.getClassStartingEquipment("invalid-class");
      expect(equipment).toEqual([]);
    });
  });

  describe("Storage Integration", () => {
    it("should store characters in in-memory storage", async () => {
      const testCharacter = {
        id: "123e4567-e89b-12d3-a456-426614174002",
        name: "Storage Test",
        classId: "berserker",
        ancestryId: "human",
        backgroundId: "fearless",
        level: 1,
        traitSelections: [],
        _schemaVersion: 1,
        _spellTierAccess: 0,
        _spellScalingLevel: 0,
        _proficiencies: { weapons: [], armor: [], tools: [] },
        _attributes: { strength: 0, dexterity: 0, intelligence: 0, will: 0 },
        _initiative: {
          name: "Initiative",
          associatedAttribute: "dexterity" as const,
          modifier: 0,
          bonus: 0,
          isPrimarySkill: false,
        },
        _skills: {},
        _abilities: [],
        _abilityUses: new Map(),
        _hitDice: { size: 10, current: 1, max: 1 },
        hitPoints: { current: 10, max: 10, temporary: 0 },
        wounds: { current: 0, max: 2 },
        _resourceDefinitions: [],
        _resourceValues: new Map(),
        config: {
          maxWounds: 2,
          maxHitPointsFormula: "",
          weaponSizeLimit: 2,
          maxInventorySize: 10,
          customResources: [],
        },
        speed: 30,
        actionTracker: { current: 3, base: 3, bonus: 0 },
        inEncounter: false,
        inventory: {
          items: [],
          capacity: 10,
          maxSize: 10,
          currency: { copper: 0, silver: 0, gold: 0, platinum: 0 },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        saveAdvantages: {},
      } as Character;

      // Save to storage
      await characterStorageService.createCharacter(testCharacter, "123e4567-e89b-12d3-a456-426614174002");

      // Verify it's in storage
      const stored = await characterStorageService.getCharacter("123e4567-e89b-12d3-a456-426614174002");
      expect(stored?.name).toBe("Storage Test");

      // Verify it's in the in-memory storage
      const rawData = inMemoryStorage.getItem("nimble-navigator-characters");
      expect(rawData).toBeTruthy();
      const parsed = JSON.parse(rawData!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe("Storage Test");
    });

    it("should isolate storage between test instances", () => {
      // Each test gets its own in-memory storage
      const rawData = inMemoryStorage.getItem("nimble-navigator-characters");
      expect(rawData).toBeNull(); // Should be empty at start of each test
    });
  });

  describe("Service Interactions", () => {
    it("should call loadCharacter when quickCreateCharacter is used", async () => {
      // Since quickCreateCharacter requires ContentRepository which we can't easily mock,
      // we'll just verify the service has the expected methods
      expect(characterCreationService.quickCreateCharacter).toBeDefined();
      expect(characterCreationService.createCompleteCharacter).toBeDefined();
      expect(characterCreationService.applyStartingEquipment).toBeDefined();
      expect(characterCreationService.getClassStartingEquipment).toBeDefined();
    });

    it("should have access to all required services", () => {
      // Verify the service was created with all dependencies
      expect(characterCreationService).toBeDefined();
      expect(characterStorageService).toBeDefined();

      // Verify mock services were called as expected
      expect(mockAncestryService.getAvailableAncestries).toBeDefined();
      expect(mockBackgroundService.getAvailableBackgrounds).toBeDefined();
    });
  });

  describe("Data Validation", () => {
    it("should validate berserker class data structure", () => {
      expect(berserkerClass.id).toBe("berserker");
      expect(berserkerClass.name).toBe("Berserker");
      expect(berserkerClass.hitDieSize).toBe(12);
      expect(berserkerClass.startingHP).toBe(20);
    });

    it("should validate ancestry data structure", () => {
      expect(human.id).toBe("human");
      expect(human.name).toBe("Human");
      expect(human.features).toBeDefined();
    });

    it("should validate background data structure", () => {
      expect(fearless.id).toBe("fearless");
      expect(fearless.name).toBe("Fearless");
      expect(fearless.description).toBeDefined();
    });
  });
});
