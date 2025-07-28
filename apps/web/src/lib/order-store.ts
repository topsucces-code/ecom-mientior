import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@ecommerce/shared'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Order {
  id: string
  orderNumber: string
  userId?: string
  status: OrderStatus
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  createdAt: string
  updatedAt: string
  estimatedDelivery: string
  trackingNumber?: string
  notes?: string
}

interface OrderStore {
  orders: Order[]
  currentOrder: Order | null
  loading: boolean
  
  // Actions
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<Order>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  getOrder: (orderId: string) => Order | undefined
  getUserOrders: (userId?: string) => Order[]
  setCurrentOrder: (order: Order | null) => void
  
  // Tracking
  addTrackingNumber: (orderId: string, trackingNumber: string) => Promise<void>
  
  // Database operations
  loadOrdersFromDatabase: () => Promise<void>
  syncOrderWithDatabase: (order: Order) => Promise<void>
  
  // Filtering and sorting
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getRecentOrders: (limit: number) => Order[]
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  
  createOrder: async (orderData) => {
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`
    const now = new Date().toISOString()
    
    const order: Order = {
      ...orderData,
      id: crypto.randomUUID(),
      orderNumber,
      createdAt: now,
      updatedAt: now
    }
    
    set(state => ({
      orders: [order, ...state.orders],
      currentOrder: order
    }))
    
    // Sync with database
    await get().syncOrderWithDatabase(order)
    
    return order
  },
  
  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const updatedAt = new Date().toISOString()
    
    set(state => ({
      orders: state.orders.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt }
          : order
      ),
      currentOrder: state.currentOrder?.id === orderId
        ? { ...state.currentOrder, status, updatedAt }
        : state.currentOrder
    }))
    
    const order = get().orders.find(o => o.id === orderId)
    if (order) {
      await get().syncOrderWithDatabase(order)
    }
  },
  
  getOrder: (orderId: string) => {
    return get().orders.find(order => order.id === orderId)
  },
  
  getUserOrders: (userId?: string) => {
    if (!userId) return []
    return get().orders.filter(order => order.userId === userId)
  },
  
  setCurrentOrder: (order: Order | null) => {
    set({ currentOrder: order })
  },
  
  addTrackingNumber: async (orderId: string, trackingNumber: string) => {
    const updatedAt = new Date().toISOString()
    
    set(state => ({
      orders: state.orders.map(order =>
        order.id === orderId
          ? { ...order, trackingNumber, updatedAt }
          : order
      ),
      currentOrder: state.currentOrder?.id === orderId
        ? { ...state.currentOrder, trackingNumber, updatedAt }
        : state.currentOrder
    }))
    
    const order = get().orders.find(o => o.id === orderId)
    if (order) {
      await get().syncOrderWithDatabase(order)
    }
  },
  
  loadOrdersFromDatabase: async () => {
    try {
      set({ loading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (orders) {
        const formattedOrders: Order[] = orders.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          userId: order.user_id,
          status: order.status,
          items: order.items,
          shippingAddress: order.shipping_address,
          paymentMethod: order.payment_method,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          estimatedDelivery: order.estimated_delivery,
          trackingNumber: order.tracking_number,
          notes: order.notes
        }))
        
        set({ orders: formattedOrders })
      }
    } catch (error) {
      console.error('Failed to load orders from database:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  syncOrderWithDatabase: async (order: Order) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const orderData = {
        id: order.id,
        order_number: order.orderNumber,
        user_id: user.id,
        status: order.status,
        items: order.items,
        shipping_address: order.shippingAddress,
        payment_method: order.paymentMethod,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        estimated_delivery: order.estimatedDelivery,
        tracking_number: order.trackingNumber,
        notes: order.notes
      }
      
      const { error } = await supabase
        .from('orders')
        .upsert(orderData)
      
      if (error) throw error
    } catch (error) {
      console.error('Failed to sync order with database:', error)
    }
  },
  
  getOrdersByStatus: (status: OrderStatus) => {
    return get().orders.filter(order => order.status === status)
  },
  
  getRecentOrders: (limit: number) => {
    return get().orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }
}))

// Selectors for commonly used data
export const useUserOrders = (userId?: string) => useOrderStore(state => state.getUserOrders(userId))
export const useOrdersByStatus = (status: OrderStatus) => useOrderStore(state => state.getOrdersByStatus(status))
export const useRecentOrders = (limit: number = 10) => useOrderStore(state => state.getRecentOrders(limit))