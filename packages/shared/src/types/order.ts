import type { Database } from './database'
import type { Product } from './product'
import type { Address } from './user'

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export interface OrderItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  sku: string
  image?: string
}

export interface OrderWithDetails extends Omit<Order, 'order_items' | 'shipping_address' | 'billing_address'> {
  order_items: OrderItem[]
  shipping_address: Address
  billing_address: Address
}

export interface OrderFilters {
  status?: Order['status']
  payment_status?: Order['payment_status']
  dateFrom?: string
  dateTo?: string
  userId?: string
}

export interface OrderSummary {
  subtotal: number
  taxAmount: number
  shippingAmount: number
  discountAmount: number
  total: number
}