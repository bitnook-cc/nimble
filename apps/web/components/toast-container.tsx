"use client";

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useToastService } from "@/lib/hooks/use-toast-service";
import { Toast } from "@/lib/services/toast-service";
import { DiceFormulaDisplay, DoubleDigitDiceDisplay } from "@/lib/utils/dice-display-components";

export function ToastContainer() {
  const { toasts, removeToast } = useToastService();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-30 right-4 z-40 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-l-green-500";
      case "error":
        return "border-l-red-500";
      case "warning":
        return "border-l-yellow-500";
      case "info":
        return "border-l-blue-500";
    }
  };

  return (
    <div
      className={`bg-background border border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.diceResult && toast.diceResult.tokens ? (
            <div className="mt-1">
              <DiceFormulaDisplay
                tokens={toast.diceResult.tokens}
                total={toast.diceResult.total}
                isFumble={toast.diceResult.isFumble}
              />
            </div>
          ) : (
            toast.description && (
              <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
            )
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-muted"
          onClick={() => onRemove(toast.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
