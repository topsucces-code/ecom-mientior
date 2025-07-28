// Service worker registration utility
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update prompt
              if (confirm('New version available! Click OK to update.')) {
                window.location.reload()
              }
            }
          })
        }
      })
      
      console.log('Service Worker registered successfully:', registration)
    } catch (error) {
      console.log('Service Worker registration failed:', error)
    }
  }
}

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.unregister()
        console.log('Service Worker unregistered successfully')
      }
    } catch (error) {
      console.log('Service Worker unregistration failed:', error)
    }
  }
}

// Check if the app is running offline
export const isOnline = (): boolean => {
  return navigator.onLine
}

// Listen for online/offline events
export const addNetworkListener = (callback: (isOnline: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}