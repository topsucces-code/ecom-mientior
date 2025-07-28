import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { inventoryService } from './inventory-service'
import type {
  InventoryItem,
  InventoryMovement,
  StockAlert,
  Warehouse,
  InventoryTransfer,
  PurchaseOrder,
  Supplier,
  InventoryAdjustment,
  InventoryMetrics,
  InventoryFilters,
  InventorySearchParams
} from '@ecommerce/shared'

interface InventoryStore {
  // State
  inventoryItems: InventoryItem[]
  movements: InventoryMovement[]
  alerts: StockAlert[]
  warehouses: Warehouse[]
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
  adjustments: InventoryAdjustment[]
  metrics: InventoryMetrics | null
  
  // UI State
  loading: boolean
  error: string | null
  selectedWarehouse: string | null
  filters: InventoryFilters
  
  // Cache timestamps
  lastInventoryFetch: number | null
  lastAlertsFetch: number | null
  lastMetricsFetch: number | null
  
  // Actions - Inventory Items
  fetchInventoryItems: (params?: InventorySearchParams) => Promise<void>
  getInventoryItem: (id: string) => Promise<InventoryItem | null>
  createInventoryItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<InventoryItem>
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<InventoryItem>
  deleteInventoryItem: (id: string) => Promise<void>
  
  // Actions - Movements
  recordMovement: (movement: Omit<InventoryMovement, 'id' | 'created_at'>) => Promise<InventoryMovement>
  fetchMovements: (inventoryItemId?: string) => Promise<void>
  
  // Actions - Alerts
  fetchAlerts: () => Promise<void>
  resolveAlert: (alertId: string) => Promise<void>
  checkStockAlerts: () => Promise<void>
  
