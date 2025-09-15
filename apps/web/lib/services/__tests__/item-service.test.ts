import { beforeEach, describe, expect, it, vi } from "vitest";

// Import after mock setup
import { ITEM_REPOSITORY } from "@/lib/data/items";
import type { ArmorItem, ConsumableItem, WeaponItem } from "@/lib/schemas/inventory";
import type {
  RepositoryArmorItem,
  RepositoryConsumableItem,
  RepositoryItem,
  RepositoryWeaponItem,
} from "@/lib/types/item-repository";

import { ItemService } from "../item-service";

// Mock ITEM_REPOSITORY with factory function to avoid hoisting issues
vi.mock("@/lib/data/items", () => {
  const mockItemRepository = {
    weapons: [] as any[],
    armor: [] as any[],
    freeform: [] as any[],
    consumables: [] as any[],
    ammunition: [] as any[],
  };

  return {
    ITEM_REPOSITORY: mockItemRepository,
  };
});

describe("ItemService", () => {
  let itemService: ItemService;

  const mockWeaponItem: Omit<WeaponItem, "equipped"> = {
    id: "test-sword",
    name: "Test Sword",
    description: "A test weapon",
    type: "weapon",
    damage: "1d8",
    size: 1,
  };

  const mockWeapon: RepositoryWeaponItem = {
    category: "mundane",
    rarity: "common",
    item: mockWeaponItem,
  };

  const mockArmorItem: Omit<ArmorItem, "equipped"> = {
    id: "test-armor",
    name: "Test Armor",
    description: "A test armor",
    type: "armor",
    armor: 14,
    isMainArmor: true,
    size: 2,
  };

  const mockArmor: RepositoryArmorItem = {
    category: "mundane",
    rarity: "common",
    item: mockArmorItem,
  };

  const mockConsumableItem: ConsumableItem = {
    id: "test-potion",
    name: "Test Potion",
    description: "A test consumable",
    type: "consumable",
    count: 3,
    size: 1,
  };

  const mockConsumable: RepositoryConsumableItem = {
    category: "mundane",
    rarity: "common",
    item: mockConsumableItem,
  };

  const mockMagicalWeaponItem: Omit<WeaponItem, "equipped"> = {
    id: "magic-sword",
    name: "Magic Sword",
    description: "A magical weapon",
    type: "weapon",
    damage: "2d6",
    size: 1,
  };

  const mockMagicalWeapon: RepositoryWeaponItem = {
    category: "magical",
    rarity: "rare",
    item: mockMagicalWeaponItem,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the mock repository
    ITEM_REPOSITORY.weapons = [];
    ITEM_REPOSITORY.armor = [];
    ITEM_REPOSITORY.freeform = [];
    ITEM_REPOSITORY.consumables = [];
    ITEM_REPOSITORY.ammunition = [];

    itemService = ItemService.getInstance();
  });

  describe("getAllItems", () => {
    it("should return all items from repository", () => {
      ITEM_REPOSITORY.weapons = [mockWeapon] as any;
      ITEM_REPOSITORY.armor = [mockArmor] as any;
      ITEM_REPOSITORY.consumables = [mockConsumable] as any;

      const result = itemService.getAllItems();

      expect(result).toHaveLength(3);
    });

    it("should return empty array when no items exist", () => {
      const result = itemService.getAllItems();

      expect(result).toEqual([]);
    });
  });

  describe("getItemsByType", () => {
    beforeEach(() => {
      ITEM_REPOSITORY.weapons = [mockWeapon] as any;
      ITEM_REPOSITORY.armor = [mockArmor] as any;
      ITEM_REPOSITORY.consumables = [mockConsumable] as any;
    });

    it("should return weapons when type is weapon", () => {
      const result = itemService.getItemsByType("weapon");

      expect(result).toEqual([mockWeapon]);
    });

    it("should return armor when type is armor", () => {
      const result = itemService.getItemsByType("armor");

      expect(result).toEqual([mockArmor]);
    });

    it("should return consumables when type is consumable", () => {
      const result = itemService.getItemsByType("consumable");

      expect(result).toEqual([mockConsumable]);
    });

    it("should return empty array for type with no items", () => {
      const result = itemService.getItemsByType("ammunition");

      expect(result).toEqual([]);
    });
  });

  describe("filterItems", () => {
    beforeEach(() => {
      // Reset and populate mock repository with RepositoryItem structure
      ITEM_REPOSITORY.weapons = [mockWeapon, mockMagicalWeapon];
      ITEM_REPOSITORY.armor = [mockArmor];
      ITEM_REPOSITORY.consumables = [mockConsumable];
    });

    it("should filter by type", () => {
      const result = itemService.filterItems({ type: "weapon" });

      expect(result).toHaveLength(2);
      expect(result[0].item.type).toBe("weapon");
      expect(result[1].item.type).toBe("weapon");
    });

    it("should filter by category", () => {
      const result = itemService.filterItems({ category: "magical" });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("magical");
    });

    it("should filter by rarity", () => {
      const result = itemService.filterItems({ rarity: "rare" });

      expect(result).toHaveLength(1);
      expect(result[0].rarity).toBe("rare");
    });

    it("should filter by name", () => {
      const result = itemService.filterItems({ name: "magic" });

      expect(result).toHaveLength(1);
      expect(result[0].item.name).toBe("Magic Sword");
    });

    it("should filter by description", () => {
      const result = itemService.filterItems({ name: "test weapon" });

      expect(result).toHaveLength(1);
      expect(result[0].item.id).toBe("test-sword");
    });

    it("should combine multiple filters", () => {
      const result = itemService.filterItems({
        type: "weapon",
        category: "magical",
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.id).toBe("magic-sword");
    });
  });

  describe("findItemById", () => {
    beforeEach(() => {
      ITEM_REPOSITORY.weapons = [mockWeapon];
      ITEM_REPOSITORY.armor = [mockArmor];
    });

    it("should find item by repository ID", () => {
      const result = itemService.findItemById("test-sword");

      expect(result).toBeDefined();
      expect(result?.item.id).toBe("test-sword");
    });

    it("should return undefined for non-existent ID", () => {
      const result = itemService.findItemById("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("createInventoryItem", () => {
    beforeEach(() => {
      ITEM_REPOSITORY.weapons = [mockWeapon];
    });

    it("should create inventory item with unique ID", () => {
      const result = itemService.createInventoryItem("test-sword");

      expect(result).toBeDefined();
      expect(result?.id).toMatch(/^test-sword-[a-f0-9]{8}$/);
      expect(result?.name).toBe("Test Sword");
    });

    it("should return null for non-existent repository ID", () => {
      const result = itemService.createInventoryItem("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getItemsByCategory", () => {
    beforeEach(() => {
      ITEM_REPOSITORY.weapons = [mockWeapon, mockMagicalWeapon];
      ITEM_REPOSITORY.armor = [mockArmor];
    });

    it("should group items by category", () => {
      const result = itemService.getItemsByCategory();

      expect(result.mundane).toHaveLength(2);
      expect(result.magical).toHaveLength(1);
    });
  });

  describe("getItemsGrouped", () => {
    beforeEach(() => {
      ITEM_REPOSITORY.weapons = [mockWeapon, mockMagicalWeapon];
      ITEM_REPOSITORY.armor = [mockArmor];
    });

    it("should group items by type and category", () => {
      const result = itemService.getItemsGrouped();

      expect(result.weapon.mundane).toHaveLength(1);
      expect(result.weapon.magical).toHaveLength(1);
      expect(result.armor.mundane).toHaveLength(1);
      expect(result.armor.magical).toHaveLength(0);
      expect(result.consumable.mundane).toHaveLength(0);
    });
  });

  describe("getItemStats", () => {
    beforeEach(() => {
      ITEM_REPOSITORY.weapons = [mockWeapon, mockMagicalWeapon];
      ITEM_REPOSITORY.armor = [mockArmor];
      ITEM_REPOSITORY.consumables = [mockConsumable];
    });

    it("should return correct item statistics", () => {
      const result = itemService.getItemStats();

      expect(result.total).toBe(4);
      expect(result.byType.weapon).toBe(2);
      expect(result.byType.armor).toBe(1);
      expect(result.byType.consumable).toBe(1);
      expect(result.byType.freeform).toBe(0);
      expect(result.byType.ammunition).toBe(0);
      expect(result.byCategory.mundane).toBe(3);
      expect(result.byCategory.magical).toBe(1);
    });
  });
});
