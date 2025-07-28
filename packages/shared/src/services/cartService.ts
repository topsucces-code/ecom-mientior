import { supabase } from '../lib/supabase'

export interface CartItem {
  id: string
  customer_id: string
  product_id: string
  quantity: number
  added_at: string
  updated_at: string
  products?: {
    id: string
    name: string
    price: number
    images: string[]
    status: string
    sku: string
    vendors?: {
      id: string
      business_name: string
    }
  }
}

export interface CartSummary {
  items: CartItem[]
  subtotal: number
  totalItems: number
  totalQuantity: number
}

export class CartService {
  // Obtenir le panier d'un utilisateur
  static async getCart(userId: string): Promise<{ data: CartSummary | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            images,
            status,
            sku,
            vendors (
              id,
              business_name
            )
          )
        `)
        .eq('customer_id', userId)
        .order('added_at', { ascending: false })

      if (error) throw error

      const cartItems = data as CartItem[]
      
      // Calculer le résumé du panier
      const subtotal = cartItems.reduce((total, item) => {
        const price = item.products?.price || 0
        return total + (price * item.quantity)
      }, 0)

      const totalItems = cartItems.length
      const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0)

      const cartSummary: CartSummary = {
        items: cartItems,
        subtotal,
        totalItems,
        totalQuantity
      }

      return { data: cartSummary, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Ajouter un article au panier
  static async addToCart(userId: string, productId: string, quantity: number = 1) {
    try {
      // Vérifier si l'article existe déjà dans le panier
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('customer_id', userId)
        .eq('product_id', productId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      let result
      if (existingItem) {
        // Mettre à jour la quantité si l'article existe déjà
        const { data, error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Ajouter un nouvel article
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            customer_id: userId,
            product_id: productId,
            quantity
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Mettre à jour la quantité d'un article
  static async updateCartItemQuantity(cartItemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        // Supprimer l'article si la quantité est 0 ou négative
        return this.removeFromCart(cartItemId)
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Supprimer un article du panier
  static async removeFromCart(cartItemId: string) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Vider complètement le panier
  static async clearCart(userId: string) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', userId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Obtenir le nombre total d'articles dans le panier
  static async getCartCount(userId: string) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('customer_id', userId)

      if (error) throw error

      const totalQuantity = data?.reduce((total, item) => total + item.quantity, 0) || 0

      return { data: totalQuantity, error: null }
    } catch (error) {
      return { data: 0, error: error as Error }
    }
  }

  // Vérifier si un produit est dans le panier
  static async isInCart(userId: string, productId: string) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('customer_id', userId)
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return { 
        data: { 
          inCart: !!data, 
          quantity: data?.quantity || 0 
        }, 
        error: null 
      }
    } catch (error) {
      return { 
        data: { 
          inCart: false, 
          quantity: 0 
        }, 
        error: error as Error 
      }
    }
  }

  // Déplacer des articles du panier vers la liste de souhaits
  static async moveToWishlist(userId: string, cartItemId: string) {
    try {
      // Obtenir l'article du panier
      const { data: cartItem, error: getError } = await supabase
        .from('cart_items')
        .select('product_id')
        .eq('id', cartItemId)
        .eq('customer_id', userId)
        .single()

      if (getError) throw getError

      // Ajouter à la liste de souhaits
      const { error: wishlistError } = await supabase
        .from('wishlist_items')
        .insert({
          customer_id: userId,
          product_id: cartItem.product_id
        })

      if (wishlistError && wishlistError.code !== '23505') {
        // Ignorer l'erreur de duplication (l'article est déjà dans la wishlist)
        throw wishlistError
      }

      // Supprimer du panier
      const { error: removeError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (removeError) throw removeError

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Calculer les frais de livraison (fonction de base)
  static calculateShipping(subtotal: number, userLocation?: string): number {
    // Logique simple de calcul des frais de livraison
    if (subtotal >= 100) {
      return 0 // Livraison gratuite pour les commandes de plus de 100€
    }
    
    // Frais de base selon la localisation
    const baseShipping = userLocation === 'international' ? 15 : 5
    return baseShipping
  }

  // Calculer les taxes (fonction de base)
  static calculateTax(subtotal: number, taxRate: number = 0.20): number {
    return subtotal * taxRate
  }

  // Obtenir le résumé complet du panier avec frais
  static async getCartSummaryWithFees(userId: string, userLocation?: string, taxRate?: number) {
    try {
      const { data: cart, error } = await this.getCart(userId)
      
      if (error) throw error
      if (!cart) return { data: null, error: null }

      const shipping = this.calculateShipping(cart.subtotal, userLocation)
      const tax = this.calculateTax(cart.subtotal, taxRate)
      const total = cart.subtotal + shipping + tax

      return {
        data: {
          ...cart,
          shipping,
          tax,
          total
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Sauvegarder le panier pour plus tard (panier persistant)
  static async saveCartForLater(userId: string) {
    try {
      // Cette fonction pourrait implémenter une logique pour sauvegarder
      // l'état du panier pour une session ultérieure
      const { data: cart, error } = await this.getCart(userId)
      
      if (error) throw error

      // Sauvegarder dans une table séparée ou dans les métadonnées utilisateur
      // Pour l'instant, le panier est déjà persistant via cart_items
      
      return { data: cart, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

export default CartService