  // Actions - Warehouses
  fetchWarehouses: () => Promise<void>
  createWarehouse: (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => Promise<Warehouse>
  setSelectedWarehouse: (warehouseId: string | null) => void
  
  // Actions - Suppliers
  fetchSuppliers: () => Promise<void>
  createSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<Supplier>
  
  // Actions - Purchase Orders
  fetchPurchaseOrders: () => Promise<void>
  createPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => Promise<PurchaseOrder>
  updatePurchaseOrderStatus: (orderId: string, status: PurchaseOrder['status']) => Promise<void>
  
  // Actions - Adjustments
  fetchAdjustments: () => Promise<void>
  createAdjustment: (adjustment: Omit<InventoryAdjustment, 'id' | 'created_at' | 'updated_at'>) => Promise<InventoryAdjustment>
  processAdjustment: (adjustmentId: string) => Promise<void>
  
  // Actions - Analytics
  fetchMetrics: (warehouseId?: string) => Promise<void>
  checkAutoReorder: () => Promise<any[]>
  
  // Actions - Filters
  setFilters: (filters: Partial<InventoryFilters>) => void
  clearFilters: () => void
  
  // Actions - UI
  setError: (error: string | null) => void
  clearError: () => void
  
  // Actions - Cache
  invalidateCache: () => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      inventoryItems: [],
      movements: [],
      alerts: [],
      warehouses: [],
      suppliers: [],
      purchaseOrders: [],
      adjustments: [],
      metrics: null,
      
      // UI State
      loading: false,
      error: null,
      selectedWarehouse: null,
      filters: {},
      
      // Cache timestamps
      lastInventoryFetch: null,
      lastAlertsFetch: null,
      lastMetricsFetch: null,
      
      // ========== INVENTORY ITEMS ==========
      
      fetchInventoryItems: async (params = {}) => {
        try {
          set({ loading: true, error: null })
          
          // Add selected warehouse to filters if not specified
          const { selectedWarehouse, filters } = get()
          const searchParams = {
            ...params,
            filters: {
              ...filters,
              ...params.filters,
              warehouse_id: params.filters?.warehouse_id || selectedWarehouse || undefined
            }
          }
          
          const items = await inventoryService.getInventoryItems(searchParams)
          set({ 
            inventoryItems: items,
            lastInventoryFetch: Date.now(),
            loading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch inventory items',
            loading: false 
          })
        }
      },
      
      getInventoryItem: async (id: string) => {
        try {
          const item = await inventoryService.getInventoryItem(id)
          
          // Update the item in the store if it exists
          set(state => ({
            inventoryItems: state.inventoryItems.map(existing => 
              existing.id === id ? { ...existing, ...item } : existing
            )
          }))
          
          return item
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch inventory item' })
          return null
        }
      },
      
      createInventoryItem: async (itemData) => {
        try {
          set({ loading: true, error: null })
          const newItem = await inventoryService.createInventoryItem(itemData)
          
          set(state => ({
            inventoryItems: [newItem, ...state.inventoryItems],
            loading: false
          }))
          
          return newItem
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create inventory item',
            loading: false 
          })
          throw error
        }
      },
      
      updateInventoryItem: async (id: string, updates) => {
        try {
          const updatedItem = await inventoryService.updateInventoryItem(id, updates)
          
          set(state => ({
            inventoryItems: state.inventoryItems.map(item => 
              item.id === id ? updatedItem : item
            )
          }))
          
          return updatedItem
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update inventory item' })
          throw error
        }
      },
      
      deleteInventoryItem: async (id: string) => {
        try {
          await inventoryService.deleteInventoryItem(id)
          
          set(state => ({
            inventoryItems: state.inventoryItems.filter(item => item.id !== id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete inventory item' })
          throw error
        }
      },
      
      // ========== MOVEMENTS ==========
      
      recordMovement: async (movementData) => {
        try {
          const movement = await inventoryService.recordMovement(movementData)
          
          set(state => ({
            movements: [movement, ...state.movements]
          }))
          
          // Refresh inventory items to get updated quantities
          get().fetchInventoryItems()
          
          return movement
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to record movement' })
          throw error
        }
      },
      
      fetchMovements: async (inventoryItemId) => {
        try {
          const movements = await inventoryService.getMovements(inventoryItemId)
          set({ movements })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch movements' })
        }
      },
      
      // ========== ALERTS ==========
      
      fetchAlerts: async () => {
        try {
          const alerts = await inventoryService.getActiveAlerts()
          set({ 
            alerts,
            lastAlertsFetch: Date.now() 
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch alerts' })
        }
      },
      
      resolveAlert: async (alertId: string) => {
        try {
          await inventoryService.resolveAlert(alertId)
          
          set(state => ({
            alerts: state.alerts.filter(alert => alert.id !== alertId)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to resolve alert' })
        }
      },
      
      checkStockAlerts: async () => {
        try {
          const newAlerts = await inventoryService.checkStockAlerts()
          
          set(state => ({
            alerts: [...newAlerts, ...state.alerts]
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to check stock alerts' })
        }
      },
      
      // ========== WAREHOUSES ==========
      
      fetchWarehouses: async () => {
        try {
          const warehouses = await inventoryService.getWarehouses()
          set({ warehouses })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch warehouses' })
        }
      },
      
      createWarehouse: async (warehouseData) => {
        try {
          const newWarehouse = await inventoryService.createWarehouse(warehouseData)
          
          set(state => ({
            warehouses: [...state.warehouses, newWarehouse]
          }))
          
          return newWarehouse
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create warehouse' })
          throw error
        }
      },
      
      setSelectedWarehouse: (warehouseId) => {
        set({ selectedWarehouse: warehouseId })
        // Refresh inventory items with new warehouse filter
        get().fetchInventoryItems()
      },
      
      // ========== SUPPLIERS ==========
      
      fetchSuppliers: async () => {
        try {
          const suppliers = await inventoryService.getSuppliers()
          set({ suppliers })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch suppliers' })
        }
      },
      
      createSupplier: async (supplierData) => {
        try {
          const newSupplier = await inventoryService.createSupplier(supplierData)
          
          set(state => ({
            suppliers: [...state.suppliers, newSupplier]
          }))
          
          return newSupplier
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create supplier' })
          throw error
        }
      },
      
      // ========== PURCHASE ORDERS ==========
      
      fetchPurchaseOrders: async () => {
        try {
          // This would need to be implemented in the service
          // const orders = await inventoryService.getPurchaseOrders()
          // set({ purchaseOrders: orders })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch purchase orders' })
        }
      },
      
      createPurchaseOrder: async (orderData) => {
        try {
          const newOrder = await inventoryService.createPurchaseOrder(orderData)
          
          set(state => ({
            purchaseOrders: [...state.purchaseOrders, newOrder]
          }))
          
          return newOrder
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create purchase order' })
          throw error
        }
      },
      
      updatePurchaseOrderStatus: async (orderId: string, status: PurchaseOrder['status']) => {
        try {
          await inventoryService.updatePurchaseOrderStatus(orderId, status)
          
          set(state => ({
            purchaseOrders: state.purchaseOrders.map(order => 
              order.id === orderId ? { ...order, status } : order
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update purchase order status' })
        }
      },
      
      // ========== ADJUSTMENTS ==========
      
      fetchAdjustments: async () => {
        try {
          // This would need to be implemented in the service
          // const adjustments = await inventoryService.getAdjustments()
          // set({ adjustments })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch adjustments' })
        }
      },
      
      createAdjustment: async (adjustmentData) => {
        try {
          const newAdjustment = await inventoryService.createAdjustment(adjustmentData)
          
          set(state => ({
            adjustments: [...state.adjustments, newAdjustment]
          }))
          
          return newAdjustment
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create adjustment' })
          throw error
        }
      },
      
      processAdjustment: async (adjustmentId: string) => {
        try {
          await inventoryService.processAdjustment(adjustmentId)
          
          set(state => ({
            adjustments: state.adjustments.map(adj => 
              adj.id === adjustmentId ? { ...adj, status: 'completed' } : adj
            )
          }))
          
          // Refresh inventory items to reflect changes
          get().fetchInventoryItems()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to process adjustment' })
        }
      },
      
      // ========== ANALYTICS ==========
      
      fetchMetrics: async (warehouseId) => {
        try {
          const metrics = await inventoryService.getInventoryMetrics(warehouseId)
          set({ 
            metrics,
            lastMetricsFetch: Date.now() 
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch metrics' })
        }
      },
      
      checkAutoReorder: async () => {
        try {
          const recommendations = await inventoryService.checkAutoReorder()
          return recommendations
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to check auto reorder' })
          return []
        }
      },
      
      // ========== FILTERS ==========
      
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }))
        // Refresh inventory items with new filters
        get().fetchInventoryItems()
      },
      
      clearFilters: () => {
        set({ filters: {} })
        // Refresh inventory items without filters
        get().fetchInventoryItems()
      },
      
      // ========== UI ==========
      
      setError: (error) => {
        set({ error })
      },
      
      clearError: () => {
        set({ error: null })
      },
      
      // ========== CACHE ==========
      
      invalidateCache: () => {
        set({
          lastInventoryFetch: null,
          lastAlertsFetch: null,
          lastMetricsFetch: null
        })
      }
    }),
    {
      name: 'inventory-store',
      partialize: (state) => ({
        selectedWarehouse: state.selectedWarehouse,
        filters: state.filters,
        // Don't persist data that changes frequently
        warehouses: state.warehouses,
        suppliers: state.suppliers
      })
    }
  )
)