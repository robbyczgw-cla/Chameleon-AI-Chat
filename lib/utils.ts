import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  // Use native crypto.randomUUID if available
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate a stable unique key for list items
 * Use this instead of array index as React key
 *
 * @param prefix - A prefix to identify the type of item
 * @param value - The content/value to hash (e.g., text content)
 * @param index - Optional index to add uniqueness if values can be identical
 * @returns A stable unique key string
 *
 * @example
 * items.map((item, i) => <div key={generateKey('msg', item.text, i)}>{item.text}</div>)
 */
export function generateKey(prefix: string, value: string, index?: number): string {
  // Create a simple hash from the value
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(36)
  return index !== undefined ? `${prefix}-${hashStr}-${index}` : `${prefix}-${hashStr}`
}

/**
 * Generate a stable key from multiple values
 *
 * @param parts - Array of strings to combine into a key
 * @returns A unique key string
 */
export function generateCompositeKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join('-')
}
