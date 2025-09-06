import { useEffect, useState } from "react";

import { Toast, toastService } from "../services/toast-service";

/**
 * Custom hook that provides direct access to toast service with automatic re-rendering.
 * Eliminates the need for React Context by subscribing to service changes directly.
 */
export function useToastService() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Subscribe to toast changes
    const unsubscribe = toastService.subscribeToToasts((updatedToasts) => {
      setToasts(updatedToasts);
    });

    // Initialize with current toasts
    setToasts(toastService.toasts);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    // State
    toasts,

    // Service methods - direct access to all toast operations
    addToast: toastService.addToast.bind(toastService),
    removeToast: toastService.removeToast.bind(toastService),
    showError: toastService.showError.bind(toastService),
    showSuccess: toastService.showSuccess.bind(toastService),
    showWarning: toastService.showWarning.bind(toastService),
    showInfo: toastService.showInfo.bind(toastService),
    clearAllToasts: toastService.clearAllToasts.bind(toastService),
  };
}
