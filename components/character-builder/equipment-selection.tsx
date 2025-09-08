"use client";

import { Beaker, Package, Plus, Search, Shield, Shirt, Sword, Target, Trash2 } from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { getContentRepository, getItemService } from "@/lib/services/service-factory";
import { Item } from "@/lib/schemas/inventory";

import { ItemBrowser } from "../item-browser";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface EquipmentSelectionProps {
  classId: string;
  selectedEquipment: string[];
  onEquipmentReady: (equipment: string[]) => void;
}

export function EquipmentSelection({
  classId,
  selectedEquipment,
  onEquipmentReady,
}: EquipmentSelectionProps) {
  const [isItemBrowserOpen, setIsItemBrowserOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const itemService = getItemService();
  const contentRepository = getContentRepository();

  // Convert selectedEquipment repository IDs to display items
  const equipment = selectedEquipment
    .map((repositoryId) => {
      return itemService.createInventoryItem(repositoryId);
    })
    .filter((item) => item !== null) as Item[];

  const loadStartingEquipment = useCallback(() => {
    // Get starting equipment for the class
    const classDefinition = contentRepository.getClassDefinition(classId);
    if (classDefinition?.startingEquipment) {
      // Notify parent with original repository IDs
      onEquipmentReady(classDefinition.startingEquipment);
    } else {
      // No starting equipment
      onEquipmentReady([]);
    }
  }, [classId, contentRepository, onEquipmentReady]);

  useEffect(() => {
    if (!isInitialized && classId) {
      loadStartingEquipment();
      setIsInitialized(true);
    }
  }, [classId, isInitialized, loadStartingEquipment]);

  // Sync with selectedEquipment changes
  useEffect(() => {
    // This effect ensures the component re-renders when selectedEquipment changes
    // The equipment array is computed from selectedEquipment above
  }, [selectedEquipment]);

  const handleAddItem = (repositoryId: string) => {
    // Add to the selectedEquipment array
    const newSelectedEquipment = [...selectedEquipment, repositoryId];
    onEquipmentReady(newSelectedEquipment);
  };

  const handleRemoveItem = (itemId: string) => {
    // Find the item in the equipment array to get its index
    const itemIndex = equipment.findIndex((item) => item.id === itemId);
    if (itemIndex >= 0) {
      // Remove the corresponding repository ID from selectedEquipment
      const newSelectedEquipment = selectedEquipment.filter((_, index) => index !== itemIndex);
      onEquipmentReady(newSelectedEquipment);
    }
  };

  const getItemIcon = (item: Item) => {
    switch (item.type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        return item.isMainArmor ? <Shield className="w-4 h-4" /> : <Shirt className="w-4 h-4" />;
      case "consumable":
        return <Beaker className="w-4 h-4" />;
      case "ammunition":
        return <Target className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getItemDescription = (item: Item) => {
    switch (item.type) {
      case "weapon":
        return item.damage ? `Damage: ${item.damage}` : "";
      case "armor":
        return item.armor ? `AC: ${item.armor}` : "";
      case "consumable":
      case "ammunition":
        return `Count: ${item.count}`;
      default:
        return item.description || "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Select Starting Equipment</h3>
          <p className="text-sm text-muted-foreground">Choose your starting gear and equipment</p>
        </div>
        <Button onClick={() => setIsItemBrowserOpen(true)} variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Browse Items
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Starting Equipment</span>
            <Badge variant="outline">
              {equipment.length} {equipment.length === 1 ? "item" : "items"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No equipment selected</p>
              <Button
                onClick={() => setIsItemBrowserOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getItemIcon(item)}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getItemDescription(item)}
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleRemoveItem(item.id)} variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ItemBrowser
        isOpen={isItemBrowserOpen}
        onClose={() => setIsItemBrowserOpen(false)}
        onItemAdd={(repositoryId) => {
          handleAddItem(repositoryId);
          setIsItemBrowserOpen(false);
        }}
      />
    </div>
  );
}
