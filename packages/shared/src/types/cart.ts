import type { Database } from './database'
import type { Product } from './product'

export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type CartItemInsert = Database['public']['Tables']['cart_items']['Insert']
export type CartItemUpdate = Database['public']['Tables']['cart_items']['Update']

export interface CartItemWithProduct extends CartItem {
  product: Product
}

export interface CartSummary {
  items: CartItemWithProduct[]
  itemCount: number
  subtotal: number
  total: number
}