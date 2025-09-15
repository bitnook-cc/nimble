import { AuthUser } from "@nimble/shared";

import { apiUrl } from "@/lib/utils/api";

interface AuthResponse {
  user?: AuthUser;
  error?: string;
}

class AuthService {
  private static instance: AuthService;
  private user: AuthUser | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async fetchUser(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${apiUrl}/auth/user`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return { user: data.user };
      } else if (response.status === 401) {
        this.user = null;
        return { error: "Not authenticated" };
      } else {
        throw new Error("Failed to fetch user");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return { error: "Failed to fetch user" };
    }
  }

  async logout(): Promise<void> {
    try {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        this.user = null;
        // Reload the page to clear any client-side state
        window.location.reload();
      } else {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  login(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Open OAuth in a popup window
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      // Build the callback URL on the same origin as the client
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);

      // Open the initiate page on the same origin, which will then redirect to the API
      const popup = window.open(
        `/auth/initiate?redirect_uri=${encodedCallbackUrl}`,
        "google-auth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
      );

      if (!popup) {
        reject(new Error("Popup blocked. Please allow popups for this site."));
        return;
      }

      let isResolved = false;
      let checkClosed: NodeJS.Timeout;

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener("message", handleMessage);
        if (checkClosed) clearInterval(checkClosed);
        isResolved = true;
      };

      // Listen for messages from the popup
      const handleMessage = async (event: MessageEvent) => {
        // Verify the message is from the same origin (our callback page)
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === "auth-success") {
          cleanup();
          // Don't try to close the popup from here - it closes itself

          // Fetch the user data
          const response = await this.fetchUser();
          if (response.user) {
            resolve(true);
          } else {
            reject(new Error("Failed to fetch user after authentication"));
          }
        } else if (event.data.type === "auth-failed") {
          cleanup();
          // Don't try to close the popup from here - it closes itself
          reject(new Error("Authentication failed"));
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup was closed manually
      // We need to poll because we can't add event listeners to cross-origin windows
      checkClosed = setInterval(() => {
        if (popup.closed) {
          if (!isResolved) {
            cleanup();
            reject(new Error("Authentication cancelled"));
          }
        }
      }, 500);
    });
  }

  async getUser(): Promise<AuthUser | null> {
    // If user is already cached, return it
    if (this.user) {
      return this.user;
    }

    // Otherwise, try to fetch the user from the server
    const response = await this.fetchUser();
    return response.user || null;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }
}

export const authService = AuthService.getInstance();
