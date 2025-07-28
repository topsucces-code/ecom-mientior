'use client'

import { supabase } from './supabase/client'
import { 
  ChatConversation, 
  ChatMessage, 
  ChatAgent, 
  ChatTemplate 
} from './supabase/types'

export interface CreateConversationData {
  customer_id: string
  subject?: string
  category: string
  priority?: string
  initial_message: string
  metadata?: any
}

export interface SendMessageData {
  conversation_id: string
  sender_id: string
  sender_type: 'customer' | 'agent' | 'bot'
  message: string
  message_type?: string
  metadata?: any
}

export interface ChatEvent {
  type: string
  conversation_id: string
  user_id: string
  data: any
  timestamp: string
}

export class ChatService {
  private eventListeners: Map<string, ((event: ChatEvent) => void)[]> = new Map()
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.setupRealtimeSubscriptions()
  }

  private setupRealtimeSubscriptions() {
    // Subscribe to new messages
    supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          this.emitEvent({
            type: 'message',
            conversation_id: payload.new.conversation_id,
            user_id: payload.new.sender_id,
            data: payload.new,
            timestamp: new Date().toISOString()
          })
        }
      )
      .subscribe()

    // Subscribe to conversation status changes
    supabase
      .channel('conversations')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_conversations' },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            this.emitEvent({
              type: 'status_change',
              conversation_id: payload.new.id,
              user_id: payload.new.agent_id || payload.new.customer_id,
              data: { status: payload.new.status },
              timestamp: new Date().toISOString()
            })
          }
        }
      )
      .subscribe()

    // Subscribe to agent presence changes
    supabase
      .channel('agents')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_agents' },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            this.emitEvent({
              type: 'agent_status_change',
              conversation_id: '',
              user_id: payload.new.user_id,
              data: { agent_id: payload.new.id, status: payload.new.status },
              timestamp: new Date().toISOString()
            })
          }
        }
      )
      .subscribe()
  }

  // Conversation Management
  async createConversation(data: CreateConversationData): Promise<ChatConversation> {
    try {
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          customer_id: data.customer_id,
          subject: data.subject,
          category: data.category,
          priority: data.priority || 'medium',
          status: 'open',
          metadata: data.metadata
        })
        .select(`
          *,
          customer:users(id, email, profile:user_profiles(*)),
          agent:chat_agents(*, user:users(id, email, profile:user_profiles(*)))
        `)
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        throw new Error('Failed to create conversation')
      }

      // Send initial message
      await this.sendMessage({
        conversation_id: conversation.id,
        sender_id: data.customer_id,
        sender_type: 'customer',
        message: data.initial_message,
        message_type: 'text'
      })

      // Try to assign an available agent
      await this.handleConversationRouting(conversation)

      return conversation
    } catch (error) {
      console.error('Error in createConversation:', error)
      throw error
    }
  }

  async getConversations(filters?: {
    agent_id?: string
    customer_id?: string
    status?: string
    category?: string
    limit?: number
  }): Promise<ChatConversation[]> {
    try {
      let query = supabase
        .from('chat_conversations')
        .select(`
          *,
          customer:users(id, email, profile:user_profiles(*)),
          agent:chat_agents(*, user:users(id, email, profile:user_profiles(*))),
          messages:chat_messages(id, message, sender_type, created_at)
        `)

      if (filters?.agent_id) {
        query = query.eq('agent_id', filters.agent_id)
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      query = query.order('last_message_at', { ascending: false })

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching conversations:', error)
        throw new Error('Failed to fetch conversations')
      }

      return data || []
    } catch (error) {
      console.error('Error in getConversations:', error)
      throw error
    }
  }

  async getConversationById(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          customer:users(id, email, profile:user_profiles(*)),
          agent:chat_agents(*, user:users(id, email, profile:user_profiles(*))),
          messages:chat_messages(*)
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.error('Error fetching conversation:', error)
        throw new Error('Failed to fetch conversation')
      }

      return data
    } catch (error) {
      console.error('Error in getConversationById:', error)
      throw error
    }
  }

  async assignAgentToConversation(conversationId: string, agentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({
          agent_id: agentId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) {
        console.error('Error assigning agent:', error)
        throw new Error('Failed to assign agent')
      }

      // Update agent's current chat count
      await supabase.rpc('increment_agent_chat_count', { agent_id: agentId })

      this.emitEvent({
        type: 'agent_joined',
        conversation_id: conversationId,
        user_id: agentId,
        data: { agent_id: agentId },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in assignAgentToConversation:', error)
      throw error
    }
  }

  async updateConversationStatus(conversationId: string, status: string): Promise<void> {
    try {
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'resolved' || status === 'closed' ? { resolved_at: new Date().toISOString() } : {})
        })
        .eq('id', conversationId)
        .select('agent_id')
        .single()

      if (error) {
        console.error('Error updating conversation status:', error)
        throw new Error('Failed to update conversation status')
      }

      // If closing conversation, update agent's chat count
      if ((status === 'closed' || status === 'resolved') && conversation.agent_id) {
        await supabase.rpc('decrement_agent_chat_count', { agent_id: conversation.agent_id })
      }
    } catch (error) {
      console.error('Error in updateConversationStatus:', error)
      throw error
    }
  }

  // Message Management
  async sendMessage(data: SendMessageData): Promise<ChatMessage> {
    try {
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: data.conversation_id,
          sender_id: data.sender_id,
          sender_type: data.sender_type,
          message: data.message,
          message_type: data.message_type || 'text',
          metadata: data.metadata
        })
        .select(`
          *,
          sender:users(id, email, profile:user_profiles(*))
        `)
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw new Error('Failed to send message')
      }

      // Update conversation's last message time
      await supabase
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.conversation_id)

      // Check for auto-responses if customer message
      if (data.sender_type === 'customer') {
        await this.checkAutoResponses(data.conversation_id, data.message)
      }

      return message
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    }
  }

  async getMessages(conversationId: string, limit?: number): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users(id, email, profile:user_profiles(*))
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching messages:', error)
        throw new Error('Failed to fetch messages')
      }

      return data || []
    } catch (error) {
      console.error('Error in getMessages:', error)
      throw error
    }
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('read_by, conversation_id')
        .eq('id', messageId)
        .single()

      if (fetchError) {
        console.error('Error fetching message:', fetchError)
        return
      }

      const readBy = message.read_by || []
      if (!readBy.includes(userId)) {
        readBy.push(userId)

        const { error } = await supabase
          .from('chat_messages')
          .update({ read_by: readBy })
          .eq('id', messageId)

        if (error) {
          console.error('Error marking message as read:', error)
        } else {
          this.emitEvent({
            type: 'read',
            conversation_id: message.conversation_id,
            user_id: userId,
            data: { message_id: messageId },
            timestamp: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error)
    }
  }

  // Agent Management
  async getAgents(filters?: { status?: string; specialty?: string }): Promise<ChatAgent[]> {
    try {
      let query = supabase
        .from('chat_agents')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*))
        `)
        .eq('is_active', true)

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.specialty) {
        query = query.contains('specialties', [filters.specialty])
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching agents:', error)
        throw new Error('Failed to fetch agents')
      }

      return data || []
    } catch (error) {
      console.error('Error in getAgents:', error)
      throw error
    }
  }

  async updateAgentStatus(agentId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_agents')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)

      if (error) {
        console.error('Error updating agent status:', error)
        throw new Error('Failed to update agent status')
      }
    } catch (error) {
      console.error('Error in updateAgentStatus:', error)
      throw error
    }
  }

  async getAvailableAgent(category?: string): Promise<ChatAgent | null> {
    try {
      let query = supabase
        .from('chat_agents')
        .select(`
          *,
          user:users(id, email, profile:user_profiles(*))
        `)
        .eq('status', 'online')
        .eq('is_active', true)
        .lt('current_chat_count', supabase.rpc('get_max_concurrent_chats'))

      if (category) {
        query = query.contains('specialties', [category])
      }

      query = query.order('current_chat_count', { ascending: true }).limit(1)

      const { data, error } = await query

      if (error) {
        console.error('Error finding available agent:', error)
        return null
      }

      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Error in getAvailableAgent:', error)
      return null
    }
  }

  // Auto Responses
  private async checkAutoResponses(conversationId: string, message: string): Promise<void> {
    try {
      const { data: autoResponses, error } = await supabase
        .from('chat_auto_responses')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error || !autoResponses) return

      const lowerMessage = message.toLowerCase()

      for (const autoResponse of autoResponses) {
        const hasKeyword = autoResponse.trigger_keywords.some((keyword: string) => 
          lowerMessage.includes(keyword.toLowerCase())
        )

        if (hasKeyword) {
          await this.sendMessage({
            conversation_id: conversationId,
            sender_id: 'bot',
            sender_type: 'bot',
            message: autoResponse.response_message,
            message_type: 'text'
          })
          break
        }
      }
    } catch (error) {
      console.error('Error checking auto responses:', error)
    }
  }

  // Conversation Routing
  private async handleConversationRouting(conversation: ChatConversation): Promise<void> {
    try {
      const availableAgent = await this.getAvailableAgent(conversation.category)
      
      if (availableAgent) {
        await this.assignAgentToConversation(conversation.id, availableAgent.id)
      } else {
        console.log(`No available agents. Adding conversation ${conversation.id} to queue.`)
      }
    } catch (error) {
      console.error('Error in conversation routing:', error)
    }
  }

  // Templates
  async getTemplates(filters?: { category?: string; created_by?: string }): Promise<ChatTemplate[]> {
    try {
      let query = supabase
        .from('chat_templates')
        .select('*')

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by)
      }

      query = query.order('usage_count', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching templates:', error)
        throw new Error('Failed to fetch templates')
      }

      return data || []
    } catch (error) {
      console.error('Error in getTemplates:', error)
      throw error
    }
  }

  async useTemplate(templateId: string): Promise<ChatTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('chat_templates')
        .update({
          usage_count: supabase.rpc('increment_usage', { template_id: templateId }),
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) {
        console.error('Error using template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in useTemplate:', error)
      throw error
    }
  }

  // Real-time Events
  addEventListener(event: string, callback: (event: ChatEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  removeEventListener(event: string, callback: (event: ChatEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emitEvent(event: ChatEvent): void {
    const listeners = this.eventListeners.get(event.type) || []
    listeners.forEach(callback => callback(event))

    const allListeners = this.eventListeners.get('all') || []
    allListeners.forEach(callback => callback(event))
  }

  // Typing Indicators
  async setTyping(conversationId: string, userId: string, userName: string, isTyping: boolean): Promise<void> {
    // Clear existing timeout for this user
    const timeoutKey = `${conversationId}-${userId}`
    const existingTimeout = this.typingTimeouts.get(timeoutKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.typingTimeouts.delete(timeoutKey)
    }

    this.emitEvent({
      type: 'typing',
      conversation_id: conversationId,
      user_id: userId,
      data: { user_name: userName, is_typing: isTyping },
      timestamp: new Date().toISOString()
    })

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        this.emitEvent({
          type: 'typing',
          conversation_id: conversationId,
          user_id: userId,
          data: { user_name: userName, is_typing: false },
          timestamp: new Date().toISOString()
        })
        this.typingTimeouts.delete(timeoutKey)
      }, 3000)
      
      this.typingTimeouts.set(timeoutKey, timeout)
    }
  }

  // File Upload
  async uploadFile(conversationId: string, file: File, uploadedBy: string): Promise<ChatMessage> {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `chat-files/${conversationId}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw new Error('Failed to upload file')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath)

      // Send message with file
      return await this.sendMessage({
        conversation_id: conversationId,
        sender_id: uploadedBy,
        sender_type: 'customer',
        message: `Uploaded file: ${file.name}`,
        message_type: 'file',
        metadata: {
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_path: filePath
        }
      })
    } catch (error) {
      console.error('Error in uploadFile:', error)
      throw error
    }
  }

  // Customer Feedback
  async submitFeedback(conversationId: string, customerId: string, rating: number, feedback?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_feedback')
        .insert({
          conversation_id: conversationId,
          customer_id: customerId,
          rating,
          feedback,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error submitting feedback:', error)
        throw new Error('Failed to submit feedback')
      }

      // Update agent rating if applicable
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('agent_id')
        .eq('id', conversationId)
        .single()

      if (conversation?.agent_id) {
        await supabase.rpc('update_agent_rating', {
          agent_id: conversation.agent_id,
          new_rating: rating
        })
      }
    } catch (error) {
      console.error('Error in submitFeedback:', error)
      throw error
    }
  }

  // Analytics
  async getChatAnalytics(startDate: string, endDate: string): Promise<any> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_chat_analytics', {
        start_date: startDate,
        end_date: endDate
      })

      if (error) {
        console.error('Error fetching analytics:', error)
        throw new Error('Failed to fetch analytics')
      }

      return analytics
    } catch (error) {
      console.error('Error in getChatAnalytics:', error)
      throw error
    }
  }
}

export const chatService = new ChatService()