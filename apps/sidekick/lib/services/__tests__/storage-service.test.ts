import { beforeEach, describe, expect, it, vi } from "vitest";

import { IStorageService, InMemoryStorageService, LocalStorageService } from "../storage-service";

describe("Storage Services", () => {
  describe("InMemoryStorageService", () => {
    let storage: InMemoryStorageService;

    beforeEach(() => {
      storage = new InMemoryStorageService();
    });

    it("should store and retrieve items", () => {
      storage.setItem("test-key", "test-value");
      expect(storage.getItem("test-key")).toBe("test-value");
    });

    it("should return null for non-existent items", () => {
      expect(storage.getItem("non-existent")).toBeNull();
    });

    it("should remove items", () => {
      storage.setItem("test-key", "test-value");
      storage.removeItem("test-key");
      expect(storage.getItem("test-key")).toBeNull();
    });

    it("should clear all items", () => {
      storage.setItem("key1", "value1");
      storage.setItem("key2", "value2");
      storage.clear();
      expect(storage.getItem("key1")).toBeNull();
      expect(storage.getItem("key2")).toBeNull();
    });

    it("should get all keys", () => {
      storage.setItem("key1", "value1");
      storage.setItem("key2", "value2");
      storage.setItem("key3", "value3");

      const keys = storage.getAllKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
      expect(keys).toContain("key3");
    });

    it("should overwrite existing values", () => {
      storage.setItem("test-key", "value1");
      storage.setItem("test-key", "value2");
      expect(storage.getItem("test-key")).toBe("value2");
    });

    it("should handle complex JSON strings", () => {
      const complexData = JSON.stringify({
        id: "123",
        nested: { data: [1, 2, 3] },
        boolean: true,
      });
      storage.setItem("complex", complexData);
      expect(storage.getItem("complex")).toBe(complexData);
    });

    describe("Helper methods", () => {
      it("should get all items with getAll", () => {
        storage.setItem("key1", "value1");
        storage.setItem("key2", "value2");

        const all = storage.getAll();
        expect(all).toEqual({
          key1: "value1",
          key2: "value2",
        });
      });

      it("should set multiple items with setAll", () => {
        storage.setAll({
          key1: "value1",
          key2: "value2",
          key3: "value3",
        });

        expect(storage.getItem("key1")).toBe("value1");
        expect(storage.getItem("key2")).toBe("value2");
        expect(storage.getItem("key3")).toBe("value3");
      });
    });
  });

  describe("LocalStorageService", () => {
    let storage: LocalStorageService;
    let localStorageMock: {
      getItem: ReturnType<typeof vi.fn>;
      setItem: ReturnType<typeof vi.fn>;
      removeItem: ReturnType<typeof vi.fn>;
      clear: ReturnType<typeof vi.fn>;
      key: ReturnType<typeof vi.fn>;
      length: number;
    };

    beforeEach(() => {
      // Mock localStorage
      localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      };

      // Mock window.localStorage
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
      });

      storage = new LocalStorageService();
    });

    it("should store items in localStorage", () => {
      storage.setItem("test-key", "test-value");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("should retrieve items from localStorage", () => {
      localStorageMock.getItem.mockReturnValue("test-value");
      const result = storage.getItem("test-key");
      expect(localStorageMock.getItem).toHaveBeenCalledWith("test-key");
      expect(result).toBe("test-value");
    });

    it("should remove items from localStorage", () => {
      storage.removeItem("test-key");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should clear localStorage", () => {
      storage.clear();
      expect(localStorageMock.clear).toHaveBeenCalled();
    });

    it("should get all keys from localStorage", () => {
      localStorageMock.length = 3;
      localStorageMock.key.mockImplementation((index: number) => {
        const keys = ["key1", "key2", "key3"];
        return keys[index] || null;
      });

      const keys = storage.getAllKeys();
      expect(keys).toEqual(["key1", "key2", "key3"]);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Should not throw
      expect(() => storage.setItem("test", "value")).not.toThrow();
      // Either error or warn should have been called
      expect(consoleErrorSpy.mock.calls.length + consoleWarnSpy.mock.calls.length).toBeGreaterThan(
        0,
      );

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("should handle missing localStorage gracefully", () => {
      // Remove localStorage
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
      });

      const newStorage = new LocalStorageService();
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(newStorage.getItem("test")).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("LocalStorage is not available");

      consoleSpy.mockRestore();
    });
  });

  describe("Storage Interface Compliance", () => {
    const testStorageImplementation = (createStorage: () => IStorageService) => {
      let storage: IStorageService;

      beforeEach(() => {
        storage = createStorage();
      });

      it("should implement all required methods", () => {
        expect(storage.getItem).toBeDefined();
        expect(storage.setItem).toBeDefined();
        expect(storage.removeItem).toBeDefined();
        expect(storage.clear).toBeDefined();
        expect(storage.getAllKeys).toBeDefined();
      });

      it("should handle basic CRUD operations", () => {
        // Create
        storage.setItem("key", "value");

        // Read
        expect(storage.getItem("key")).toBe("value");

        // Update
        storage.setItem("key", "new-value");
        expect(storage.getItem("key")).toBe("new-value");

        // Delete
        storage.removeItem("key");
        expect(storage.getItem("key")).toBeNull();
      });
    };

    describe("InMemoryStorageService", () => {
      testStorageImplementation(() => new InMemoryStorageService());
    });

    describe("LocalStorageService with mocked localStorage", () => {
      testStorageImplementation(() => {
        const mockStorage: Record<string, string> = {};

        Object.defineProperty(window, "localStorage", {
          value: {
            getItem: vi.fn((key: string) => mockStorage[key] || null),
            setItem: vi.fn((key: string, value: string) => {
              mockStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
              delete mockStorage[key];
            }),
            clear: vi.fn(() => {
              for (const key in mockStorage) {
                delete mockStorage[key];
              }
            }),
            key: vi.fn((index: number) => Object.keys(mockStorage)[index] || null),
            get length() {
              return Object.keys(mockStorage).length;
            },
          },
          writable: true,
        });

        return new LocalStorageService();
      });
    });
  });
});
