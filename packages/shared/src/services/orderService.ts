import { supabase } from '../lib/supabase'

export interface Order {
  id: string
  customer_id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  total_amount: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  shipping_address: any
  billing_address: any
  tracking_number?: string
  notes?: string
  metadata?: any
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  profiles?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  vendor_id?: string
  quantity: number
  unit_price: number
  total_price: number
  product_snapshot: any
  created_at: string
  products?: {
    id: string
    name: string
    images: string[]
    sku: string
  }
  vendors?: {
    id: string
    business_name: string
  }
}

export interface CreateOrderData {
  customer_id: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
  }[]
  shipping_address: any
  billing_address: any
  payment_method?: string
  notes?: string
  discount_amount?: number
}

export interface OrderSummary {
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
}

export class OrderService {
  // Créer une nouvelle commande
  static async createOrder(orderData: CreateOrderData) {
    try {
      // Calculer les montants
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity),
        0
      )

      const tax_amount = subtotal * 0.20 // 20% de taxe
      const shipping_amount = subtotal >= 100 ? 0 : 5 // Livraison gratuite au-dessus de 100€
      const discount_amount = orderData.discount_amount || 0
      const total_amount = subtotal + tax_amount + shipping_amount - discount_amount

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: orderData.customer_id,
          total_amount,
          tax_amount,
          shipping_amount,
          discount_amount,
          shipping_address: orderData.shipping_address,
          billing_address: orderData.billing_address,
          payment_method: orderData.payment_method,
          notes: orderData.notes,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Créer les éléments de commande
      const orderItems = await Promise.all(
        orderData.items.map(async (item) => {
          // Récupérer les détails du produit pour le snapshot
          const { data: product } = await supabase
            .from('products')
            .select('*, vendors(*)')
            .eq('id', item.product_id)
            .single()

          return {
            order_id: order.id,
            product_id: item.product_id,
            vendor_id: product?.vendor_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
            product_snapshot: product // Sauvegarder l'état du produit au moment de la commande
          }
        })
      )

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()

      if (itemsError) throw itemsError

      // Vider le panier après la création de la commande
      await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', orderData.customer_id)

      return {
        data: {
          ...order,
          order_items: createdItems
        } as Order,
        error: null
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obtenir les commandes d'un utilisateur
  static async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images,
              sku
            ),
            vendors (
              id,
              business_name
            )
          )
        `, { count: 'exact' })
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        data: data as Order[],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
        error: null
      }
    } catch (error) {
      return {
        data: [],
        count: 0,
        page,
        totalPages: 0,
        error: error as Error
      }
    }
  }

  // Obtenir une commande par ID
  static async getOrderById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images,
              sku
            ),
            vendors (
              id,
              business_name
            )
          ),
          profiles (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error

      return { data: data as Order, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Mettre à jour le statut d'une commande
  static async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    trackingNumber?: string
  ) {
    try {
      const updates: any = { status }
      if (trackingNumber) {
        updates.tracking_number = trackingNumber
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      return { data: data as Order, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Mettre à jour le statut de paiement
  static async updatePaymentStatus(
    orderId: string,
    paymentStatus: Order['payment_status'],
    paymentMethod?: string
  ) {
    try {
      const updates: any = { payment_status: paymentStatus }
      if (paymentMethod) {
        updates.payment_method = paymentMethod
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      return { data: data as Order, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Annuler une commande
  static async cancelOrder(orderId: string, reason?: string) {
    try {
      const updates: any = { 
        status: 'cancelled' as const,
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer'
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      return { data: data as Order, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Obtenir toutes les commandes (pour les administrateurs)
  static async getAllOrders(
    page: number = 1,
    limit: number = 20,
    status?: Order['status']
  ) {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images,
              sku
            ),
            vendors (
              id,
              business_name
            )
          ),
          profiles (
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        data: data as Order[],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
        error: null
      }
    } catch (error) {
      return {
        data: [],
        count: 0,
        page,
        totalPages: 0,
        error: error as Error
      }
    }
  }

  // Obtenir les commandes d'un vendeur
  static async getVendorOrders(vendorId: string, page: number = 1, limit: number = 20) {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!inner (
            *,
            products (
              id,
              name,
              images,
              sku
            )
          ),
          profiles (
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .eq('order_items.vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        data: data as Order[],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
        error: null
      }
    } catch (error) {
      return {
        data: [],
        count: 0,
        page,
        totalPages: 0,
        error: error as Error
      }
    }
  }

  // Calculer le résumé d'une commande avant création
  static calculateOrderSummary(
    items: { unit_price: number; quantity: number }[],
    discountAmount: number = 0
  ): OrderSummary {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unit_price * item.quantity),
      0
    )

    const tax_amount = subtotal * 0.20 // 20% de taxe
    const shipping_amount = subtotal >= 100 ? 0 : 5 // Livraison gratuite au-dessus de 100€
    const total_amount = subtotal + tax_amount + shipping_amount - discountAmount

    return {
      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount: discountAmount,
      total_amount
    }
  }

  // Rechercher des commandes
  static async searchOrders(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images,
              sku
            ),
            vendors (
              id,
              business_name
            )
          ),
          profiles (
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .or(`
          id.ilike.%${searchTerm}%,
          tracking_number.ilike.%${searchTerm}%,
          profiles.email.ilike.%${searchTerm}%,
          profiles.first_name.ilike.%${searchTerm}%,
          profiles.last_name.ilike.%${searchTerm}%
        `)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        data: data as Order[],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
        error: null
      }
    } catch (error) {
      return {
        data: [],
        count: 0,
        page,
        totalPages: 0,
        error: error as Error
      }
    }
  }

  // Obtenir les statistiques des commandes
  static async getOrderStats(userId?: string) {
    try {
      let baseQuery = supabase.from('orders').select('status, total_amount, created_at')
      
      if (userId) {
        baseQuery = baseQuery.eq('customer_id', userId)
      }

      const { data, error } = await baseQuery

      if (error) throw error

      const stats = {
        total_orders: data.length,
        pending_orders: data.filter(o => o.status === 'pending').length,
        processing_orders: data.filter(o => o.status === 'processing').length,
        shipped_orders: data.filter(o => o.status === 'shipped').length,
        delivered_orders: data.filter(o => o.status === 'delivered').length,
        cancelled_orders: data.filter(o => o.status === 'cancelled').length,
        total_revenue: data.reduce((sum, order) => sum + order.total_amount, 0),
        average_order_value: data.length > 0 
          ? data.reduce((sum, order) => sum + order.total_amount, 0) / data.length 
          : 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

export default OrderService