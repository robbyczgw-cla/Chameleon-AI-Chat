/**
 * Storage Utilities
 * Platform-agnostic interface for localStorage (web) / AsyncStorage (mobile)
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}

// This will be implemented differently on web vs mobile
let adapter: StorageAdapter | null = null

export function setStorageAdapter(newAdapter: StorageAdapter) {
  adapter = newAdapter
}

export async function getItem(key: string): Promise<string | null> {
  if (!adapter) throw new Error('Storage adapter not initialized')
  return adapter.getItem(key)
}

export async function setItem(key: string, value: string): Promise<void> {
  if (!adapter) throw new Error('Storage adapter not initialized')
  return adapter.setItem(key, value)
}

export async function removeItem(key: string): Promise<void> {
  if (!adapter) throw new Error('Storage adapter not initialized')
  return adapter.removeItem(key)
}

export async function clear(): Promise<void> {
  if (!adapter) throw new Error('Storage adapter not initialized')
  return adapter.clear()
}

// Helper to store/retrieve JSON
export async function getJSON<T = any>(key: string): Promise<T | null> {
  const raw = await getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function setJSON(key: string, value: any): Promise<void> {
  return setItem(key, JSON.stringify(value))
}
