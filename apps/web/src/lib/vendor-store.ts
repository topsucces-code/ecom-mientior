import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  Vendor, 
  VendorApplication, 
  VendorProduct, 
  VendorOrder, 
  VendorPayout, 
  VendorReview, 
  VendorMessage, 
  VendorCommission, 
  VendorSettings,
  VendorFilters,
  VendorSearchParams 
} from '@ecommerce/shared'
import { vendorService } from './vendor-service'

interface VendorState {
  // Vendors
  vendors: Vendor[]
  currentVendor: Vendor | null
  vendorLoading: boolean
  vendorError: string | null
  
  // Applications
  applications: VendorApplication[]
  currentApplication: VendorApplication | null
  applicationLoading: boolean
  applicationError: string | null
  
  // Products
  vendorProducts: VendorProduct[]
  productLoading: boolean
  productError: string | null
  
  // Orders
  vendorOrders: VendorOrder[]
  orderLoading: boolean
  orderError: string | null
  
  // Payouts
  vendorPayouts: VendorPayout[]
  payoutLoading: boolean
  payoutError: string | null
  
  // Reviews
  vendorReviews: VendorReview[]
  reviewLoading: boolean
  reviewError: string | null
  
  // Messages
  vendorMessages: VendorMessage[]
  messageLoading: boolean
  messageError: string | null
  
  // Commissions
  vendorCommissions: VendorCommission[]
  commissionLoading: boolean
  commissionError: string | null
  
  // Settings
  vendorSettings: VendorSettings | null
  settingsLoading: boolean
  settingsError: string | null
  
  // Pagination and filters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: VendorFilters
  searchQuery: string
  
  // Actions for vendors
  getVendors: (params?: VendorSearchParams) => Promise<void>
  getVendorById: (vendorId: string) => Promise<void>
  getVendorByUserId: (userId: string) => Promise<void>
  createVendor: (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'approved_at' | 'last_active_at'>) => Promise<Vendor | null>
  updateVendor: (vendorId: string, updates: Partial<Vendor>) => Promise<void>
  deleteVendor: (vendorId: string) => Promise<void>
  approveVendor: (vendorId: string, notes?: string) => Promise<void>
  suspendVendor: (vendorId: string, reason: string) => Promise<void>
  setCurrentVendor: (vendor: Vendor | null) => void
  
  // Actions for applications
  getVendorApplications: (filters?: { status?: VendorApplication['status'][]; business_type?: VendorApplication['business_type'][] }) => Promise<void>
  createVendorApplication: (applicationData: Omit<VendorApplication, 'id' | 'created_at' | 'updated_at' | 'reviewed_at'>) => Promise<VendorApplication | null>
  updateVendorApplication: (applicationId: string, updates: Partial<VendorApplication>) => Promise<void>
  setCurrentApplication: (application: VendorApplication | null) => void
  
  // Actions for products
  getVendorProducts: (vendorId: string, filters?: { status?: VendorProduct['status'][]; featured?: boolean }) => Promise<void>
  createVendorProduct: (vendorId: string, productData: Omit<VendorProduct, 'id' | 'vendor_id' | 'created_at' | 'updated_at'>) => Promise<VendorProduct | null>
  updateVendorProduct: (vendorId: string, productId: string, updates: Partial<VendorProduct>) => Promise<void>
  
  // Actions for orders
  getVendorOrders: (vendorId: string, filters?: { status?: VendorOrder['status'][]; date_range?: { start_date: string; end_date: string } }) => Promise<void>
  updateVendorOrder: (vendorId: string, orderId: string, updates: { status?: VendorOrder['status']; tracking_number?: string; shipping_carrier?: string; shipped_at?: string; delivered_at?: string }) => Promise<void>
  
  // Actions for payouts
  getVendorPayouts: (vendorId: string, filters?: { status?: VendorPayout['status'][]; date_range?: { start_date: string; end_date: string } }) => Promise<void>
  createVendorPayout: (vendorId: string, payoutData: Omit<VendorPayout, 'id' | 'vendor_id' | 'created_at' | 'updated_at' | 'processed_at'>) => Promise<VendorPayout | null>
  processVendorPayout: (vendorId: string, payoutId: string, paymentReference: string) => Promise<void>
  
