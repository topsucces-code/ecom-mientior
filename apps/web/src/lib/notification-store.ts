import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@ecommerce/shared'
import type { Notification, NotificationInsert, NotificationUpdate } from '@ecommerce/shared'

export interface NotificationAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export interface NotificationTemplate {
  id: string
  name: string
  type: Notification['type']
  title: string
  message: string
  category: Notification['category']
  priority: Notification['priority']
  autoHide: boolean
  duration?: number
}

interface NotificationStore {
  // State
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  settings: {
    enabled: boolean
    sound: boolean
    desktop: boolean
    email: boolean
    categories: Record<Notification['category'], boolean>
  }
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  clearByCategory: (category: Notification['category']) => void
  togglePanel: () => void
  closePanel: () => void
  
  // Settings
  updateSettings: (settings: Partial<NotificationStore['settings']>) => void
  
  // Quick notification methods
  showSuccess: (title: string, message: string, actions?: NotificationAction[]) => string
  showError: (title: string, message: string, actions?: NotificationAction[]) => string
  showWarning: (title: string, message: string, actions?: NotificationAction[]) => string
  showInfo: (title: string, message: string, actions?: NotificationAction[]) => string
  
  // E-commerce specific notifications
  notifyOrderUpdate: (orderId: string, status: string, message: string) => string
  notifyPromotion: (title: string, message: string, promoCode?: string) => string
  notifyStockAlert: (productName: string, currentStock: number) => string
  notifyPaymentUpdate: (orderId: string, status: string) => string
  
  // Browser notifications
  requestPermission: () => Promise<boolean>
  showBrowserNotification: (notification: Notification) => void
}

