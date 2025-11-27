/**
 * AsyncStorage Adapter for React Native
 * Implements the StorageAdapter interface from @chameleon/shared
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { setStorageAdapter, type StorageAdapter } from '@chameleon/shared/utils/storage'

const asyncStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key)
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value)
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key)
  },
  clear: async () => {
    await AsyncStorage.clear()
  },
}

export function initStorage() {
  setStorageAdapter(asyncStorageAdapter)
}