  // Actions for reviews
  getVendorReviews: (vendorId: string, filters?: { status?: VendorReview['status'][]; rating?: number[] }) => Promise<void>
  createVendorReview: (vendorId: string, reviewData: Omit<VendorReview, 'id' | 'vendor_id' | 'created_at' | 'updated_at'>) => Promise<VendorReview | null>
  
  // Actions for messages
  getVendorMessages: (vendorId: string, filters?: { status?: VendorMessage['status'][]; message_type?: VendorMessage['message_type'][]; priority?: VendorMessage['priority'][] }) => Promise<void>
  createVendorMessage: (vendorId: string, messageData: Omit<VendorMessage, 'id' | 'vendor_id' | 'created_at' | 'updated_at'>) => Promise<VendorMessage | null>
  updateVendorMessage: (vendorId: string, messageId: string, updates: { status?: VendorMessage['status']; priority?: VendorMessage['priority'] }) => Promise<void>
  
  // Actions for commissions
  getVendorCommissions: (vendorId: string, filters?: { status?: VendorCommission['status'][]; date_range?: { start_date: string; end_date: string } }) => Promise<void>
  calculateCommission: (vendorId: string, orderId: string, productId: string, amount: number) => Promise<number>
  
  // Actions for settings
  getVendorSettings: (vendorId: string) => Promise<void>
  updateVendorSettings: (vendorId: string, settings: Partial<VendorSettings>) => Promise<void>
  
  // Utility actions
  updateVendorMetrics: (vendorId: string) => Promise<void>
  setFilters: (filters: Partial<VendorFilters>) => void
  setSearchQuery: (query: string) => void
  setPagination: (pagination: Partial<VendorState['pagination']>) => void
  clearErrors: () => void
  reset: () => void
}

