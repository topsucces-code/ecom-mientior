'use client'

import { supabase } from './supabase/client'
import { 
  Order, 
  OrderItem, 
  Payment, 
  ShippingAddress,
  Cart,
  Product 
} from './supabase/types'

export interface CreateOrderData {
  user_id: string
  shipping_address_id: string
  payment_method_id: string
  items: {
    product_id: string
    quantity: number
    price: number
  }[]
  shipping_cost?: number
  tax_amount?: number
  discount_amount?: number
  notes?: string
}

export interface OrderFilters {
  user_id?: string
  vendor_id?: string
  status?: string
  date_from?: string
  date_to?: string
}

export class OrderService {

  // ========== ORDER MANAGEMENT ==========

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const shipping_cost = orderData.shipping_cost || 0
      const tax_amount = orderData.tax_amount || subtotal * 0.08 // 8% tax
      const discount_amount = orderData.discount_amount || 0
      const total_amount = subtotal + shipping_cost + tax_amount - discount_amount

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.user_id,
          order_number: `ORD-${Date.now()}`,
          status: 'pending',
          subtotal,
          shipping_cost,
          tax_amount,
          discount_amount,
          total_amount,
          currency: 'USD',
          shipping_address_id: orderData.shipping_address_id,
          payment_method_id: orderData.payment_method_id,
          notes: orderData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          shipping_address:shipping_addresses(*),
          payment_method:payment_methods(*),
          items:order_items(*)
        `)
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw new Error('Failed to create order')
      }

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Rollback order creation
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error('Failed to create order items')
      }

      // Update inventory quantities
      for (const item of orderData.items) {
        await this.reserveInventory(item.product_id, item.quantity)
      }

      // Get complete order with items
      return await this.getOrderById(order.id) as Order
    } catch (error) {
      console.error('Error in createOrder:', error)
      throw error
    }
  }

  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          shipping_address:shipping_addresses(*),
          payment_method:payment_methods(*),
          items:order_items(
            *,
            product:products(id, name, sku, images:product_images(*))
          ),
          payments:payments(*)
        `)

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching orders:', error)
        throw new Error('Failed to fetch orders')
      }

      return data || []
    } catch (error) {
      console.error('Error in getOrders:', error)
      throw error
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          shipping_address:shipping_addresses(*),
          payment_method:payment_methods(*),
          items:order_items(
            *,
            product:products(id, name, sku, price, images:product_images(*))
          ),
          payments:payments(*)
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.error('Error fetching order:', error)
        throw new Error('Failed to fetch order')
      }

      return data
    } catch (error) {
      console.error('Error in getOrderById:', error)
      throw error
    }
  }

  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(notes ? { notes } : {}),
          ...(status === 'shipped' ? { shipped_at: new Date().toISOString() } : {}),
          ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
          ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {})
        })
        .eq('id', orderId)
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*)),
          items:order_items(
            *,
            product:products(id, name, sku)
          )
        `)
        .single()

      if (error) {
        console.error('Error updating order status:', error)
        throw new Error('Failed to update order status')
      }

      // If cancelled, release reserved inventory
      if (status === 'cancelled' && data.items) {
        for (const item of data.items) {
          await this.releaseInventory(item.product_id, item.quantity)
        }
      }

      return data
    } catch (error) {
      console.error('Error in updateOrderStatus:', error)
      throw error
    }
  }

  async addTrackingNumber(orderId: string, trackingNumber: string, carrier?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          shipping_carrier: carrier,
          status: 'shipped',
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error adding tracking number:', error)
        throw new Error('Failed to add tracking number')
      }
    } catch (error) {
      console.error('Error in addTrackingNumber:', error)
      throw error
    }
  }

  // ========== INVENTORY MANAGEMENT ==========

  private async reserveInventory(productId: string, quantity: number): Promise<void> {
    try {
      const { data: inventoryItems, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .limit(1)

      if (error || !inventoryItems || inventoryItems.length === 0) {
        console.error('Inventory item not found for product:', productId)
        return
      }

      const item = inventoryItems[0]
      const newReserved = item.quantity_reserved + quantity
      const newAvailable = Math.max(0, item.quantity_available - quantity)

      await supabase
        .from('inventory_items')
        .update({
          quantity_reserved: newReserved,
          quantity_available: newAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
    } catch (error) {
      console.error('Error reserving inventory:', error)
    }
  }

  private async releaseInventory(productId: string, quantity: number): Promise<void> {
    try {
      const { data: inventoryItems, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .limit(1)

      if (error || !inventoryItems || inventoryItems.length === 0) {
        console.error('Inventory item not found for product:', productId)
        return
      }

      const item = inventoryItems[0]
      const newReserved = Math.max(0, item.quantity_reserved - quantity)
      const newAvailable = item.quantity_available + quantity

      await supabase
        .from('inventory_items')
        .update({
          quantity_reserved: newReserved,
          quantity_available: newAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
    } catch (error) {
      console.error('Error releasing inventory:', error)
    }
  }

  // ========== CART MANAGEMENT ==========

  async getCart(userId: string): Promise<Cart | null> {
    try {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          *,
          items:cart_items(
            *,
            product:products(
              id, name, sku, price, stock_quantity,
              images:product_images(*),
              vendor:vendors(business_name)
            )
          )
        `)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.error('Error fetching cart:', error)
        throw new Error('Failed to fetch cart')
      }

      return data
    } catch (error) {
      console.error('Error in getCart:', error)
      throw error
    }
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<Cart> {
    try {
      // Get or create cart
      let cart = await this.getCart(userId)
      
      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from('carts')
          .insert({
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (cartError) {
          console.error('Error creating cart:', cartError)
          throw new Error('Failed to create cart')
        }

        cart = newCart as Cart
      }

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id)
        .eq('product_id', productId)
        .single()

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
      } else {
        // Add new item
        await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: productId,
            quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      // Update cart timestamp
      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cart.id)

      return await this.getCart(userId) as Cart
    } catch (error) {
      console.error('Error in addToCart:', error)
      throw error
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    try {
      const cart = await this.getCart(userId)
      if (!cart) {
        throw new Error('Cart not found')
      }

      if (quantity <= 0) {
        // Remove item
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id)
          .eq('product_id', productId)
      } else {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({
            quantity,
            updated_at: new Date().toISOString()
          })
          .eq('cart_id', cart.id)
          .eq('product_id', productId)
      }

      // Update cart timestamp
      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cart.id)

      return await this.getCart(userId) as Cart
    } catch (error) {
      console.error('Error in updateCartItem:', error)
      throw error
    }
  }

  async clearCart(userId: string): Promise<void> {
    try {
      const cart = await this.getCart(userId)
      if (!cart) return

      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id)

      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cart.id)
    } catch (error) {
      console.error('Error in clearCart:', error)
      throw error
    }
  }

  // ========== ORDER ANALYTICS ==========

  async getOrderAnalytics(dateFrom: string, dateTo: string): Promise<any> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_order_analytics', {
        date_from: dateFrom,
        date_to: dateTo
      })

      if (error) {
        console.error('Error fetching order analytics:', error)
        throw new Error('Failed to fetch order analytics')
      }

      return analytics
    } catch (error) {
      console.error('Error in getOrderAnalytics:', error)
      throw error
    }
  }

  async getTopSellingProducts(limit = 10): Promise<any[]> {
    try {
      const { data: products, error } = await supabase.rpc('get_top_selling_products', {
        limit_count: limit
      })

      if (error) {
        console.error('Error fetching top selling products:', error)
        throw new Error('Failed to fetch top selling products')
      }

      return products || []
    } catch (error) {
      console.error('Error in getTopSellingProducts:', error)
      throw error
    }
  }
}

export const orderService = new OrderService()