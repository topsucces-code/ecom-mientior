import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { 
  ChatMessage, 
  ChatConversation, 
  ChatAgent, 
  ChatTemplate,
  ChatEvent,
  TypingIndicator 
} from '@ecommerce/shared'
import { chatService, CreateConversationData, SendMessageData } from './chat-service'

interface ChatState {
  // Current user info
  currentUserId: string | null
  currentUserType: 'customer' | 'agent' | null
  
  // Conversations
  conversations: ChatConversation[]
  currentConversationId: string | null
  conversationsLoading: boolean
  conversationsError: string | null
  
  // Messages
  messages: Record<string, ChatMessage[]> // conversationId -> messages
  messagesLoading: boolean
  messagesError: string | null
  
  // Agents
  agents: ChatAgent[]
  agentsLoading: boolean
  
  // Templates
  templates: ChatTemplate[]
  templatesLoading: boolean
  
  // Real-time state
  typingIndicators: Record<string, TypingIndicator[]> // conversationId -> typing users
  isConnected: boolean
  unreadCounts: Record<string, number> // conversationId -> unread count
  
  // UI State
  isChatWidgetOpen: boolean
  isChatWindowMinimized: boolean
  selectedConversationId: string | null
  
  // Actions
  setCurrentUser: (userId: string, userType: 'customer' | 'agent') => void
  
  // Conversation actions
  loadConversations: (filters?: any) => Promise<void>
  createConversation: (data: CreateConversationData) => Promise<ChatConversation>
  selectConversation: (conversationId: string) => void
  assignAgent: (conversationId: string, agentId: string) => Promise<void>
  updateConversationStatus: (conversationId: string, status: ChatConversation['status']) => Promise<void>
  
  // Message actions
  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (data: SendMessageData) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  
  // Real-time actions
  handleIncomingEvent: (event: ChatEvent) => void
  setTyping: (conversationId: string, isTyping: boolean) => void
  
  // Agent actions
  loadAgents: () => Promise<void>
  updateAgentStatus: (status: ChatAgent['status']) => Promise<void>
  
  // Template actions
  loadTemplates: () => Promise<void>
  useTemplate: (templateId: string, conversationId: string) => Promise<void>
  
  // UI actions
  toggleChatWidget: () => void
  minimizeChatWindow: () => void
  openChatWindow: () => void
  
  // Utilities
  getUnreadCount: (conversationId?: string) => number
  getTotalUnreadCount: () => number
  reset: () => void
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentUserId: null,
        currentUserType: null,
        conversations: [],
        currentConversationId: null,
        conversationsLoading: false,
        conversationsError: null,
        messages: {},
        messagesLoading: false,
        messagesError: null,
        agents: [],
        agentsLoading: false,
        templates: [],
        templatesLoading: false,
        typingIndicators: {},
        isConnected: false,
        unreadCounts: {},
        isChatWidgetOpen: false,
        isChatWindowMinimized: false,
        selectedConversationId: null,

        // User management
        setCurrentUser: (userId: string, userType: 'customer' | 'agent') => {
          set({ currentUserId: userId, currentUserType: userType })
          
          // Set up real-time event listeners
          chatService.addEventListener('all', get().handleIncomingEvent)
          set({ isConnected: true })
        },

        // Conversation management
        loadConversations: async (filters = {}) => {
          set({ conversationsLoading: true, conversationsError: null })
          try {
            const conversations = await chatService.getConversations({
              ...filters,
              customer_id: get().currentUserType === 'customer' ? get().currentUserId! : undefined,
              agent_id: get().currentUserType === 'agent' ? get().currentUserId! : undefined,
            })
            set({ conversations, conversationsLoading: false })
          } catch (error) {
            set({ 
              conversationsError: error instanceof Error ? error.message : 'Failed to load conversations',
              conversationsLoading: false 
            })
          }
        },

