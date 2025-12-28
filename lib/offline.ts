/**
 * Offline Detection and Sync Utilities
 *
 * Features:
 * - Network status detection
 * - Offline-first data persistence
 * - Background sync queue
 * - Conflict resolution
 */

import { loggers } from './logger'

const log = loggers.sync

export type NetworkStatus = 'online' | 'offline' | 'slow'

export interface SyncQueueItem<T = unknown> {
  id: string
  type: 'create' | 'update' | 'delete'
  resource: string
  data: T
  timestamp: number
  retryCount: number
  maxRetries: number
}

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  pending: number
}

// Subscribers for network status changes
type NetworkStatusCallback = (status: NetworkStatus) => void
const networkStatusCallbacks: Set<NetworkStatusCallback> = new Set()

// Current network status
let currentNetworkStatus: NetworkStatus = 'online'

// Sync queue for offline operations
const SYNC_QUEUE_KEY = 'offline_sync_queue'

/**
 * Initialize network status monitoring
 */
export function initNetworkMonitoring(): () => void {
  if (typeof window === 'undefined') return () => {}

  const updateStatus = () => {
    const wasOnline = currentNetworkStatus === 'online'
    currentNetworkStatus = navigator.onLine ? 'online' : 'offline'

    log.info(`Network status: ${currentNetworkStatus}`)
    networkStatusCallbacks.forEach(cb => cb(currentNetworkStatus))

    // Trigger sync when coming back online
    if (!wasOnline && currentNetworkStatus === 'online') {
      log.info('Back online - triggering sync')
      processSyncQueue()
    }
  }

  // Initial status
  currentNetworkStatus = navigator.onLine ? 'online' : 'offline'

  // Listen for network changes
  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)

  // Also check connection quality periodically
  const qualityCheckInterval = setInterval(async () => {
    if (navigator.onLine) {
      const quality = await checkConnectionQuality()
      if (quality === 'slow' && currentNetworkStatus !== 'slow') {
        currentNetworkStatus = 'slow'
        networkStatusCallbacks.forEach(cb => cb('slow'))
      }
    }
  }, 30000)

  return () => {
    window.removeEventListener('online', updateStatus)
    window.removeEventListener('offline', updateStatus)
    clearInterval(qualityCheckInterval)
  }
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkStatus(callback: NetworkStatusCallback): () => void {
  networkStatusCallbacks.add(callback)

  // Immediately call with current status
  callback(currentNetworkStatus)

  return () => {
    networkStatusCallbacks.delete(callback)
  }
}

/**
 * Get current network status
 */
export function getNetworkStatus(): NetworkStatus {
  if (typeof window === 'undefined') return 'online'
  return currentNetworkStatus
}

/**
 * Check if currently online
 */
export function isOnline(): boolean {
  return currentNetworkStatus === 'online'
}

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return currentNetworkStatus === 'offline'
}

/**
 * Check connection quality by measuring latency
 */
async function checkConnectionQuality(): Promise<'fast' | 'slow' | 'offline'> {
  if (!navigator.onLine) return 'offline'

  try {
    const start = performance.now()
    await fetch('/api/health', { method: 'HEAD', cache: 'no-store' })
    const latency = performance.now() - start

    // Consider > 3s as slow
    return latency > 3000 ? 'slow' : 'fast'
  } catch {
    return 'offline'
  }
}

/**
 * Load sync queue from localStorage
 */
function loadSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Save sync queue to localStorage
 */
function saveSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    log.error('Failed to save sync queue:', error)
  }
}

/**
 * Add an item to the sync queue
 */
export function addToSyncQueue<T>(item: Omit<SyncQueueItem<T>, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = loadSyncQueue()

  const newItem: SyncQueueItem<T> = {
    ...item,
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  }

  queue.push(newItem as SyncQueueItem)
  saveSyncQueue(queue)

  log.debug('Added to sync queue:', newItem.type, newItem.resource)

  // Try to sync immediately if online
  if (isOnline()) {
    processSyncQueue()
  }
}

/**
 * Get pending sync items
 */
export function getPendingSyncItems(): SyncQueueItem[] {
  return loadSyncQueue()
}

/**
 * Get sync queue size
 */
export function getSyncQueueSize(): number {
  return loadSyncQueue().length
}

/**
 * Process the sync queue
 */
