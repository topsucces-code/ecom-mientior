export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'customer' | 'agent' | 'bot'
  message: string
  message_type: 'text' | 'image' | 'file' | 'system'
  metadata?: {
    file_url?: string
    file_name?: string
    file_size?: number
    image_url?: string
    system_action?: string
  }
  read_by: string[] // Array of user IDs who have read this message
  created_at: string
  updated_at: string
}

export interface ChatConversation {
  id: string
  customer_id: string
  agent_id?: string
  status: 'open' | 'assigned' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'general' | 'order_support' | 'technical' | 'billing' | 'product_inquiry'
  subject?: string
  tags: string[]
  created_at: string
  updated_at: string
  last_message_at: string
  customer_info: {
    name: string
    email: string
    avatar?: string
  }
  agent_info?: {
    name: string
    email: string
    avatar?: string
  }
  metadata?: {
    order_id?: string
    product_id?: string
    user_agent?: string
    referrer?: string
    session_id?: string
  }
}

export interface ChatAgent {
  id: string
  user_id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  is_active: boolean
  specialties: string[] // e.g., ['technical', 'billing', 'orders']
  max_concurrent_chats: number
  current_chat_count: number
  average_response_time: number // in seconds
  customer_rating: number
  total_chats_handled: number
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  conversation_id: string
  participant_ids: string[]
  started_at: string
  ended_at?: string
  duration?: number // in seconds
  satisfaction_rating?: number
  feedback?: string
}

export interface AutoResponse {
  id: string
  trigger_keywords: string[]
  response_message: string
  is_active: boolean
  category: string
  priority: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ChatNotification {
  id: string
  recipient_id: string
  type: 'new_message' | 'new_conversation' | 'assignment' | 'status_change'
  title: string
  message: string
  conversation_id: string
  read: boolean
  created_at: string
}

export interface ChatAnalytics {
  period: {
    start_date: string
    end_date: string
  }
  metrics: {
    total_conversations: number
    resolved_conversations: number
    average_response_time: number
    average_resolution_time: number
    customer_satisfaction: number
    first_response_rate: number
    resolution_rate: number
  }
  agent_performance: Array<{
    agent_id: string
    agent_name: string
    conversations_handled: number
    average_response_time: number
    customer_rating: number
    resolution_rate: number
  }>
  conversation_trends: Array<{
    date: string
    conversation_count: number
    resolution_count: number
    average_response_time: number
  }>
  category_breakdown: Array<{
    category: string
    conversation_count: number
    percentage: number
    average_resolution_time: number
  }>
}

export interface ChatWidget {
  id: string
  name: string
  settings: {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    theme: 'light' | 'dark' | 'custom'
    primary_color: string
    greeting_message: string
    offline_message: string
    show_agent_typing: boolean
    show_customer_typing: boolean
    enable_file_upload: boolean
    enable_emoji: boolean
    max_file_size: number // in MB
    allowed_file_types: string[]
    business_hours: {
      enabled: boolean
      timezone: string
      monday: { start: string; end: string; enabled: boolean }
      tuesday: { start: string; end: string; enabled: boolean }
      wednesday: { start: string; end: string; enabled: boolean }
      thursday: { start: string; end: string; enabled: boolean }
      friday: { start: string; end: string; enabled: boolean }
      saturday: { start: string; end: string; enabled: boolean }
      sunday: { start: string; end: string; enabled: boolean }
    }
    auto_responses: {
      enabled: boolean
      welcome_message: string
      offline_auto_response: string
      timeout_message: string
      timeout_minutes: number
    }
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatFile {
  id: string
  message_id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  thumbnail_url?: string
  uploaded_by: string
  created_at: string
}

// Event types for real-time chat
export interface ChatEvent {
  type: 'message' | 'typing' | 'read' | 'agent_joined' | 'agent_left' | 'status_change'
  conversation_id: string
  user_id: string
  data: any
  timestamp: string
}

// Typing indicator
export interface TypingIndicator {
  conversation_id: string
  user_id: string
  user_name: string
  is_typing: boolean
  timestamp: string
}

// Chat queue for managing incoming conversations
export interface ChatQueue {
  id: string
  conversation_id: string
  priority: number
  category: string
  estimated_wait_time: number
  position_in_queue: number
  created_at: string
}

// Customer feedback
export interface ChatFeedback {
  id: string
  conversation_id: string
  customer_id: string
  agent_id?: string
  rating: number // 1-5 stars
  feedback_text?: string
  categories: string[] // e.g., ['helpful', 'quick_response', 'knowledgeable']
  created_at: string
}

// Chat templates for quick responses
export interface ChatTemplate {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  usage_count: number
  created_by: string
  is_public: boolean
  created_at: string
  updated_at: string
}