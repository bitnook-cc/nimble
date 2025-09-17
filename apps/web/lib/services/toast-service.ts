import { DiceRollData } from "@nimble/dice";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  diceData?: DiceRollData;
  duration?: number;
}

export class ToastService {
  private _toasts: Toast[] = [];
  private toastListeners: ((toasts: Toast[]) => void)[] = [];

  // Public getter for toasts
  get toasts(): Toast[] {
    return this._toasts;
  }

  // State Management with subscriptions
  subscribeToToasts(listener: (toasts: Toast[]) => void): () => void {
    this.toastListeners.push(listener);
    listener(this._toasts);

    // Return unsubscribe function
    return () => {
      this.toastListeners = this.toastListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.toastListeners.forEach((listener) => listener(this._toasts));
  }

  removeToast(id: string): void {
    this._toasts = this._toasts.filter((toast) => toast.id !== id);
    this.notifyListeners();
  }

  addToast(toast: Omit<Toast, "id">): void {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    this._toasts = [...this._toasts, newToast];
    this.notifyListeners();

    // Auto-remove toast after duration (default 5 seconds)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  showError(title: string, description?: string): void {
    this.addToast({ type: "error", title, description });
  }

  showSuccess(title: string, description?: string): void {
    this.addToast({ type: "success", title, description });
  }

  showWarning(title: string, description?: string): void {
    this.addToast({ type: "warning", title, description });
  }

  showInfo(title: string, description?: string): void {
    this.addToast({ type: "info", title, description });
  }

  showDiceRoll(title: string, diceData?: DiceRollData, description?: string): void {
    this.addToast({
      type: "info",
      title,
      description,
      diceData,
      duration: 7000, // Slightly longer for dice rolls
    });
  }

  clearAllToasts(): void {
    this._toasts = [];
    this.notifyListeners();
  }
}

export const toastService = new ToastService();
