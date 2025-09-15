import { AuthUser } from "@nimble/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "../auth-service";

// Mock the fetch function globally
global.fetch = vi.fn();

// Mock window methods
const mockReload = vi.fn();
Object.defineProperty(window, "location", {
  value: {
    reload: mockReload,
    origin: "http://localhost:3000",
  },
  writable: true,
});

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the service's internal user state
    (authService as any).user = null;
  });

  describe("fetchUser", () => {
    it("should fetch and cache user when authenticated", async () => {
      const mockUser: AuthUser = {
        id: "user-123",
        googleId: "google-123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.png",
        loginCount: 5,
        lastLoginAt: "2024-01-01T00:00:00Z",
        createdAt: "2023-01-01T00:00:00Z",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const result = await authService.fetchUser();

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/auth/user",
        { credentials: "include" }
      );
    });

    it("should return error when not authenticated (401)", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await authService.fetchUser();

      expect(result.user).toBeUndefined();
      expect(result.error).toBe("Not authenticated");
    });

    it("should return error when server fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await authService.fetchUser();

      expect(result.user).toBeUndefined();
      expect(result.error).toBe("Failed to fetch user");
    });

    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const result = await authService.fetchUser();

      expect(result.user).toBeUndefined();
      expect(result.error).toBe("Failed to fetch user");
    });
  });

  describe("getUser", () => {
    it("should return cached user if available", async () => {
      const mockUser: AuthUser = {
        id: "user-123",
        googleId: "google-123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.png",
        loginCount: 5,
        lastLoginAt: "2024-01-01T00:00:00Z",
        createdAt: "2023-01-01T00:00:00Z",
      };

      // Set the cached user
      (authService as any).user = mockUser;

      const user = await authService.getUser();

      expect(user).toEqual(mockUser);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should fetch user if not cached", async () => {
      const mockUser: AuthUser = {
        id: "user-123",
        googleId: "google-123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.png",
        loginCount: 5,
        lastLoginAt: "2024-01-01T00:00:00Z",
        createdAt: "2023-01-01T00:00:00Z",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const user = await authService.getUser();

      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should return null when user is not authenticated", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const user = await authService.getUser();

      expect(user).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when user is cached", () => {
      const mockUser: AuthUser = {
        id: "user-123",
        googleId: "google-123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.png",
        loginCount: 5,
        lastLoginAt: "2024-01-01T00:00:00Z",
        createdAt: "2023-01-01T00:00:00Z",
      };

      (authService as any).user = mockUser;

      expect(authService.isAuthenticated()).toBe(true);
    });

    it("should return false when user is not cached", () => {
      (authService as any).user = null;

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe("logout", () => {
    it("should call logout endpoint and reload page on success", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await authService.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
      expect(mockReload).toHaveBeenCalled();
      expect((authService as any).user).toBeNull();
    });

    it("should handle logout failure gracefully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await authService.logout();

      expect(consoleSpy).toHaveBeenCalledWith("Error logging out:", expect.any(Error));
      expect(mockReload).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle network errors during logout", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await authService.logout();

      expect(consoleSpy).toHaveBeenCalledWith("Error logging out:", expect.any(Error));
      expect(mockReload).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("login", () => {
    let mockOpen: any;
    let mockAddEventListener: any;
    let mockRemoveEventListener: any;
    let mockSetInterval: any;
    let mockClearInterval: any;

    beforeEach(() => {
      mockOpen = vi.fn();
      mockAddEventListener = vi.fn();
      mockRemoveEventListener = vi.fn();
      mockSetInterval = vi.fn();
      mockClearInterval = vi.fn();

      window.open = mockOpen;
      window.addEventListener = mockAddEventListener;
      window.removeEventListener = mockRemoveEventListener;
      global.setInterval = mockSetInterval as any;
      global.clearInterval = mockClearInterval;
    });

    it("should open popup and handle successful authentication", async () => {
      const mockUser: AuthUser = {
        id: "user-123",
        googleId: "google-123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.png",
        loginCount: 1,
        lastLoginAt: "2024-01-01T00:00:00Z",
        createdAt: "2023-01-01T00:00:00Z",
      };

      const mockPopup = { closed: false };
      mockOpen.mockReturnValue(mockPopup);

      let intervalCallback: any;
      mockSetInterval.mockImplementation((callback: any) => {
        intervalCallback = callback;
        return 123; // mock interval ID
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const loginPromise = authService.login();

      // Simulate the auth success message
      const messageHandler = mockAddEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )[1];

      await messageHandler({
        origin: "http://localhost:3000",
        data: { type: "auth-success" },
      });

      const result = await loginPromise;

      expect(result).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("/auth/initiate"),
        "google-auth",
        expect.any(String)
      );
      expect(mockClearInterval).toHaveBeenCalledWith(123);
      expect(mockRemoveEventListener).toHaveBeenCalledWith("message", messageHandler);
    });

    it("should handle authentication failure", async () => {
      const mockPopup = { closed: false };
      mockOpen.mockReturnValue(mockPopup);

      mockSetInterval.mockImplementation(() => 123);

      const loginPromise = authService.login();

      // Simulate the auth failed message
      const messageHandler = mockAddEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )[1];

      messageHandler({
        origin: "http://localhost:3000",
        data: { type: "auth-failed" },
      });

      await expect(loginPromise).rejects.toThrow("Authentication failed");
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    });

    it("should handle popup being blocked", async () => {
      mockOpen.mockReturnValue(null);

      await expect(authService.login()).rejects.toThrow(
        "Popup blocked. Please allow popups for this site."
      );
    });

    it("should handle popup being closed manually", async () => {
      const mockPopup = { closed: false };
      mockOpen.mockReturnValue(mockPopup);

      let intervalCallback: any;
      mockSetInterval.mockImplementation((callback: any) => {
        intervalCallback = callback;
        return 123;
      });

      const loginPromise = authService.login();

      // Simulate popup being closed
      mockPopup.closed = true;
      intervalCallback();

      await expect(loginPromise).rejects.toThrow("Authentication cancelled");
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    });

    it("should ignore messages from different origins", async () => {
      const mockPopup = { closed: false };
      mockOpen.mockReturnValue(mockPopup);

      mockSetInterval.mockImplementation(() => 123);

      const loginPromise = authService.login();

      // Simulate message from different origin
      const messageHandler = mockAddEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )[1];

      messageHandler({
        origin: "http://evil.com",
        data: { type: "auth-success" },
      });

      // The promise should still be pending
      const raceResult = await Promise.race([
        loginPromise.catch(() => "error"),
        new Promise((resolve) => setTimeout(() => resolve("timeout"), 100)),
      ]);

      expect(raceResult).toBe("timeout");
    });
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = authService;
      const instance2 = authService;

      expect(instance1).toBe(instance2);
    });
  });
});