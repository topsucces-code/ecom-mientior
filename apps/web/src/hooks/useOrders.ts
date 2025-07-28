'use client'

import { useState, useEffect, useCallback } from 'react'
import { OrderService, Order, CreateOrderData, OrderSummary } from '@ecommerce/shared/src/services/orderService'
import { useAuth } from './useAuth'

interface UseOrdersResult {
  orders: Order[]
  loading: boolean
  error: Error | null
  totalPages: number
  currentPage: number
  totalCount: number
  fetchOrders: (page?: number) => Promise<void>
  refetch: () => Promise<void>
}

export function useOrders(initialPage: number = 1, limit: number = 10): UseOrdersResult {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalCount, setTotalCount] = useState(0)

  const fetchOrders = useCallback(async (page: number = currentPage) => {
    if (!user?.id) {
      setOrders([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await OrderService.getUserOrders(user.id, page, limit)

      if (result.error) {
        setError(result.error)
        return
      }

      setOrders(result.data)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setTotalCount(result.count)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentPage, limit])

  const refetch = useCallback(() => {
    return fetchOrders(currentPage)
  }, [fetchOrders, currentPage])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    totalPages,
    currentPage,
    totalCount,
    fetchOrders,
    refetch
  }
}

interface UseOrderResult {
  order: Order | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateStatus: (status: Order['status'], trackingNumber?: string) => Promise<void>
  cancelOrder: (reason?: string) => Promise<void>
}

export function useOrder(orderId: string | null): UseOrderResult {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await OrderService.getOrderById(orderId)

      if (result.error) {
        setError(result.error)
        return
      }

      setOrder(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  const updateStatus = useCallback(async (
    status: Order['status'],
    trackingNumber?: string
  ) => {
    if (!orderId) {
      throw new Error('No order ID provided')
    }

    try {
      setError(null)
      const result = await OrderService.updateOrderStatus(orderId, status, trackingNumber)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      setOrder(result.data)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [orderId])

  const cancelOrder = useCallback(async (reason?: string) => {
    if (!orderId) {
      throw new Error('No order ID provided')
    }

    try {
      setError(null)
      const result = await OrderService.cancelOrder(orderId, reason)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      setOrder(result.data)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [orderId])

  const refetch = useCallback(() => {
    return fetchOrder()
  }, [fetchOrder])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  return {
    order,
    loading,
    error,
    refetch,
    updateStatus,
    cancelOrder
  }
}

interface UseCreateOrderResult {
  createOrder: (orderData: CreateOrderData) => Promise<Order>
  loading: boolean
  error: Error | null
}

export function useCreateOrder(): UseCreateOrderResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createOrder = useCallback(async (orderData: CreateOrderData): Promise<Order> => {
    try {
      setLoading(true)
      setError(null)

      const result = await OrderService.createOrder(orderData)

      if (result.error) {
        setError(result.error)
        throw result.error
      }

      return result.data!
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createOrder,
    loading,
    error
  }
}

interface UseOrderStatsResult {
  stats: any | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useOrderStats(): UseOrderStatsResult {
  const { user } = useAuth()
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setStats(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await OrderService.getOrderStats(user.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setStats(result.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const refetch = useCallback(() => {
    return fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch
  }
}

interface UseAllOrdersResult {
  orders: Order[]
  loading: boolean
  error: Error | null
  totalPages: number
  currentPage: number
  totalCount: number
  fetchOrders: (page?: number, status?: Order['status']) => Promise<void>
  searchOrders: (searchTerm: string, page?: number) => Promise<void>
  refetch: () => Promise<void>
}

export function useAllOrders(initialPage: number = 1, limit: number = 20): UseAllOrdersResult {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalCount, setTotalCount] = useState(0)

  const fetchOrders = useCallback(async (
    page: number = currentPage,
    status?: Order['status']
  ) => {
    try {
      setLoading(true)
      setError(null)

      const result = await OrderService.getAllOrders(page, limit, status)

      if (result.error) {
        setError(result.error)
        return
      }

      setOrders(result.data)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setTotalCount(result.count)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, limit])

  const searchOrders = useCallback(async (
    searchTerm: string,
    page: number = 1
  ) => {
    try {
      setLoading(true)
      setError(null)

      const result = await OrderService.searchOrders(searchTerm, page, limit)

      if (result.error) {
        setError(result.error)
        return
      }

      setOrders(result.data)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
      setTotalCount(result.count)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [limit])

  const refetch = useCallback(() => {
    return fetchOrders(currentPage)
  }, [fetchOrders, currentPage])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    totalPages,
    currentPage,
    totalCount,
    fetchOrders,
    searchOrders,
    refetch
  }
}

export function useOrderSummary(
  items: { unit_price: number; quantity: number }[],
  discountAmount: number = 0
): OrderSummary {
  return OrderService.calculateOrderSummary(items, discountAmount)
}