// Predefined notification templates
const templates: NotificationTemplate[] = [
  {
    id: 'order_confirmed',
    name: 'Order Confirmed',
    type: 'success',
    title: 'Order Confirmed!',
    message: 'Your order has been confirmed and is being processed.',
    category: 'order',
    priority: 'high',
    autoHide: false
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    type: 'info',
    title: 'Order Shipped',
    message: 'Your order is on its way! Track your package with the provided tracking number.',
    category: 'order',
    priority: 'medium',
    autoHide: false
  },
  {
    id: 'payment_failed',
    name: 'Payment Failed',
    type: 'error',
    title: 'Payment Failed',
    message: 'There was an issue processing your payment. Please try again.',
    category: 'order',
    priority: 'high',
    autoHide: false
  },
  {
    id: 'low_stock',
    name: 'Low Stock Alert',
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Some items in your cart are running low on stock.',
    category: 'system',
    priority: 'medium',
    autoHide: true,
    duration: 8000
  },
  {
    id: 'promotion_available',
    name: 'Promotion Available',
    type: 'promotion',
    title: 'Special Offer!',
    message: 'Don\'t miss out on this limited-time promotion.',
    category: 'promotion',
    priority: 'low',
    autoHide: true,
    duration: 10000
  }
]

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isOpen: false,
      settings: {
        enabled: true,
        sound: true,
        desktop: false,
        email: true,
        categories: {
          system: true,
          order: true,
          promotion: true,
          account: true,
          security: true
        }
      },

      // Core notification management
      addNotification: (notificationData) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const notification: Notification = {
          ...notificationData,
          id,
          timestamp: new Date().toISOString(),
          read: false
        }

        const { settings } = get()
        
        // Check if notifications are enabled for this category
        if (!settings.enabled || !settings.categories[notification.category]) {
          return id
        }

        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }))

        // Show browser notification if enabled
        if (settings.desktop) {
          get().showBrowserNotification(notification)
        }

        // Play sound if enabled
        if (settings.sound && notification.priority === 'high') {
          try {
            const audio = new Audio('/notification-sound.mp3')
            audio.volume = 0.3
            audio.play().catch(() => {
              // Ignore audio errors (user might not have interacted with page yet)
            })
          } catch (error) {
            // Audio not supported or failed
          }
        }

        // Auto-hide notification
        if (notification.autoHide) {
          const duration = notification.duration || 5000
          setTimeout(() => {
            get().removeNotification(id)
          }, duration)
        }

        return id
      },

      removeNotification: (id) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          const wasUnread = notification && !notification.read
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
          }
        })
      },

      markAsRead: (id) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          const wasUnread = notification && !notification.read
          
          return {
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
          }
        })
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }))
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0
        })
      },

      clearByCategory: (category) => {
        set(state => {
          const removedUnreadCount = state.notifications
            .filter(n => n.category === category && !n.read)
            .length
          
          return {
            notifications: state.notifications.filter(n => n.category !== category),
            unreadCount: state.unreadCount - removedUnreadCount
          }
        })
      },

      togglePanel: () => {
        set(state => ({ isOpen: !state.isOpen }))
      },

      closePanel: () => {
        set({ isOpen: false })
      },

      // Settings management
      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      // Quick notification methods
      showSuccess: (title, message, actions) => {
        return get().addNotification({
          type: 'success',
          title,
          message,
          actions,
          category: 'system',
          priority: 'medium',
          autoHide: true,
          duration: 4000
        })
      },

      showError: (title, message, actions) => {
        return get().addNotification({
          type: 'error',
          title,
          message,
          actions,
          category: 'system',
          priority: 'high',
          autoHide: false
        })
      },

      showWarning: (title, message, actions) => {
        return get().addNotification({
          type: 'warning',
          title,
          message,
          actions,
          category: 'system',
          priority: 'medium',
          autoHide: true,
          duration: 6000
        })
      },

      showInfo: (title, message, actions) => {
        return get().addNotification({
          type: 'info',
          title,
          message,
          actions,
          category: 'system',
          priority: 'low',
          autoHide: true,
          duration: 5000
        })
      },

      // E-commerce specific notifications
      notifyOrderUpdate: (orderId, status, message) => {
        const statusConfig = {
          confirmed: { type: 'success' as const, priority: 'high' as const },
          processing: { type: 'info' as const, priority: 'medium' as const },
          shipped: { type: 'info' as const, priority: 'medium' as const },
          delivered: { type: 'success' as const, priority: 'high' as const },
          cancelled: { type: 'warning' as const, priority: 'high' as const },
          refunded: { type: 'info' as const, priority: 'medium' as const }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || 
                      { type: 'info' as const, priority: 'medium' as const }

        return get().addNotification({
          type: config.type,
          title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message,
          category: 'order',
          priority: config.priority,
          autoHide: false,
          actions: [{
            label: 'View Order',
            action: () => {
              window.location.href = `/orders/${orderId}`
            },
            variant: 'primary'
          }],
          metadata: { orderId, status }
        })
      },

      notifyPromotion: (title, message, promoCode) => {
        const actions: NotificationAction[] = []
        
        if (promoCode) {
          actions.push({
            label: 'Copy Code',
            action: () => {
              navigator.clipboard.writeText(promoCode)
              get().showSuccess('Copied!', 'Promo code copied to clipboard')
            },
            variant: 'primary'
          })
        }

        return get().addNotification({
          type: 'promotion',
          title,
          message,
          actions,
          category: 'promotion',
          priority: 'low',
          autoHide: true,
          duration: 10000,
          metadata: { promoCode }
        })
      },

      notifyStockAlert: (productName, currentStock) => {
        return get().addNotification({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${productName} is running low (${currentStock} left). Order soon!`,
          category: 'system',
          priority: 'medium',
          autoHide: true,
          duration: 8000,
          metadata: { productName, currentStock }
        })
      },

      notifyPaymentUpdate: (orderId, status) => {
        const statusMessages = {
          processing: 'Your payment is being processed.',
          completed: 'Payment completed successfully!',
          failed: 'Payment failed. Please try again or use a different payment method.',
          refunded: 'Your payment has been refunded.',
          cancelled: 'Payment was cancelled.'
        }

        const statusTypes = {
          processing: 'info' as const,
          completed: 'success' as const,
          failed: 'error' as const,
          refunded: 'info' as const,
          cancelled: 'warning' as const
        }

        const message = statusMessages[status as keyof typeof statusMessages] || 
                        'Payment status updated.'
        const type = statusTypes[status as keyof typeof statusTypes] || 'info'

        return get().addNotification({
          type,
          title: 'Payment Update',
          message,
          category: 'order',
          priority: status === 'failed' ? 'high' : 'medium',
          autoHide: status === 'completed',
          duration: status === 'completed' ? 4000 : undefined,
          actions: status === 'failed' ? [{
            label: 'Retry Payment',
            action: () => {
              window.location.href = `/orders/${orderId}/payment`
            },
            variant: 'primary'
          }] : undefined,
          metadata: { orderId, status }
        })
      },

      // Browser notifications
      requestPermission: async () => {
        if (!('Notification' in window)) {
          return false
        }

        if (Notification.permission === 'granted') {
          return true
        }

        if (Notification.permission === 'denied') {
          return false
        }

        const permission = await Notification.requestPermission()
        return permission === 'granted'
      },

      showBrowserNotification: (notification) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
          return
        }

        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/notification-badge.png',
          tag: notification.id,
          requireInteraction: notification.priority === 'high',
          silent: false
        })

        browserNotification.onclick = () => {
          window.focus()
          get().markAsRead(notification.id)
          browserNotification.close()

          // Navigate to relevant page based on notification type
          if (notification.category === 'order' && notification.metadata?.orderId) {
            window.location.href = `/orders/${notification.metadata.orderId}`
          }
        }

        // Auto-close after duration
        if (notification.autoHide && notification.duration) {
          setTimeout(() => {
            browserNotification.close()
          }, notification.duration)
        }
      }
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Keep only recent notifications
        settings: state.settings
      })
    }
  )
)

// Auto-cleanup old notifications (keep only last 100)
setInterval(() => {
  const store = useNotificationStore.getState()
  if (store.notifications.length > 100) {
    const oldNotifications = store.notifications.slice(100)
    const unreadToRemove = oldNotifications.filter(n => !n.read).length
    
    useNotificationStore.setState({
      notifications: store.notifications.slice(0, 100),
      unreadCount: Math.max(0, store.unreadCount - unreadToRemove)
    })
  }
}, 60000) // Run every minute