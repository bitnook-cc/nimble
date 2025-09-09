"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AttributeName } from "@/lib/schemas/character";
import { AttributeBoostFeatureEffect } from "@/lib/schemas/features";

interface AttributeBoostSelectionDialogProps {
  effect: AttributeBoostFeatureEffect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (attribute: AttributeName, amount: number) => void;
  existingSelection?: AttributeName;
}

export function AttributeBoostSelectionDialog({
  effect,
  open,
  onOpenChange,
  onConfirm,
  existingSelection,
}: AttributeBoostSelectionDialogProps) {
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeName | null>(null);
  const isEditMode = !!existingSelection;

  // Initialize selection when dialog opens
  useEffect(() => {
    if (open && existingSelection) {
      setSelectedAttribute(existingSelection);
    } else if (open) {
      setSelectedAttribute(null);
    }
  }, [open, existingSelection]);

  const handleConfirm = () => {
    if (!selectedAttribute) return;
    onConfirm(selectedAttribute, effect.amount || 1);
    onOpenChange(false);
  };

  const attributes: AttributeName[] = ["strength", "dexterity", "intelligence", "will"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Choose"} Attribute Boost</DialogTitle>
          <DialogDescription>
            Select which attribute to increase by {effect.amount || 1}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {attributes.map((attr) => (
            <Button
              key={attr}
              variant={selectedAttribute === attr ? "default" : "outline"}
              onClick={() => setSelectedAttribute(attr)}
              className="h-auto py-4 flex flex-col gap-1"
            >
              <div className="text-lg font-semibold capitalize">{attr}</div>
              <div className="text-sm opacity-80">+{effect.amount || 1}</div>
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!selectedAttribute}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
