// Performance monitoring utilities
import React from 'react'

interface PerformanceMetrics {
  name: string
  duration: number
  startTime: number
  endTime: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private timers: Map<string, number> = new Map()

  // Start timing an operation
  start(name: string): void {
    const startTime = performance.now()
    this.timers.set(name, startTime)
  }

  // End timing an operation
  end(name: string): PerformanceMetrics | null {
    const endTime = performance.now()
    const startTime = this.timers.get(name)

    if (!startTime) {
      console.warn(`Performance timer "${name}" was not started`)
      return null
    }

    const duration = endTime - startTime
    const metric: PerformanceMetrics = {
      name,
      duration,
      startTime,
      endTime
    }

    this.metrics.set(name, metric)
    this.timers.delete(name)

    // Log slow operations (> 100ms)
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }

    return metric
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  // Get specific metric
  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name)
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear()
    this.timers.clear()
  }

  // Get Web Vitals
  getWebVitals(): void {
    if ('web-vitals' in window) {
      // This would require installing web-vitals package
      // For now, we'll use Performance Observer
      this.observeWebVitals()
    }
  }

  private observeWebVitals(): void {
    // Observe Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              console.log('LCP:', entry.startTime)
            }
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // Observe First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input' && 'processingStart' in entry) {
              const fid = (entry as any).processingStart - entry.startTime
              console.log('FID:', fid)
            }
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Observe Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          console.log('CLS:', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    startTimer: (name: string) => performanceMonitor.start(name),
    endTimer: (name: string) => performanceMonitor.end(name),
    getMetrics: () => performanceMonitor.getMetrics(),
    clearMetrics: () => performanceMonitor.clear()
  }
}

// HOC for measuring component render time
export function withPerformanceMonitoring<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: T) {
    performanceMonitor.start(`${componentName}-render`)
    
    React.useEffect(() => {
      performanceMonitor.end(`${componentName}-render`)
    })

    return React.createElement(Component, props)
  }
}

// Measure function execution time
export function measureAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) {
  return async (...args: T): Promise<R> => {
    performanceMonitor.start(name)
    try {
      const result = await fn(...args)
      performanceMonitor.end(name)
      return result
    } catch (error) {
      performanceMonitor.end(name)
      throw error
    }
  }
}

export function measureSync<T extends any[], R>(
  fn: (...args: T) => R,
  name: string
) {
  return (...args: T): R => {
    performanceMonitor.start(name)
    try {
      const result = fn(...args)
      performanceMonitor.end(name)
      return result
    } catch (error) {
      performanceMonitor.end(name)
      throw error
    }
  }
}

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis would go here - use webpack-bundle-analyzer in build process')
  }
}

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory
    console.log('Memory Usage:', {
      used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + ' MB',
      limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + ' MB'
    })
  }
}