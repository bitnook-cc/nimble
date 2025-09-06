"use client";

import { Download, FileText } from "lucide-react";

import { useState } from "react";

import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export interface PDFExportOptions {
  template: "full-page" | "half-page";
  editable: boolean;
}

interface PDFExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: PDFExportOptions) => void;
  isExporting?: boolean;
}

export function PDFExportDialog({
  isOpen,
  onClose,
  onExport,
  isExporting = false,
}: PDFExportDialogProps) {
  const [template, setTemplate] = useState<"full-page" | "half-page">("full-page");
  const [editable, setEditable] = useState(true);

  const handleExport = () => {
    onExport({ template, editable });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Character Sheet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Page Size</Label>
            <RadioGroup
              value={template}
              onValueChange={(value) => setTemplate(value as "full-page" | "half-page")}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full-page" id="full-page" />
                <Label htmlFor="full-page" className="text-sm">
                  Full Page
                  <span className="text-muted-foreground ml-1">(Standard 8.5x11&quot;)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="half-page" id="half-page" />
                <Label htmlFor="half-page" className="text-sm">
                  Half Page
                  <span className="text-muted-foreground ml-1">(Compact layout)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Editable Option */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Form Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editable"
                checked={editable}
                onCheckedChange={(checked) => setEditable(checked as boolean)}
              />
              <Label htmlFor="editable" className="text-sm">
                Keep form editable
                <span className="text-muted-foreground ml-1 block text-xs">
                  Uncheck to flatten the form (prevents further editing)
                </span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
