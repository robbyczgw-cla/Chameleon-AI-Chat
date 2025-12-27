"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  subscribeToNetworkStatus,
  getNetworkStatus,
  isOnline,
  isOffline,
  getSyncQueueSize,
  processSyncQueue,
  type NetworkStatus,
  type SyncResult,
} from '@/lib/offline'

/**
 * Hook to monitor network status
 *
 * @returns Network status and sync queue info
 *
 * @example
 * const { status, isOnline, pendingSync, syncNow } = useNetworkStatus()
 *
 * if (!isOnline) {
 *   return <OfflineBanner />
 * }
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(() => getNetworkStatus())
  const [pendingSync, setPendingSync] = useState(() => getSyncQueueSize())
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = subscribeToNetworkStatus((newStatus) => {
      setStatus(newStatus)
    })

    // Update pending sync count periodically
    const interval = setInterval(() => {
      setPendingSync(getSyncQueueSize())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      return { success: false, synced: 0, failed: 0, pending: pendingSync }
    }

    setIsSyncing(true)
    try {
      const result = await processSyncQueue()
      setPendingSync(result.pending)
      return result
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, pendingSync])

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
    pendingSync,
    isSyncing,
    syncNow,
  }
}

/**
 * Hook that shows a toast when going offline/online
 */
export function useNetworkStatusToast(
  showToast: (options: { title: string; description?: string; variant?: string }) => void
) {
  const { status } = useNetworkStatus()
  const [previousStatus, setPreviousStatus] = useState<NetworkStatus | null>(null)

  useEffect(() => {
    if (previousStatus === null) {
      setPreviousStatus(status)
      return
    }

    if (previousStatus !== status) {
      if (status === 'offline') {
        showToast({
          title: 'You are offline',
          description: 'Changes will be synced when you reconnect',
          variant: 'destructive',
        })
      } else if (status === 'online' && previousStatus === 'offline') {
        showToast({
          title: 'Back online',
          description: 'Syncing your changes...',
        })
      } else if (status === 'slow') {
        showToast({
          title: 'Slow connection',
          description: 'Some features may be delayed',
        })
      }

      setPreviousStatus(status)
    }
  }, [status, previousStatus, showToast])
}

export default useNetworkStatus
