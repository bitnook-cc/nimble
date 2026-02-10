"use client";

import {
  ArrowDownAZ,
  Beaker,
  Edit2,
  GripVertical,
  Minus,
  Package,
  Plus,
  Search,
  Shield,
  Shirt,
  Sword,
  Target,
  Trash2,
  Zap,
} from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import {
  AmmunitionItem,
  ArmorItem,
  ConsumableItem,
  Inventory as InventoryType,
  Item,
  WeaponItem,
} from "@/lib/schemas/inventory";
import { CreateItemData } from "@/lib/types/inventory";
import {
  equipMainArmorWithReplacement,
  getEquipmentValidationMessage,
} from "@/lib/utils/equipment";

import { ItemBrowser } from "./item-browser";
import { ItemFormFields } from "./item-form-fields";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface InventoryProps {
  inventory: InventoryType;
  characterDexterity: number;
}

export function Inventory({ inventory, characterDexterity }: InventoryProps) {
  const { character, updateCharacterFields } = useCharacterService();
  const { attack } = useDiceActions();
  const { uiState } = useUIStateService();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isItemBrowserOpen, setIsItemBrowserOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<CreateItemData>({
    name: "",
    size: 1,
    type: "freeform",
  });
  const [editItem, setEditItem] = useState<CreateItemData>({
    name: "",
    size: 1,
    type: "freeform",
  });

  // Get sorted items based on itemOrder array
  const getSortedItems = () => {
    if (!inventory.itemOrder || inventory.itemOrder.length === 0) {
      return inventory.items;
    }

    // Create a map for quick lookup
    const itemMap = new Map(inventory.items.map((item) => [item.id, item]));

    // Build sorted array based on itemOrder, then append any items not in the order
    const orderedItems: Item[] = [];
    const orderedIds = new Set(inventory.itemOrder);

    // Add items in the specified order
    for (const id of inventory.itemOrder) {
      const item = itemMap.get(id);
      if (item) {
        orderedItems.push(item);
      }
    }

    // Add any items not in the order (new items)
    for (const item of inventory.items) {
      if (!orderedIds.has(item.id)) {
        orderedItems.push(item);
      }
    }

    return orderedItems;
  };

  const sortedItems = getSortedItems();

  // Calculate total inventory size - all items count toward the limit
  const currentSize = inventory.items.reduce((total, item) => {
    return total + item.size;
  }, 0);
  const sizePercent = inventory.maxSize > 0 ? (currentSize / inventory.maxSize) * 100 : 0;

  const addItem = async () => {
    if (!newItem.name.trim()) return;

    let item: Item;

    if (newItem.type === "weapon") {
      item = {
        id: crypto.randomUUID(),
        name: newItem.name,
        size: newItem.size,
        type: "weapon",
        attribute: newItem.attribute,
        damage: newItem.damage,
        properties: newItem.properties,
        description: newItem.description,
      } as WeaponItem;
    } else if (newItem.type === "armor") {
      item = {
        id: crypto.randomUUID(),
        name: newItem.name,
        size: newItem.size,
        type: "armor",
        armor: newItem.armor,
        maxDexBonus: newItem.maxDexBonus,
        isMainArmor: newItem.isMainArmor,
        properties: newItem.properties,
        description: newItem.description,
      } as ArmorItem;
    } else if (newItem.type === "consumable") {
      item = {
        id: crypto.randomUUID(),
        name: newItem.name,
        size: newItem.size,
        type: "consumable",
        count: newItem.count || 1,
        description: newItem.description,
      } as ConsumableItem;
    } else if (newItem.type === "ammunition") {
      item = {
        id: crypto.randomUUID(),
        name: newItem.name,
        size: newItem.size,
        type: "ammunition",
        count: newItem.count || 1,
        description: newItem.description,
      } as AmmunitionItem;
    } else {
      item = {
        id: crypto.randomUUID(),
        name: newItem.name,
        size: newItem.size,
        type: "freeform",
        description: newItem.description,
      };
    }

    await updateCharacterFields({
      inventory: {
        ...inventory,
        items: [...inventory.items, item],
      },
    });

    setNewItem({ name: "", size: 1, type: "freeform" });
    setIsAddDialogOpen(false);
  };

  const removeItem = async (itemId: string) => {
    await updateCharacterFields({
      inventory: {
        ...inventory,
        items: inventory.items.filter((item) => item.id !== itemId),
      },
    });
  };

  const startEditItem = (item: Item) => {
    setEditingItemId(item.id);

    // Convert item to edit format
    const editData: CreateItemData = {
      name: item.name,
      size: item.size,
      type: item.type,
    };

    if (item.type === "weapon") {
      editData.attribute = item.attribute;
      editData.damage = item.damage;
      editData.properties = item.properties;
      editData.description = item.description;
    } else if (item.type === "armor") {
      const armor = item as ArmorItem;
      editData.armor = armor.armor;
      editData.maxDexBonus = armor.maxDexBonus;
      editData.isMainArmor = armor.isMainArmor;
      editData.properties = armor.properties;
      editData.description = armor.description;
    } else if (item.type === "freeform") {
      editData.description = item.description;
    } else if (item.type === "consumable" || item.type === "ammunition") {
      const countedItem = item as ConsumableItem | AmmunitionItem;
      editData.count = countedItem.count;
      editData.description = countedItem.description;
    }

    setEditItem(editData);
    setIsEditDialogOpen(true);
  };

  const saveEditItem = async () => {
    if (!editItem.name.trim() || !editingItemId) return;

    let updatedItem: Item;

    if (editItem.type === "weapon") {
      updatedItem = {
        id: editingItemId,
        name: editItem.name,
        size: editItem.size,
        type: "weapon",
        attribute: editItem.attribute,
        damage: editItem.damage,
        properties: editItem.properties,
        description: editItem.description,
        equipped:
          (inventory.items.find((i) => i.id === editingItemId) as WeaponItem)?.equipped || false,
      } as WeaponItem;
    } else if (editItem.type === "armor") {
      updatedItem = {
        id: editingItemId,
        name: editItem.name,
        size: editItem.size,
        type: "armor",
        armor: editItem.armor,
        maxDexBonus: editItem.maxDexBonus,
        isMainArmor: editItem.isMainArmor,
        properties: editItem.properties,
        description: editItem.description,
        equipped:
          (inventory.items.find((i) => i.id === editingItemId) as ArmorItem)?.equipped || false,
      } as ArmorItem;
    } else if (editItem.type === "consumable") {
      updatedItem = {
        id: editingItemId,
        name: editItem.name,
        size: editItem.size,
        type: "consumable",
        count: editItem.count || 1,
        description: editItem.description,
      } as ConsumableItem;
    } else if (editItem.type === "ammunition") {
      updatedItem = {
        id: editingItemId,
        name: editItem.name,
        size: editItem.size,
        type: "ammunition",
        count: editItem.count || 1,
        description: editItem.description,
      } as AmmunitionItem;
    } else {
      updatedItem = {
        id: editingItemId,
        name: editItem.name,
        size: editItem.size,
        type: "freeform",
        description: editItem.description,
      };
    }

    await updateCharacterFields({
      inventory: {
        ...inventory,
        items: inventory.items.map((item) => (item.id === editingItemId ? updatedItem : item)),
      },
    });

    setEditItem({ name: "", size: 1, type: "freeform" });
    setEditingItemId(null);
    setIsEditDialogOpen(false);
  };

  const changeItemCount = async (itemId: string, delta: number) => {
    const item = inventory.items.find((item) => item.id === itemId);
    if (!item || (item.type !== "consumable" && item.type !== "ammunition")) {
      return;
    }

    const countedItem = item as ConsumableItem | AmmunitionItem;
    const newCount = Math.max(1, countedItem.count + delta);

    const updatedItems = inventory.items.map((inventoryItem) => {
      if (inventoryItem.id === itemId) {
        return { ...inventoryItem, count: newCount };
      }
      return inventoryItem;
    });

    await updateCharacterFields({
      inventory: {
        ...inventory,
        items: updatedItems,
      },
    });
  };

  const consumeItem = async (itemId: string) => {
    if (!character) return;

    const item = inventory.items.find((item) => item.id === itemId);
    if (!item || (item.type !== "consumable" && item.type !== "ammunition")) {
      return;
    }

    const countedItem = item as ConsumableItem | AmmunitionItem;
    const newCount = countedItem.count - 1;
    const itemWillBeRemoved = newCount <= 0;

    // Create activity log entry
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      description: `Consumed ${item.name}${itemWillBeRemoved ? " (last one)" : ` (${newCount} remaining)`}`,
      type: "item_consumption" as const,
      characterId: character.id,
      itemName: item.name,
      itemType: item.type,
      countBefore: countedItem.count,
      countAfter: newCount,
      itemRemoved: itemWillBeRemoved,
    };

    // Add to activity log
    try {
      const { ActivityLogService } = await import("@/lib/services/activity-log-service");
      const activityLogService = new ActivityLogService();
      await activityLogService.addLogEntry(logEntry);
    } catch (error) {
      console.error("Failed to log item consumption:", error);
    }

    // Update inventory
    let updatedItems: Item[];
    if (itemWillBeRemoved) {
      // Remove item completely
      updatedItems = inventory.items.filter((inventoryItem) => inventoryItem.id !== itemId);
    } else {
      // Reduce count
      updatedItems = inventory.items.map((inventoryItem) => {
        if (inventoryItem.id === itemId) {
          return { ...inventoryItem, count: newCount };
        }
        return inventoryItem;
      });
    }

    await updateCharacterFields({
      inventory: {
        ...inventory,
        items: updatedItems,
      },
    });
  };

  const handleWeaponAttack = async (weapon: WeaponItem) => {
    if (!character || !weapon.damage || !weapon.attribute) return;

    // Get the character's attribute modifier
    const attributeModifier =
      character._attributes[weapon.attribute as keyof typeof character._attributes];

    // Call the attack function
    await attack(weapon.name, weapon.damage, attributeModifier, uiState.advantageLevel);
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    setDragOverItemId(itemId);
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: string | null) => {
    e.preventDefault();
    setDragOverItemId(null);

    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      return;
    }

    // Create new order array
    const currentOrder = inventory.itemOrder || inventory.items.map((i) => i.id);
    const newOrder = [...currentOrder];

    // Ensure dragged item is in the order array
    if (!newOrder.includes(draggedItemId)) {
      newOrder.push(draggedItemId);
    }

    // Remove dragged item from current position
    const draggedIndex = newOrder.indexOf(draggedItemId);
    newOrder.splice(draggedIndex, 1);

    if (targetItemId === null) {
      // Drop at the end
      newOrder.push(draggedItemId);
    } else {
      // Ensure target item is in the order array
      if (!newOrder.includes(targetItemId)) {
        newOrder.push(targetItemId);
      }

      // Insert at target position
      const newTargetIndex = newOrder.indexOf(targetItemId);
      newOrder.splice(newTargetIndex, 0, draggedItemId);
    }

    await updateCharacterFields({
      inventory: {
        ...inventory,
        itemOrder: newOrder,
      },
    });

    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const sortItems = async (sortBy: "name" | "type") => {
    const sorted = [...inventory.items].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by type with custom order, then by name within type
        const typeOrder = ["weapon", "armor", "consumable", "ammunition", "freeform"];
        const aTypeIndex = typeOrder.indexOf(a.type);
        const bTypeIndex = typeOrder.indexOf(b.type);

        if (aTypeIndex !== bTypeIndex) {
          return aTypeIndex - bTypeIndex;
        }

        // Same type, sort by name
        return a.name.localeCompare(b.name);
      }
    });

    await updateCharacterFields({
      inventory: {
        ...inventory,
        itemOrder: sorted.map((item) => item.id),
      },
    });
  };

  const toggleEquipped = async (itemId: string) => {
    const item = inventory.items.find((item) => item.id === itemId);
    if (!item || (item.type !== "weapon" && item.type !== "armor")) {
      return;
    }

    const newEquippedState = !item.equipped;

    // If trying to equip, check validation
    if (newEquippedState) {
      const validationMessage = getEquipmentValidationMessage(inventory.items, item);
      if (validationMessage) {
        // For main armor replacement, ask for confirmation
        if (item.type === "armor" && (item as ArmorItem).isMainArmor) {
          if (!confirm(validationMessage + ". Continue?")) {
            return; // User cancelled
          }
        } else {
          alert(validationMessage);
          return; // Don't change the item
        }
      }
    }

    let updatedItems: Item[];

    // Handle main armor replacement
    if (newEquippedState && item.type === "armor" && (item as ArmorItem).isMainArmor) {
      updatedItems = equipMainArmorWithReplacement(inventory.items, item as ArmorItem);
    } else {
      // Standard equip/unequip
      updatedItems = inventory.items.map((inventoryItem) => {
        if (inventoryItem.id === itemId) {
          return { ...inventoryItem, equipped: newEquippedState };
        }
        return inventoryItem;
      });
    }

    await updateCharacterFields({
      inventory: {
        ...inventory,
        items: updatedItems,
      },
    });
  };

  const getItemIcon = (item: Item) => {
    switch (item.type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        const armor = item as ArmorItem;
        return armor.isMainArmor ? <Shirt className="w-4 h-4" /> : <Shield className="w-4 h-4" />;
      case "consumable":
        return <Beaker className="w-4 h-4" />;
      case "ammunition":
        return <Target className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const renderItemDetails = (item: Item) => {
    switch (item.type) {
      case "weapon":
        return (
          <div className="text-xs text-muted-foreground mt-1">
            {item.damage && (
              <div>
                Damage: {item.damage}
                {item.properties && item.properties.length > 0 && (
                  <span className="ml-2">• {item.properties.join(", ")}</span>
                )}
              </div>
            )}
          </div>
        );
      case "armor":
        const armor = item as ArmorItem;
        const baseArmor = armor.armor || 0;
        const maxDexBonus = armor.maxDexBonus ?? Infinity;
        const actualDexBonus = Math.min(characterDexterity, maxDexBonus);
        const totalArmorValue = baseArmor + actualDexBonus;

        return (
          <div className="text-xs text-muted-foreground mt-1">
            {armor.isMainArmor && (
              <div className="flex items-center gap-1 text-primary flex-wrap">
                <Shirt className="w-3 h-3" />
                <span className="font-medium">Main Armor</span>
                <span>
                  • Armor: {baseArmor}
                  {characterDexterity > 0 && maxDexBonus > 0 && (
                    <span className="text-green-600">
                      {" "}
                      + {actualDexBonus} dex = {totalArmorValue}
                    </span>
                  )}
                  {maxDexBonus < Infinity && (
                    <span className="text-blue-600 ml-1">(max dex: {maxDexBonus})</span>
                  )}
                </span>
                {armor.properties && armor.properties.length > 0 && (
                  <span>• {armor.properties.join(", ")}</span>
                )}
              </div>
            )}
            {!armor.isMainArmor && (
              <div>
                Armor: {baseArmor}
                {characterDexterity > 0 && maxDexBonus > 0 && (
                  <span className="text-green-600">
                    {" "}
                    + {actualDexBonus} dex = {totalArmorValue}
                  </span>
                )}
                {maxDexBonus < Infinity && (
                  <span className="text-blue-600 ml-1">(max dex: {maxDexBonus})</span>
                )}
                {armor.properties && armor.properties.length > 0 && (
                  <span className="ml-2">• {armor.properties.join(", ")}</span>
                )}
              </div>
            )}
          </div>
        );
      case "freeform":
        return item.description ? (
          <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
        ) : null;
      case "consumable":
      case "ammunition":
        const countedItem = item as ConsumableItem | AmmunitionItem;
        return (
          <div className="text-xs text-muted-foreground mt-1">
            <div className="font-medium text-primary">Count: {countedItem.count}</div>
            {countedItem.description && <div>{countedItem.description}</div>}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Inventory Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory. Specify its type, properties, and quantity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <ItemFormFields item={newItem} onItemChange={setNewItem} idPrefix="add" />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addItem} disabled={!newItem.name.trim()}>
                    Add Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="outline" onClick={() => setIsItemBrowserOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            Browse Items
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <ArrowDownAZ className="w-4 h-4 mr-2" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => sortItems("name")}>Sort by Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => sortItems("type")}>Sort by Type</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Item Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Modify the properties of an existing item in your inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <ItemFormFields item={editItem} onItemChange={setEditItem} idPrefix="edit" />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEditItem} disabled={!editItem.name.trim()}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Size Bar */}
      {inventory.maxSize > 0 && (
        <div className="space-y-1">
          <div className="relative flex items-center justify-between text-sm">
            <span>Inventory Space</span>
            <span
              className={`absolute left-1/2 transform -translate-x-1/2 ${currentSize > inventory.maxSize ? "text-destructive" : "text-muted-foreground"}`}
            >
              {currentSize} / {inventory.maxSize}
            </span>
            <span className={currentSize > inventory.maxSize ? "text-destructive" : ""}>
              {Math.round(sizePercent)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                currentSize > inventory.maxSize
                  ? "bg-destructive"
                  : sizePercent > 80
                    ? "bg-yellow-500"
                    : "bg-primary"
              }`}
              style={{ width: `${Math.min(sizePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Items List */}
      <Card>
        <CardContent className="p-0">
          {sortedItems.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No items in inventory. Click &ldquo;Add Item&rdquo; to get started.
            </div>
          ) : (
            <div>
              {sortedItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 hover:bg-muted/50 transition-colors ${
                    index > 0 ? "border-t" : ""
                  } ${dragOverItemId === item.id ? "bg-muted border-t-2 border-primary" : ""} ${
                    draggedItemId === item.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="shrink-0 mt-1 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="shrink-0 mt-1 flex flex-col items-center">
                        {getItemIcon(item)}
                        {/* Visual size indicators - vertical squares */}
                        <div className="flex flex-col gap-0.5 mt-1">
                          {Array.from({ length: item.size }, (_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-muted border border-muted-foreground/20 rounded-sm"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {renderItemDetails(item)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 shrink-0">
                      {/* Main action buttons row */}
                      <div className="flex items-center space-x-2">
                        {item.type === "weapon" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleWeaponAttack(item as WeaponItem)}
                            className="h-8 w-8 p-0"
                            disabled={!item.damage || !item.attribute}
                          >
                            <Sword className="w-4 h-4" />
                          </Button>
                        )}
                        {(item.type === "weapon" || item.type === "armor") && (
                          <Button
                            variant={item.equipped ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleEquipped(item.id)}
                            className={item.equipped ? "text-white" : ""}
                          >
                            {item.equipped ? "Equipped" : "Equip"}
                          </Button>
                        )}
                        {item.type === "consumable" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => consumeItem(item.id)}
                            className="h-8 px-2"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditItem(item)}
                          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Count controls row for consumables and ammunition */}
                      {(item.type === "consumable" || item.type === "ammunition") && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => changeItemCount(item.id, -1)}
                            disabled={(item as ConsumableItem | AmmunitionItem).count <= 1}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">
                            {(item as ConsumableItem | AmmunitionItem).count}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => changeItemCount(item.id, 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Drop zone at the bottom - only visible when dragging */}
              {draggedItemId && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverItemId("bottom");
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`p-3 border-t transition-colors ${
                    dragOverItemId === "bottom"
                      ? "bg-primary/10 border-t-2 border-primary"
                      : "bg-muted/50 border-dashed"
                  }`}
                >
                  <div className="text-center text-xs text-muted-foreground">
                    Drop here to move to bottom
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Browser */}
      <ItemBrowser isOpen={isItemBrowserOpen} onClose={() => setIsItemBrowserOpen(false)} />
    </div>
  );
}
