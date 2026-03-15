import { useEffect } from "react";

import { themeService } from "@/lib/services/theme-service";

/**
 * Hook to initialize theme on client side after hydration
 * This prevents hydration mismatches by ensuring theme changes
 * only happen after React has fully hydrated the DOM
 */
export function useThemeInit() {
  useEffect(() => {
    // Initialize theme only on client side after mount
    // Using async IIFE since useEffect can't be async directly
    (async () => {
      await themeService.initializeTheme();
    })();
  }, []); // Empty deps - run once on mount
}
