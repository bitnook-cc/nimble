import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Character } from "../../schemas/character";
import { ServiceFactory } from "../service-factory";
import { InMemoryStorageService } from "../storage-service";

/**
 * Example test demonstrating how to use in-memory storage for testing
 * This allows tests to run without touching actual localStorage
 */
describe("Example: Using In-Memory Storage in Tests", () => {
  beforeEach(() => {
    // Reset services and set to use in-memory storage
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");
  });

  afterEach(() => {
    // Reset back to default localStorage for other tests
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  it("should use in-memory storage for character storage", async () => {
    // Get the storage service to verify it's in-memory
    const { getStorageService } = await import("../service-factory");
    const storage = getStorageService();

    // Verify we're using InMemoryStorageService
    expect(storage.constructor.name).toBe("InMemoryStorageService");

    // Store some test data directly
    storage.setItem("test-key", "test-value");
    expect(storage.getItem("test-key")).toBe("test-value");

    // Clear for next test
    storage.clear();
  });

  it("should isolate storage between tests", async () => {
    // Each test gets a fresh in-memory storage instance
    const { getCharacterStorage } = await import("../service-factory");
    const characterStorage = getCharacterStorage();

    // Should be empty at start of test
    const characters = await characterStorage.getAllCharacters();
    expect(characters).toHaveLength(0);
  });

  it("can directly use InMemoryStorageService for simple storage needs", () => {
    // You can also directly use the storage service for non-character data
    const storage = new InMemoryStorageService();

    // Store test data
    storage.setItem("test-settings", JSON.stringify({ theme: "dark" }));

    // Retrieve test data
    const settings = JSON.parse(storage.getItem("test-settings") || "{}");
    expect(settings.theme).toBe("dark");

    // Clear all data
    storage.clear();
    expect(storage.getItem("test-settings")).toBeNull();
  });

  it("can inspect storage state in tests", () => {
    const storage = new InMemoryStorageService();

    // Set up test data
    storage.setItem("key1", "value1");
    storage.setItem("key2", "value2");

    // Use helper method to inspect all storage
    const allData = storage.getAll();
    expect(allData).toEqual({
      key1: "value1",
      key2: "value2",
    });

    // Use helper method to bulk set data
    storage.setAll({
      setting1: "enabled",
      setting2: "disabled",
    });

    expect(storage.getAllKeys()).toContain("setting1");
    expect(storage.getAllKeys()).toContain("setting2");
  });
});
