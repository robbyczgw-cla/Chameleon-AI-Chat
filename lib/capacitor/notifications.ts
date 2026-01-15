/**
 * Native Notifications Module
 * Uses Capacitor Local & Push Notifications
 * Provides notification management for chat events
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export interface NotificationOptions {
  id?: number
  title: string
  body: string
  largeBody?: string
  summaryText?: string
  channelId?: string
  sound?: string
  smallIcon?: string
  largeIcon?: string
  iconColor?: string
  actionTypeId?: string
  extra?: Record<string, string>
  ongoing?: boolean
  autoCancel?: boolean
  group?: string
}

export interface NotificationChannel {
  id: string
  name: string
  description?: string
  importance?: 1 | 2 | 3 | 4 | 5
  visibility?: -1 | 0 | 1
  sound?: string
  vibration?: boolean
  lights?: boolean
  lightColor?: string
}

/**
 * Default notification channels for Android
 */
const DEFAULT_CHANNELS: NotificationChannel[] = [
  {
    id: 'chat_messages',
    name: 'Chat Messages',
    description: 'Notifications for new AI responses',
    importance: 4,
    vibration: true,
    sound: 'default',
  },
  {
    id: 'background_tasks',
    name: 'Background Tasks',
    description: 'Notifications for ongoing operations',
    importance: 2,
    vibration: false,
  },
  {
    id: 'reminders',
    name: 'Reminders',
    description: 'Chat reminders and follow-ups',
    importance: 3,
    vibration: true,
  },
]

// Track initialization state
let _initialized = false
let _notificationId = 1

/**
 * Native Notifications Service
 */
export const nativeNotifications = {
  /**
   * Initialize notification channels (Android)
   */
  async initialize(): Promise<void> {
    if (_initialized) return
    if (!isNative || !Capacitor.isPluginAvailable('LocalNotifications')) return

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      // Create default channels for Android
      if (Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'chat_messages',
          name: 'Chat Messages',
          description: 'Notifications for new AI responses',
          importance: 4,
          visibility: 1,
          vibration: true,
          sound: 'default',
        })

        await LocalNotifications.createChannel({
          id: 'background_tasks',
          name: 'Background Tasks',
          description: 'Notifications for ongoing operations',
          importance: 2,
          visibility: 0,
          vibration: false,
        })
      }

      // Listen for notification actions
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        document.dispatchEvent(
          new CustomEvent('capacitor:notification-action', {
            detail: notification,
          })
        )
      })

      _initialized = true
    } catch (error) {
      console.warn('[Notifications] Init error:', error)
    }
  },

  /**
   * Check notification permissions
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!isNative) {
      if ('Notification' in window) {
        // Map 'default' to 'prompt' for web API compatibility
        const perm = Notification.permission
        return perm === 'default' ? 'prompt' : perm
      }
      return 'denied'
    }

    if (!Capacitor.isPluginAvailable('LocalNotifications')) return 'denied'

    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.checkPermissions()
    return display as 'granted' | 'denied' | 'prompt'
  },

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!isNative) {
      if ('Notification' in window) {
        const result = await Notification.requestPermission()
        // Map 'default' to 'prompt' for web API compatibility
        return result === 'default' ? 'prompt' : result
      }
      return 'denied'
    }

    if (!Capacitor.isPluginAvailable('LocalNotifications')) return 'denied'

    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.requestPermissions()
    return display as 'granted' | 'denied' | 'prompt'
  },

  /**
   * Show a local notification
   */
  async show(options: NotificationOptions): Promise<number> {
    const id = options.id ?? _notificationId++

    if (!isNative) {
      // Web notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: '/icon-192.png',
          tag: id.toString(),
        })
      }
      return id
    }

    if (!Capacitor.isPluginAvailable('LocalNotifications')) return id

    await this.initialize()

    const { LocalNotifications } = await import('@capacitor/local-notifications')

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: options.title,
          body: options.body,
          largeBody: options.largeBody,
          summaryText: options.summaryText,
          channelId: options.channelId || 'chat_messages',
          sound: options.sound,
          smallIcon: options.smallIcon || 'ic_stat_icon_config_sample',
          largeIcon: options.largeIcon,
          iconColor: options.iconColor || '#22c55e',
          ongoing: options.ongoing,
          autoCancel: options.autoCancel !== false,
          group: options.group,
          extra: options.extra,
        },
      ],
    })

    return id
  },

  /**
   * Cancel a notification
   */
  async cancel(id: number): Promise<void> {
    if (!isNative || !Capacitor.isPluginAvailable('LocalNotifications')) return

    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id }] })
  },

  /**
   * Cancel all notifications
   */
  async cancelAll(): Promise<void> {
    if (!isNative || !Capacitor.isPluginAvailable('LocalNotifications')) return

    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { notifications } = await LocalNotifications.getPending()
    if (notifications.length > 0) {
      await LocalNotifications.cancel({ notifications })
    }
  },

  // Convenience methods for specific notification types

  /**
   * Show notification for AI response
   */
  async notifyAIResponse(personaName: string, preview: string): Promise<number> {
    return this.show({
      title: `${personaName} responded`,
      body: preview.slice(0, 100) + (preview.length > 100 ? '...' : ''),
      channelId: 'chat_messages',
      group: 'chat',
    })
  },

  /**
   * Show notification for streaming completion
   */
  async notifyStreamingComplete(personaName: string): Promise<number> {
    return this.show({
      title: 'Response complete',
      body: `${personaName} finished responding`,
      channelId: 'chat_messages',
      group: 'chat',
    })
  },

  /**
   * Show ongoing notification for background task
   */
  async showBackgroundTask(title: string, body: string): Promise<number> {
    return this.show({
      title,
      body,
      channelId: 'background_tasks',
      ongoing: true,
      autoCancel: false,
    })
  },

  /**
   * Show reminder notification
   */
  async showReminder(title: string, body: string): Promise<number> {
    return this.show({
      title,
      body,
      channelId: 'reminders',
    })
  },
}