export async function processSyncQueue(
  syncHandler?: (item: SyncQueueItem) => Promise<boolean>
): Promise<SyncResult> {
  if (isOffline()) {
    return { success: false, synced: 0, failed: 0, pending: getSyncQueueSize() }
  }

  const queue = loadSyncQueue()
  if (queue.length === 0) {
    return { success: true, synced: 0, failed: 0, pending: 0 }
  }

  log.info(`Processing sync queue: ${queue.length} items`)

  const results = {
    synced: 0,
    failed: 0,
    remaining: [] as SyncQueueItem[],
  }

  for (const item of queue) {
    try {
      let success = false

      if (syncHandler) {
        success = await syncHandler(item)
      } else {
        // Default sync handler - makes API call based on item type
        success = await defaultSyncHandler(item)
      }

      if (success) {
        results.synced++
        log.debug('Synced:', item.type, item.resource)
      } else {
        throw new Error('Sync handler returned false')
      }
    } catch (error) {
      item.retryCount++

      if (item.retryCount < item.maxRetries) {
        results.remaining.push(item)
        log.warn(`Sync failed, will retry (${item.retryCount}/${item.maxRetries}):`, item.resource)
      } else {
        results.failed++
        log.error('Sync permanently failed:', item.resource, error)
      }
    }
  }

  // Save remaining items
  saveSyncQueue(results.remaining)

  return {
    success: results.failed === 0,
    synced: results.synced,
    failed: results.failed,
    pending: results.remaining.length,
  }
}

/**
 * Default sync handler for API operations
 */
async function defaultSyncHandler(item: SyncQueueItem): Promise<boolean> {
  const { type, resource, data } = item

  const url = resource.startsWith('/') ? resource : `/api/${resource}`

  const response = await fetch(url, {
    method: type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: type !== 'delete' ? JSON.stringify(data) : undefined,
  })

  return response.ok
}

/**
 * Clear the sync queue
 */
export function clearSyncQueue(): void {
  saveSyncQueue([])
  log.info('Sync queue cleared')
}

/**
 * Offline-first data wrapper
 *
 * Stores data locally first, then syncs to server
 */
export class OfflineFirstStore<T extends { id: string }> {
  private readonly storageKey: string
  private readonly resource: string

  constructor(storageKey: string, resource: string) {
    this.storageKey = storageKey
    this.resource = resource
  }

  /**
   * Get all items from local storage
   */
  getAll(): T[] {
    if (typeof window === 'undefined') return []

    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  /**
   * Get a single item by ID
   */
  get(id: string): T | null {
    const items = this.getAll()
    return items.find(item => item.id === id) || null
  }

  /**
   * Save all items locally
   */
  private saveLocal(items: T[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.storageKey, JSON.stringify(items))
  }

  /**
   * Create a new item (offline-first)
   */
  create(item: T): void {
    const items = this.getAll()
    items.push(item)
    this.saveLocal(items)

    // Queue for sync
    addToSyncQueue({
      type: 'create',
      resource: this.resource,
      data: item,
      maxRetries: 3,
    })
  }

  /**
   * Update an item (offline-first)
   */
  update(id: string, updates: Partial<T>): void {
    const items = this.getAll()
    const index = items.findIndex(item => item.id === id)

    if (index >= 0) {
      items[index] = { ...items[index], ...updates }
      this.saveLocal(items)

      // Queue for sync
      addToSyncQueue({
        type: 'update',
        resource: `${this.resource}/${id}`,
        data: items[index],
        maxRetries: 3,
      })
    }
  }

  /**
   * Delete an item (offline-first)
   */
  delete(id: string): void {
    const items = this.getAll()
    const filtered = items.filter(item => item.id !== id)
    this.saveLocal(filtered)

    // Queue for sync
    addToSyncQueue({
      type: 'delete',
      resource: `${this.resource}/${id}`,
      data: { id },
      maxRetries: 3,
    })
  }

  /**
   * Merge server data with local data (for initial sync)
   */
  merge(serverItems: T[], lastSyncTime?: number): void {
    const localItems = this.getAll()
    const localMap = new Map(localItems.map(item => [item.id, item]))

    // Server wins for items that haven't been modified locally
    for (const serverItem of serverItems) {
      if (!localMap.has(serverItem.id)) {
        localMap.set(serverItem.id, serverItem)
      }
      // Could add more sophisticated conflict resolution here
    }

    this.saveLocal(Array.from(localMap.values()))
  }
}

// Initialize network monitoring when module loads
if (typeof window !== 'undefined') {
  initNetworkMonitoring()
}
