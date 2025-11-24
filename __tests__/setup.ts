/**
 * Vitest Test Setup
 * This file runs before each test file
 */

import { vi } from "vitest"

// Mock localStorage for browser-like environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
})

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2)}`,
  },
})

// Mock performance.now() for timing tests
if (typeof performance === "undefined") {
  Object.defineProperty(global, "performance", {
    value: {
      now: () => Date.now(),
    },
  })
}

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear()
})

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks()
})
