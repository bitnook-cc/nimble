/**
 * Generic storage interface that can be implemented by different storage backends
 */
export interface IStorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  getAllKeys(): string[];
}

/**
 * LocalStorage implementation for browser environments
 */
export class LocalStorageService implements IStorageService {
  private isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.localStorage;
  }

  getItem(key: string): string | null {
    if (!this.isAvailable()) return null;
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (!this.isAvailable())
      throw new Error("Browser storage is unavailable; changes could not be saved");
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (!this.isAvailable()) throw new Error("Browser storage is unavailable");
    localStorage.removeItem(key);
  }

  clear(): void {
    if (!this.isAvailable()) {
      console.warn("LocalStorage is not available");
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Error clearing localStorage: ${error}`);
    }
  }

  getAllKeys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error(`Error getting keys from localStorage: ${error}`);
      return [];
    }
  }
}

/**
 * In-memory storage implementation for testing and server environments
 */
export class InMemoryStorageService implements IStorageService {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Helper method for testing - get the entire storage state
   */
  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    this.storage.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Helper method for testing - set multiple items at once
   */
  setAll(items: Record<string, string>): void {
    Object.entries(items).forEach(([key, value]) => {
      this.storage.set(key, value);
    });
  }
}
