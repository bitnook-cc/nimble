import { v4 as uuidv4 } from "uuid";

import { ITEM_REPOSITORY } from "../data/items";
import { Item, ItemType } from "../types/inventory";
import { ItemFilter, RepositoryItem } from "../types/item-repository";

export class ItemService {
  private static instance: ItemService;

  public static getInstance(): ItemService {
    if (!ItemService.instance) {
      ItemService.instance = new ItemService();
    }
    return ItemService.instance;
  }

  private constructor() {}

  /**
   * Get all items from the repository
   */
  public getAllItems(): RepositoryItem[] {
    return [
      ...ITEM_REPOSITORY.weapons,
      ...ITEM_REPOSITORY.armor,
      ...ITEM_REPOSITORY.freeform,
      ...ITEM_REPOSITORY.consumables,
      ...ITEM_REPOSITORY.ammunition,
    ];
  }

  /**
   * Get items by type
   */
  public getItemsByType(type: ItemType): RepositoryItem[] {
    switch (type) {
      case "weapon":
        return ITEM_REPOSITORY.weapons;
      case "armor":
        return ITEM_REPOSITORY.armor;
      case "freeform":
        return ITEM_REPOSITORY.freeform;
      case "consumable":
        return ITEM_REPOSITORY.consumables;
      case "ammunition":
        return ITEM_REPOSITORY.ammunition;
      default:
        return [];
    }
  }

  /**
   * Filter items based on provided criteria
   */
  public filterItems(filter: ItemFilter): RepositoryItem[] {
    let items = this.getAllItems();

    if (filter.type) {
      items = items.filter((item) => item.item.type === filter.type);
    }

    if (filter.category) {
      items = items.filter((item) => item.category === filter.category);
    }

    if (filter.rarity) {
      items = items.filter((item) => item.rarity === filter.rarity);
    }

    if (filter.name) {
      const searchTerm = filter.name.toLowerCase();
      items = items.filter(
        (item) =>
          item.item.name.toLowerCase().includes(searchTerm) ||
          (item.item.description && item.item.description.toLowerCase().includes(searchTerm)),
      );
    }

    return items;
  }

  /**
   * Find a specific item by its repository ID
   */
  public findItemById(repositoryId: string): RepositoryItem | undefined {
    return this.getAllItems().find((item) => item.item.id === repositoryId);
  }

  /**
   * Convert a repository item to an inventory item with a unique ID
   * This adds a randomized suffix to the repository ID to ensure uniqueness
   */
  public createInventoryItem(repositoryId: string): Item | null {
    const repositoryItem = this.findItemById(repositoryId);
    if (!repositoryItem) {
      return null;
    }

    // Generate a unique ID by appending a random suffix to the repository ID
    const uniqueId = `${repositoryId}-${uuidv4().slice(0, 8)}`;

    // Create the inventory item with the unique ID
    const inventoryItem: Item = {
      ...repositoryItem.item,
      id: uniqueId,
    } as Item;

    return inventoryItem;
  }

  /**
   * Get items grouped by category
   */
  public getItemsByCategory(): { mundane: RepositoryItem[]; magical: RepositoryItem[] } {
    const allItems = this.getAllItems();
    return {
      mundane: allItems.filter((item) => item.category === "mundane"),
      magical: allItems.filter((item) => item.category === "magical"),
    };
  }

  /**
   * Get items grouped by type and category
   */
  public getItemsGrouped(): Record<
    ItemType,
    { mundane: RepositoryItem[]; magical: RepositoryItem[] }
  > {
    const types: ItemType[] = ["weapon", "armor", "freeform", "consumable", "ammunition"];
    const result = {} as Record<ItemType, { mundane: RepositoryItem[]; magical: RepositoryItem[] }>;

    types.forEach((type) => {
      const typeItems = this.getItemsByType(type);
      result[type] = {
        mundane: typeItems.filter((item) => item.category === "mundane"),
        magical: typeItems.filter((item) => item.category === "magical"),
      };
    });

    return result;
  }

  /**
   * Get item statistics
   */
  public getItemStats(): {
    total: number;
    byType: Record<ItemType, number>;
    byCategory: Record<"mundane" | "magical", number>;
  } {
    const allItems = this.getAllItems();
    const types: ItemType[] = ["weapon", "armor", "freeform", "consumable", "ammunition"];

    const byType = {} as Record<ItemType, number>;
    types.forEach((type) => {
      byType[type] = this.getItemsByType(type).length;
    });

    const byCategory = {
      mundane: allItems.filter((item) => item.category === "mundane").length,
      magical: allItems.filter((item) => item.category === "magical").length,
    };

    return {
      total: allItems.length,
      byType,
      byCategory,
    };
  }
}
