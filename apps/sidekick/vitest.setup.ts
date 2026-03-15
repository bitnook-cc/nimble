import "@testing-library/jest-dom";
import { beforeEach } from "vitest";

import React from "react";

// Make React available globally for JSX
global.React = React;

// Mock localStorage for testing
class InMemoryStorage implements Storage {
  private storage: Map<string, string> = new Map();

  get length(): number {
    return this.storage.size;
  }

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

  key(index: number): string | null {
    const keys = Array.from(this.storage.keys());
    return keys[index] ?? null;
  }
}

// Create instances for localStorage and sessionStorage
const localStorageMock = new InMemoryStorage();
const sessionStorageMock = new InMemoryStorage();

// Define on global object
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(global, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// Reset storage before each test
beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});
