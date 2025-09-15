"use client";

import {
  Apple,
  ChevronDown,
  ChevronRight,
  Coins,
  FileText,
  Package,
  Plus,
  Search,
  Shield,
  Star,
  Sword,
  Target,
  Zap,
} from "lucide-react";

import { useMemo, useState } from "react";

import { ItemType } from "@/lib/schemas/inventory";
import { getItemService } from "@/lib/services/service-factory";
import { getCharacterService } from "@/lib/services/service-factory";
import {
  ItemFilter,
  RepositoryArmorItem,
  RepositoryItem,
  RepositoryWeaponItem,
} from "@/lib/types/item-repository";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

// Coin icons using Lucide (same as currency section)
const GoldCoin = ({ className }: { className?: string }) => (
  <Coins className={`w-4 h-4 text-yellow-600 ${className}`} />
);

const SilverCoin = ({ className }: { className?: string }) => (
  <Coins className={`w-4 h-4 text-gray-500 ${className}`} />
);

interface ItemBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  // Multi-select mode props
  multiSelect?: boolean;
  selectedItems?: string[]; // Array of repository item IDs
  onItemsChange?: (itemIds: string[]) => void;
  // Single-select mode props (existing behavior)
  onItemAdd?: (repositoryId: string) => void;
}

export function ItemBrowser({
  isOpen,
  onClose,
  multiSelect = false,
  selectedItems = [],
  onItemsChange,
  onItemAdd,
}: ItemBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ItemType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mundane" | "magical">("all");
  const [selectedRarity, setSelectedRarity] = useState<
    "all" | "common" | "uncommon" | "rare" | "very-rare" | "legendary"
  >("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [addedMessage, setAddedMessage] = useState("");

  const itemService = getItemService();
  const characterService = getCharacterService();

  // Filter items based on current filters
  const filteredItems = useMemo(() => {
    const filter: ItemFilter = {};

    if (selectedType !== "all") filter.type = selectedType;
    if (selectedCategory !== "all") filter.category = selectedCategory;
    if (selectedRarity !== "all") filter.rarity = selectedRarity;
    if (searchTerm.trim()) filter.name = searchTerm.trim();

    return itemService.filterItems(filter);
  }, [searchTerm, selectedType, selectedCategory, selectedRarity, itemService]);

  // Group items by type and category
  const groupedItems = useMemo(() => {
    const groups: Record<string, RepositoryItem[]> = {};

    filteredItems.forEach((item) => {
      const key = `${item.item.type}-${item.category}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [filteredItems]);

  const handleAddItem = (repositoryId: string) => {
    if (multiSelect && onItemsChange) {
      // Multi-select mode: toggle item in selection
      const isSelected = selectedItems.includes(repositoryId);
      if (isSelected) {
        onItemsChange(selectedItems.filter((id) => id !== repositoryId));
      } else {
        onItemsChange([...selectedItems, repositoryId]);
      }
    } else if (onItemAdd) {
      // Single-select mode: use custom handler
      onItemAdd(repositoryId);
    } else {
      // Default single-select mode: add to current character's inventory
      const inventoryItem = itemService.createInventoryItem(repositoryId);
      if (!inventoryItem) {
        console.error("Failed to create inventory item");
        return;
      }

      const character = characterService.getCurrentCharacter();
      if (!character) {
        console.error("No current character");
        return;
      }

      try {
        characterService.addItemToInventory(inventoryItem);
        setAddedMessage(`Added ${inventoryItem.name} to inventory`);
        setTimeout(() => setAddedMessage(""), 2000);
      } catch (error) {
        console.error("Failed to add item to inventory:", error);
      }
    }
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const getTypeIcon = (type: ItemType) => {
    const iconProps = { className: "h-4 w-4" };
    switch (type) {
      case "weapon":
        return <Sword {...iconProps} />;
      case "armor":
        return <Shield {...iconProps} />;
      case "consumable":
        return <Apple {...iconProps} />;
      case "ammunition":
        return <Target {...iconProps} />;
      case "freeform":
        return <FileText {...iconProps} />;
      default:
        return <Package {...iconProps} />;
    }
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600";
      case "uncommon":
        return "text-green-600";
      case "rare":
        return "text-blue-600";
      case "very-rare":
        return "text-purple-600";
      case "legendary":
        return "text-orange-600";
      default:
        return "text-gray-500";
    }
  };

  const getCategoryColor = (category: string) => {
    return category === "magical" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800";
  };

  const formatGroupName = (groupKey: string) => {
    const [type, category] = groupKey.split("-");
    const typeTitle = type.charAt(0).toUpperCase() + type.slice(1) + "s";
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    return `${categoryTitle} ${typeTitle}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Item Repository
          </DialogTitle>
          <DialogDescription>
            Browse and add items from the item repository to your inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Status Message */}
          {addedMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              {addedMessage}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Type</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as ItemType | "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="weapon">Weapons</SelectItem>
                  <SelectItem value="armor">Armor</SelectItem>
                  <SelectItem value="consumable">Consumables</SelectItem>
                  <SelectItem value="ammunition">Ammunition</SelectItem>
                  <SelectItem value="freeform">Other Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  setSelectedCategory(value as "all" | "mundane" | "magical")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="mundane">Mundane</SelectItem>
                  <SelectItem value="magical">Magical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Rarity</Label>
              <Select
                value={selectedRarity}
                onValueChange={(value) => setSelectedRarity(value as typeof selectedRarity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="very-rare">Very Rare</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items found matching your criteria</p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([groupKey, items]) => {
                const isExpanded = expandedGroups[groupKey] ?? true;
                const groupName = formatGroupName(groupKey);

                return (
                  <Card key={groupKey}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 pb-3">
                          <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(items[0].item.type)}
                              {groupName}
                              <Badge variant="secondary">{items.length}</Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="grid gap-2">
                            {items.map((repositoryItem) => (
                              <div
                                key={repositoryItem.item.id}
                                className="flex items-center justify-between p-3 border rounded hover:bg-muted/30"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{repositoryItem.item.name}</span>
                                    <Badge
                                      variant="outline"
                                      className={getCategoryColor(repositoryItem.category)}
                                    >
                                      {repositoryItem.category}
                                    </Badge>
                                    {repositoryItem.rarity && (
                                      <div
                                        className={`flex items-center gap-1 ${getRarityColor(repositoryItem.rarity)}`}
                                      >
                                        <Star className="h-3 w-3" />
                                        <span className="text-xs font-medium">
                                          {repositoryItem.rarity}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {repositoryItem.item.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {repositoryItem.item.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Size: {repositoryItem.item.size}</span>
                                    {repositoryItem.item.cost && (
                                      <div className="flex items-center gap-1">
                                        <span>Cost:</span>
                                        {repositoryItem.item.cost.gold && (
                                          <div className="flex items-center gap-1">
                                            <GoldCoin />
                                            <span>{repositoryItem.item.cost.gold}</span>
                                          </div>
                                        )}
                                        {repositoryItem.item.cost.silver && (
                                          <div className="flex items-center gap-1">
                                            <SilverCoin />
                                            <span>{repositoryItem.item.cost.silver}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {repositoryItem.item.type === "weapon" &&
                                      (repositoryItem as RepositoryWeaponItem).item.damage && (
                                        <span>
                                          Damage:{" "}
                                          {(repositoryItem as RepositoryWeaponItem).item.damage}
                                        </span>
                                      )}
                                    {repositoryItem.item.type === "armor" &&
                                      (repositoryItem as RepositoryArmorItem).item.armor && (
                                        <span>
                                          AC: {(repositoryItem as RepositoryArmorItem).item.armor}
                                        </span>
                                      )}
                                    {(repositoryItem.item.type === "consumable" ||
                                      repositoryItem.item.type === "ammunition") &&
                                      (repositoryItem.item as any).count && (
                                        <span>Count: {(repositoryItem.item as any).count}</span>
                                      )}
                                    {(repositoryItem.item.type === "weapon" ||
                                      repositoryItem.item.type === "armor") &&
                                      (repositoryItem.item as any).properties &&
                                      (repositoryItem.item as any).properties.length > 0 && (
                                        <span>
                                          Properties:{" "}
                                          {(repositoryItem.item as any).properties.join(", ")}
                                        </span>
                                      )}
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  variant={
                                    multiSelect && selectedItems.includes(repositoryItem.item.id)
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() => handleAddItem(repositoryItem.item.id)}
                                  className="ml-4"
                                >
                                  {multiSelect ? (
                                    selectedItems.includes(repositoryItem.item.id) ? (
                                      <>
                                        <span className="h-4 w-4 mr-1">✓</span>
                                        Selected
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Select
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })
            )}
          </div>

          {/* Footer Summary */}
          <div className="border-t pt-4 text-sm text-muted-foreground">
            Showing {filteredItems.length} items • Repository contains{" "}
            {itemService.getAllItems().length} total items
            {multiSelect && selectedItems.length > 0 && (
              <span className="ml-2 text-primary font-medium">
                • {selectedItems.length} selected
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