const initialState = {
  vendors: [],
  currentVendor: null,
  vendorLoading: false,
  vendorError: null,
  
  applications: [],
  currentApplication: null,
  applicationLoading: false,
  applicationError: null,
  
  vendorProducts: [],
  productLoading: false,
  productError: null,
  
  vendorOrders: [],
  orderLoading: false,
  orderError: null,
  
  vendorPayouts: [],
  payoutLoading: false,
  payoutError: null,
  
  vendorReviews: [],
  reviewLoading: false,
  reviewError: null,
  
  vendorMessages: [],
  messageLoading: false,
  messageError: null,
  
  vendorCommissions: [],
  commissionLoading: false,
  commissionError: null,
  
  vendorSettings: null,
  settingsLoading: false,
  settingsError: null,
  
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  searchQuery: '',
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Vendor actions
      getVendors: async (params) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const result = await vendorService.getVendors(params)
          set({
            vendors: result.vendors,
            pagination: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: Math.ceil(result.total / result.limit),
            },
            vendorLoading: false,
          })
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to fetch vendors',
            vendorLoading: false,
          })
        }
      },

      getVendorById: async (vendorId) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const vendor = await vendorService.getVendorById(vendorId)
          set({
            currentVendor: vendor,
            vendorLoading: false,
          })
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to fetch vendor',
            vendorLoading: false,
          })
        }
      },

      getVendorByUserId: async (userId) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const vendor = await vendorService.getVendorByUserId(userId)
          set({
            currentVendor: vendor,
            vendorLoading: false,
          })
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to fetch vendor',
            vendorLoading: false,
          })
        }
      },

      createVendor: async (vendorData) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const vendor = await vendorService.createVendor(vendorData)
          set(state => ({
            vendors: [...state.vendors, vendor],
            currentVendor: vendor,
            vendorLoading: false,
          }))
          return vendor
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to create vendor',
            vendorLoading: false,
          })
          return null
        }
      },

      updateVendor: async (vendorId, updates) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const updatedVendor = await vendorService.updateVendor(vendorId, updates)
          set(state => ({
            vendors: state.vendors.map(v => v.id === vendorId ? updatedVendor : v),
            currentVendor: state.currentVendor?.id === vendorId ? updatedVendor : state.currentVendor,
            vendorLoading: false,
          }))
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to update vendor',
            vendorLoading: false,
          })
        }
      },

      deleteVendor: async (vendorId) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          await vendorService.deleteVendor(vendorId)
          set(state => ({
            vendors: state.vendors.filter(v => v.id !== vendorId),
            currentVendor: state.currentVendor?.id === vendorId ? null : state.currentVendor,
            vendorLoading: false,
          }))
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to delete vendor',
            vendorLoading: false,
          })
        }
      },

      approveVendor: async (vendorId, notes) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const updatedVendor = await vendorService.approveVendor(vendorId, notes)
          set(state => ({
            vendors: state.vendors.map(v => v.id === vendorId ? updatedVendor : v),
            currentVendor: state.currentVendor?.id === vendorId ? updatedVendor : state.currentVendor,
            vendorLoading: false,
          }))
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to approve vendor',
            vendorLoading: false,
          })
        }
      },

      suspendVendor: async (vendorId, reason) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const updatedVendor = await vendorService.suspendVendor(vendorId, reason)
          set(state => ({
            vendors: state.vendors.map(v => v.id === vendorId ? updatedVendor : v),
            currentVendor: state.currentVendor?.id === vendorId ? updatedVendor : state.currentVendor,
            vendorLoading: false,
          }))
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to suspend vendor',
            vendorLoading: false,
          })
        }
      },

      setCurrentVendor: (vendor) => set({ currentVendor: vendor }),

      // Application actions
      getVendorApplications: async (filters) => {
        set({ applicationLoading: true, applicationError: null })
        try {
          const applications = await vendorService.getVendorApplications(filters)
          set({
            applications,
            applicationLoading: false,
          })
        } catch (error) {
          set({
            applicationError: error instanceof Error ? error.message : 'Failed to fetch applications',
            applicationLoading: false,
          })
        }
      },

      createVendorApplication: async (applicationData) => {
        set({ applicationLoading: true, applicationError: null })
        try {
          const application = await vendorService.createVendorApplication(applicationData)
          set(state => ({
            applications: [...state.applications, application],
            currentApplication: application,
            applicationLoading: false,
          }))
          return application
        } catch (error) {
          set({
            applicationError: error instanceof Error ? error.message : 'Failed to create application',
            applicationLoading: false,
          })
          return null
        }
      },

      updateVendorApplication: async (applicationId, updates) => {
        set({ applicationLoading: true, applicationError: null })
        try {
          const updatedApplication = await vendorService.updateVendorApplication(applicationId, updates)
          set(state => ({
            applications: state.applications.map(a => a.id === applicationId ? updatedApplication : a),
            currentApplication: state.currentApplication?.id === applicationId ? updatedApplication : state.currentApplication,
            applicationLoading: false,
          }))
        } catch (error) {
          set({
            applicationError: error instanceof Error ? error.message : 'Failed to update application',
            applicationLoading: false,
          })
        }
      },

      setCurrentApplication: (application) => set({ currentApplication: application }),

      // Product actions
      getVendorProducts: async (vendorId, filters) => {
        set({ productLoading: true, productError: null })
        try {
          const products = await vendorService.getVendorProducts(vendorId, filters)
          set({
            vendorProducts: products,
            productLoading: false,
          })
        } catch (error) {
          set({
            productError: error instanceof Error ? error.message : 'Failed to fetch vendor products',
            productLoading: false,
          })
        }
      },

      createVendorProduct: async (vendorId, productData) => {
        set({ productLoading: true, productError: null })
        try {
          const product = await vendorService.createVendorProduct(vendorId, productData)
          set(state => ({
            vendorProducts: [...state.vendorProducts, product],
            productLoading: false,
          }))
          return product
        } catch (error) {
          set({
            productError: error instanceof Error ? error.message : 'Failed to create vendor product',
            productLoading: false,
          })
          return null
        }
      },

      updateVendorProduct: async (vendorId, productId, updates) => {
        set({ productLoading: true, productError: null })
        try {
          const updatedProduct = await vendorService.updateVendorProduct(vendorId, productId, updates)
          set(state => ({
            vendorProducts: state.vendorProducts.map(p => p.id === productId ? updatedProduct : p),
            productLoading: false,
          }))
        } catch (error) {
          set({
            productError: error instanceof Error ? error.message : 'Failed to update vendor product',
            productLoading: false,
          })
        }
      },

      // Order actions
      getVendorOrders: async (vendorId, filters) => {
        set({ orderLoading: true, orderError: null })
        try {
          const orders = await vendorService.getVendorOrders(vendorId, filters)
          set({
            vendorOrders: orders,
            orderLoading: false,
          })
        } catch (error) {
          set({
            orderError: error instanceof Error ? error.message : 'Failed to fetch vendor orders',
            orderLoading: false,
          })
        }
      },

      updateVendorOrder: async (vendorId, orderId, updates) => {
        set({ orderLoading: true, orderError: null })
        try {
          const updatedOrder = await vendorService.updateVendorOrder(vendorId, orderId, updates)
          set(state => ({
            vendorOrders: state.vendorOrders.map(o => o.id === orderId ? updatedOrder : o),
            orderLoading: false,
          }))
        } catch (error) {
          set({
            orderError: error instanceof Error ? error.message : 'Failed to update vendor order',
            orderLoading: false,
          })
        }
      },

      // Payout actions
      getVendorPayouts: async (vendorId, filters) => {
        set({ payoutLoading: true, payoutError: null })
        try {
          const payouts = await vendorService.getVendorPayouts(vendorId, filters)
          set({
            vendorPayouts: payouts,
            payoutLoading: false,
          })
        } catch (error) {
          set({
            payoutError: error instanceof Error ? error.message : 'Failed to fetch vendor payouts',
            payoutLoading: false,
          })
        }
      },

      createVendorPayout: async (vendorId, payoutData) => {
        set({ payoutLoading: true, payoutError: null })
        try {
          const payout = await vendorService.createVendorPayout(vendorId, payoutData)
          set(state => ({
            vendorPayouts: [...state.vendorPayouts, payout],
            payoutLoading: false,
          }))
          return payout
        } catch (error) {
          set({
            payoutError: error instanceof Error ? error.message : 'Failed to create vendor payout',
            payoutLoading: false,
          })
          return null
        }
      },

      processVendorPayout: async (vendorId, payoutId, paymentReference) => {
        set({ payoutLoading: true, payoutError: null })
        try {
          const updatedPayout = await vendorService.processVendorPayout(vendorId, payoutId, paymentReference)
          set(state => ({
            vendorPayouts: state.vendorPayouts.map(p => p.id === payoutId ? updatedPayout : p),
            payoutLoading: false,
          }))
        } catch (error) {
          set({
            payoutError: error instanceof Error ? error.message : 'Failed to process vendor payout',
            payoutLoading: false,
          })
        }
      },

      // Review actions
      getVendorReviews: async (vendorId, filters) => {
        set({ reviewLoading: true, reviewError: null })
        try {
          const reviews = await vendorService.getVendorReviews(vendorId, filters)
          set({
            vendorReviews: reviews,
            reviewLoading: false,
          })
        } catch (error) {
          set({
            reviewError: error instanceof Error ? error.message : 'Failed to fetch vendor reviews',
            reviewLoading: false,
          })
        }
      },

      createVendorReview: async (vendorId, reviewData) => {
        set({ reviewLoading: true, reviewError: null })
        try {
          const review = await vendorService.createVendorReview(vendorId, reviewData)
          set(state => ({
            vendorReviews: [...state.vendorReviews, review],
            reviewLoading: false,
          }))
          return review
        } catch (error) {
          set({
            reviewError: error instanceof Error ? error.message : 'Failed to create vendor review',
            reviewLoading: false,
          })
          return null
        }
      },

      // Message actions
      getVendorMessages: async (vendorId, filters) => {
        set({ messageLoading: true, messageError: null })
        try {
          const messages = await vendorService.getVendorMessages(vendorId, filters)
          set({
            vendorMessages: messages,
            messageLoading: false,
          })
        } catch (error) {
          set({
            messageError: error instanceof Error ? error.message : 'Failed to fetch vendor messages',
            messageLoading: false,
          })
        }
      },

      createVendorMessage: async (vendorId, messageData) => {
        set({ messageLoading: true, messageError: null })
        try {
          const message = await vendorService.createVendorMessage(vendorId, messageData)
          set(state => ({
            vendorMessages: [...state.vendorMessages, message],
            messageLoading: false,
          }))
          return message
        } catch (error) {
          set({
            messageError: error instanceof Error ? error.message : 'Failed to create vendor message',
            messageLoading: false,
          })
          return null
        }
      },

      updateVendorMessage: async (vendorId, messageId, updates) => {
        set({ messageLoading: true, messageError: null })
        try {
          const updatedMessage = await vendorService.updateVendorMessage(vendorId, messageId, updates)
          set(state => ({
            vendorMessages: state.vendorMessages.map(m => m.id === messageId ? updatedMessage : m),
            messageLoading: false,
          }))
        } catch (error) {
          set({
            messageError: error instanceof Error ? error.message : 'Failed to update vendor message',
            messageLoading: false,
          })
        }
      },

      // Commission actions
      getVendorCommissions: async (vendorId, filters) => {
        set({ commissionLoading: true, commissionError: null })
        try {
          const commissions = await vendorService.getVendorCommissions(vendorId, filters)
          set({
            vendorCommissions: commissions,
            commissionLoading: false,
          })
        } catch (error) {
          set({
            commissionError: error instanceof Error ? error.message : 'Failed to fetch vendor commissions',
            commissionLoading: false,
          })
        }
      },

      calculateCommission: async (vendorId, orderId, productId, amount) => {
        try {
          return await vendorService.calculateCommission(vendorId, orderId, productId, amount)
        } catch (error) {
          set({
            commissionError: error instanceof Error ? error.message : 'Failed to calculate commission',
          })
          return 0
        }
      },

      // Settings actions
      getVendorSettings: async (vendorId) => {
        set({ settingsLoading: true, settingsError: null })
        try {
          const settings = await vendorService.getVendorSettings(vendorId)
          set({
            vendorSettings: settings,
            settingsLoading: false,
          })
        } catch (error) {
          set({
            settingsError: error instanceof Error ? error.message : 'Failed to fetch vendor settings',
            settingsLoading: false,
          })
        }
      },

      updateVendorSettings: async (vendorId, settings) => {
        set({ settingsLoading: true, settingsError: null })
        try {
          const updatedSettings = await vendorService.updateVendorSettings(vendorId, settings)
          set({
            vendorSettings: updatedSettings,
            settingsLoading: false,
          })
        } catch (error) {
          set({
            settingsError: error instanceof Error ? error.message : 'Failed to update vendor settings',
            settingsLoading: false,
          })
        }
      },

      // Utility actions
      updateVendorMetrics: async (vendorId) => {
        set({ vendorLoading: true, vendorError: null })
        try {
          const updatedVendor = await vendorService.updateVendorMetrics(vendorId)
          set(state => ({
            vendors: state.vendors.map(v => v.id === vendorId ? updatedVendor : v),
            currentVendor: state.currentVendor?.id === vendorId ? updatedVendor : state.currentVendor,
            vendorLoading: false,
          }))
        } catch (error) {
          set({
            vendorError: error instanceof Error ? error.message : 'Failed to update vendor metrics',
            vendorLoading: false,
          })
        }
      },

      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters }
        }))
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setPagination: (pagination) => {
        set(state => ({
          pagination: { ...state.pagination, ...pagination }
        }))
      },

      clearErrors: () => {
        set({
          vendorError: null,
          applicationError: null,
          productError: null,
          orderError: null,
          payoutError: null,
          reviewError: null,
          messageError: null,
          commissionError: null,
          settingsError: null,
        })
      },

      reset: () => set(initialState),
    }),
    {
      name: 'vendor-store',
      partialize: (state) => ({
        currentVendor: state.currentVendor,
        currentApplication: state.currentApplication,
        filters: state.filters,
        searchQuery: state.searchQuery,
        pagination: state.pagination,
      }),
    }
  )
)