        createConversation: async (data: CreateConversationData) => {
          try {
            const conversation = await chatService.createConversation(data)
            set(state => ({ 
              conversations: [conversation, ...state.conversations],
              currentConversationId: conversation.id,
              selectedConversationId: conversation.id,
              isChatWidgetOpen: true,
              isChatWindowMinimized: false,
            }))
            return conversation
          } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to create conversation')
          }
        },

        selectConversation: (conversationId: string) => {
          set({ 
            selectedConversationId: conversationId,
            currentConversationId: conversationId 
          })
          
          // Load messages for this conversation
          get().loadMessages(conversationId)
          
          // Mark as read
          get().markAsRead(conversationId)
        },

        assignAgent: async (conversationId: string, agentId: string) => {
          try {
            await chatService.assignAgentToConversation(conversationId, agentId)
            await get().loadConversations()
          } catch (error) {
            console.error('Failed to assign agent:', error)
          }
        },

        updateConversationStatus: async (conversationId: string, status: ChatConversation['status']) => {
          try {
            await chatService.updateConversationStatus(conversationId, status)
            await get().loadConversations()
          } catch (error) {
            console.error('Failed to update conversation status:', error)
          }
        },

        // Message management
        loadMessages: async (conversationId: string) => {
          set({ messagesLoading: true, messagesError: null })
          try {
            const messages = await chatService.getMessages(conversationId)
            set(state => ({
              messages: {
                ...state.messages,
                [conversationId]: messages
              },
              messagesLoading: false
            }))
          } catch (error) {
            set({ 
              messagesError: error instanceof Error ? error.message : 'Failed to load messages',
              messagesLoading: false 
            })
          }
        },

        sendMessage: async (data: SendMessageData) => {
          try {
            await chatService.sendMessage(data)
            // Message will be added via real-time event
          } catch (error) {
            console.error('Failed to send message:', error)
          }
        },

        markAsRead: async (conversationId: string) => {
          const messages = get().messages[conversationId] || []
          const currentUserId = get().currentUserId
          
          if (!currentUserId) return

          // Mark unread messages as read
          const unreadMessages = messages.filter(msg => 
            !msg.read_by.includes(currentUserId) && msg.sender_id !== currentUserId
          )

          for (const message of unreadMessages) {
            await chatService.markMessageAsRead(message.id, currentUserId)
          }

          // Reset unread count
          set(state => ({
            unreadCounts: {
              ...state.unreadCounts,
              [conversationId]: 0
            }
          }))
        },

        // Real-time event handling
        handleIncomingEvent: (event: ChatEvent) => {
          const state = get()

          switch (event.type) {
            case 'message':
              const message = event.data as ChatMessage
              const conversationId = message.conversation_id
              
              set(state => {
                const currentMessages = state.messages[conversationId] || []
                const updatedMessages = [...currentMessages, message]
                
                // Update unread count if not from current user
                const isFromCurrentUser = message.sender_id === state.currentUserId
                const currentUnread = state.unreadCounts[conversationId] || 0
                
                return {
                  messages: {
                    ...state.messages,
                    [conversationId]: updatedMessages
                  },
                  unreadCounts: {
                    ...state.unreadCounts,
                    [conversationId]: isFromCurrentUser ? currentUnread : currentUnread + 1
                  }
                }
              })
              break

            case 'typing':
              const typingData = event.data
              set(state => {
                const currentIndicators = state.typingIndicators[event.conversation_id] || []
                let updatedIndicators

                if (typingData.is_typing) {
                  // Add or update typing indicator
                  const existingIndex = currentIndicators.findIndex(t => t.user_id === event.user_id)
                  if (existingIndex >= 0) {
                    updatedIndicators = [...currentIndicators]
                    updatedIndicators[existingIndex] = {
                      conversation_id: event.conversation_id,
                      user_id: event.user_id,
                      user_name: typingData.user_name,
                      is_typing: true,
                      timestamp: event.timestamp
                    }
                  } else {
                    updatedIndicators = [...currentIndicators, {
                      conversation_id: event.conversation_id,
                      user_id: event.user_id,
                      user_name: typingData.user_name,
                      is_typing: true,
                      timestamp: event.timestamp
                    }]
                  }
                } else {
                  // Remove typing indicator
                  updatedIndicators = currentIndicators.filter(t => t.user_id !== event.user_id)
                }

                return {
                  typingIndicators: {
                    ...state.typingIndicators,
                    [event.conversation_id]: updatedIndicators
                  }
                }
              })
              break

            case 'read':
              // Update message read status
              const messageId = event.data.message_id
              set(state => {
                const conversationMessages = state.messages[event.conversation_id] || []
                const updatedMessages = conversationMessages.map(msg => {
                  if (msg.id === messageId && !msg.read_by.includes(event.user_id)) {
                    return {
                      ...msg,
                      read_by: [...msg.read_by, event.user_id]
                    }
                  }
                  return msg
                })

                return {
                  messages: {
                    ...state.messages,
                    [event.conversation_id]: updatedMessages
                  }
                }
              })
              break

            case 'agent_joined':
            case 'status_change':
              // Reload conversations to get updated info
              get().loadConversations()
              break
          }
        },

        setTyping: async (conversationId: string, isTyping: boolean) => {
          const { currentUserId, currentUserType } = get()
          if (!currentUserId) return

          // Get user name (in real app, this would come from user data)
          const userName = currentUserType === 'agent' ? 'Agent' : 'Customer'
          
          await chatService.setTyping(conversationId, currentUserId, userName, isTyping)
        },

        // Agent management
        loadAgents: async () => {
          set({ agentsLoading: true })
          try {
            const agents = await chatService.getAgents()
            set({ agents, agentsLoading: false })
          } catch (error) {
            console.error('Failed to load agents:', error)
            set({ agentsLoading: false })
          }
        },

        updateAgentStatus: async (status: ChatAgent['status']) => {
          const { currentUserId } = get()
          if (!currentUserId) return

          try {
            await chatService.updateAgentStatus(currentUserId, status)
            await get().loadAgents()
          } catch (error) {
            console.error('Failed to update agent status:', error)
          }
        },

        // Template management
        loadTemplates: async () => {
          set({ templatesLoading: true })
          try {
            const templates = await chatService.getTemplates()
            set({ templates, templatesLoading: false })
          } catch (error) {
            console.error('Failed to load templates:', error)
            set({ templatesLoading: false })
          }
        },

        useTemplate: async (templateId: string, conversationId: string) => {
          try {
            const template = await chatService.useTemplate(templateId)
            if (template && get().currentUserId) {
              await get().sendMessage({
                conversation_id: conversationId,
                sender_id: get().currentUserId!,
                sender_type: get().currentUserType!,
                message: template.content,
                message_type: 'text'
              })
            }
          } catch (error) {
            console.error('Failed to use template:', error)
          }
        },

        // UI management
        toggleChatWidget: () => {
          set(state => ({ isChatWidgetOpen: !state.isChatWidgetOpen }))
        },

        minimizeChatWindow: () => {
          set({ isChatWindowMinimized: true })
        },

        openChatWindow: () => {
          set({ 
            isChatWidgetOpen: true, 
            isChatWindowMinimized: false 
          })
        },

        // Utilities
        getUnreadCount: (conversationId?: string) => {
          const { unreadCounts } = get()
          if (conversationId) {
            return unreadCounts[conversationId] || 0
          }
          return Object.values(unreadCounts).reduce((total, count) => total + count, 0)
        },

        getTotalUnreadCount: () => {
          return get().getUnreadCount()
        },

        reset: () => {
          set({
            currentUserId: null,
            currentUserType: null,
            conversations: [],
            currentConversationId: null,
            messages: {},
            unreadCounts: {},
            typingIndicators: {},
            selectedConversationId: null,
            isChatWidgetOpen: false,
            isChatWindowMinimized: false,
            isConnected: false,
          })
        },
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          currentUserId: state.currentUserId,
          currentUserType: state.currentUserType,
          isChatWidgetOpen: state.isChatWidgetOpen,
          isChatWindowMinimized: state.isChatWindowMinimized,
          unreadCounts: state.unreadCounts,
        }),
      }
    )
  )
)

// Selector hooks for better performance
export const useChatConversations = () => useChatStore(state => state.conversations)
export const useChatMessages = (conversationId: string) => 
  useChatStore(state => state.messages[conversationId] || [])
export const useChatAgents = () => useChatStore(state => state.agents)
export const useChatTemplates = () => useChatStore(state => state.templates)
export const useTypingIndicators = (conversationId: string) => 
  useChatStore(state => state.typingIndicators[conversationId] || [])
export const useChatUnreadCount = (conversationId?: string) => 
  useChatStore(state => state.getUnreadCount(conversationId))