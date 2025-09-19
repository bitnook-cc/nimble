"use client";

import { AuthUser } from "@nimble/shared";

import { useEffect, useState } from "react";

import { authService } from "@/lib/services/auth-service";

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    authService.fetchUser().then((response) => {
      if (response.user) {
        setUser(response.user);
      }
      setLoading(false);
    });

    // Listen for auth changes from other components
    const handleAuthChange = (event: CustomEvent) => {
      if (event.detail.authenticated) {
        // Re-fetch user data when authenticated
        authService.fetchUser().then((response) => {
          setUser(response.user || null);
        });
      } else {
        // Clear user when logged out
        setUser(null);
      }
    };

    window.addEventListener("auth-changed", handleAuthChange as EventListener);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange as EventListener);
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: user !== null,
  };
}