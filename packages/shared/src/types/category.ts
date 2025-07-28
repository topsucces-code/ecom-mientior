import type { Database } from './database'

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
  level: number
}