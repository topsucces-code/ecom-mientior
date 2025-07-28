'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  Maximize2,
  Minimize2,
  Paperclip,
  Smile,
  Search,
  Filter,
  Clock,
  User,
  Star,
  FileText,
  Phone,
  Video,
  MoreVertical,
  Archive,
  Trash2,
  Tag,
  AlertCircle,
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react'
import { 
  useChatStore, 
  useChatMessages, 
  useChatConversations, 
  useChatAgents,
  useChatTemplates,
  useTypingIndicators,
  useChatUnreadCount 
} from '../lib/chat-store'
import { ChatMessage, ChatConversation, ChatAgent, ChatTemplate } from '@ecommerce/shared'

interface ChatWindowProps {
  userId: string
  userType: 'customer' | 'agent'
  userInfo: {
    name: string
    email: string
    avatar?: string
  }
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onClose?: () => void
}

const ChatWindow = memo(({
  userId,
  userType,
  userInfo,
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}: ChatWindowProps) => {
  const {
    conversations,
    selectedConversationId,
    conversationsLoading,
    messagesLoading,
    setCurrentUser,
    loadConversations,
    selectConversation,
    sendMessage,
    setTyping,
    markAsRead,
    assignAgent,
    updateConversationStatus,
    loadAgents,
    loadTemplates,
    useTemplate,
    submitFeedback,
  } = useChatStore()

  const messages = useChatMessages(selectedConversationId || '')
  const agents = useChatAgents()
  const templates = useChatTemplates()
  const typingIndicators = useTypingIndicators(selectedConversationId || '')

  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | ChatConversation['status']>('all')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showConversationInfo, setShowConversationInfo] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ChatTemplate | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize user and load data
  useEffect(() => {
    setCurrentUser(userId, userType)
    loadConversations()
    if (userType === 'agent') {
      loadAgents()
      loadTemplates()
    }
  }, [userId, userType, setCurrentUser, loadConversations, loadAgents, loadTemplates])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-focus message input
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus()
    }
  }, [selectedConversationId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversationId) return

    const message = messageInput.trim()
    setMessageInput('')

    try {
      await sendMessage({
        conversation_id: selectedConversationId,
        sender_id: userId,
        sender_type: userType,
        message,
        message_type: 'text',
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessageInput(message)
    }
  }, [messageInput, selectedConversationId, userId, userType, sendMessage])

  const handleTyping = useCallback(() => {
    if (!selectedConversationId) return

    if (!isTyping) {
      setIsTyping(true)
      setTyping(selectedConversationId, true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTyping(selectedConversationId, false)
    }, 2000)
  }, [selectedConversationId, isTyping, setTyping])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleUseTemplate = useCallback(async (template: ChatTemplate) => {
    if (!selectedConversationId) return

    try {
      await useTemplate(template.id, selectedConversationId)
      setShowTemplates(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to use template:', error)
    }
  }, [selectedConversationId, useTemplate])

  const handleAssignAgent = useCallback(async (agentId: string) => {
    if (!selectedConversationId) return

    try {
      await assignAgent(selectedConversationId, agentId)
    } catch (error) {
      console.error('Failed to assign agent:', error)
    }
  }, [selectedConversationId, assignAgent])

  const handleStatusChange = useCallback(async (status: ChatConversation['status']) => {
    if (!selectedConversationId) return

    try {
      await updateConversationStatus(selectedConversationId, status)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }, [selectedConversationId, updateConversationStatus])

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer_info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer_info.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || conv.status === selectedFilter

    return matchesSearch && matchesFilter
  })

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId)

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const getStatusColor = (status: ChatConversation['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: ChatConversation['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`flex h-full bg-white ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <div className="flex items-center gap-2">
              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as typeof selectedFilter)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConversationId === conversation.id
                      ? 'bg-purple-50 border-purple-200 border'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">
                          {conversation.customer_info.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {conversation.customer_info.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </span>
                      <span className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                        {conversation.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-sm text-gray-800 font-medium">
                      {conversation.subject || conversation.category}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {/* Last message preview would go here */}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(conversation.last_message_at)}</span>
                    <div className="flex items-center gap-2">
                      {conversation.agent_info && (
                        <span>Agent: {conversation.agent_info.name}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.customer_info.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.subject || selectedConversation.category}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {userType === 'agent' && (
                    <>
                      <button
                        onClick={() => setShowTemplates(true)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Quick Templates"
                      >
                        <FileText size={16} />
                      </button>
                      
                      <select
                        value={selectedConversation.status}
                        onChange={(e) => handleStatusChange(e.target.value as ChatConversation['status'])}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </>
                  )}

                  <button
                    onClick={() => setShowConversationInfo(!showConversationInfo)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === userType ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className="max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.sender_type === userType
                              ? 'bg-purple-600 text-white'
                              : message.sender_type === 'bot'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{formatTime(message.created_at)}</span>
                          {message.sender_type !== userType && (
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              {message.read_by.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicators */}
                  {typingIndicators.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {typingIndicators[0].user_name} is typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value)
                      handleTyping()
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Paperclip size={16} />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Info Sidebar */}
      {showConversationInfo && selectedConversation && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Customer Info</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {selectedConversation.customer_info.name}</p>
                <p><span className="font-medium">Email:</span> {selectedConversation.customer_info.email}</p>
                <p><span className="font-medium">Category:</span> {selectedConversation.category}</p>
                <p><span className="font-medium">Priority:</span> {selectedConversation.priority}</p>
              </div>
            </div>

            {selectedConversation.agent_info && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Assigned Agent</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedConversation.agent_info.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedConversation.agent_info.email}</p>
                </div>
              </div>
            )}

            {userType === 'agent' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  <select
                    onChange={(e) => e.target.value && handleAssignAgent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    defaultValue=""
                  >
                    <option value="">Assign to Agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Created:</span> {formatDate(selectedConversation.created_at)}</p>
                <p><span className="font-medium">Last Message:</span> {formatDate(selectedConversation.last_message_at)}</p>
                <p><span className="font-medium">Updated:</span> {formatDate(selectedConversation.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
          onClick={() => setShowTemplates(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 m-4 max-w-2xl w-full max-h-96 overflow-y-auto"
          >
            <h3 className="text-lg font-semibold mb-4">Quick Templates</h3>
            
            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <h4 className="font-medium text-gray-900">{template.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Used {template.usage_count} times
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
})

ChatWindow.displayName = 'ChatWindow'

export default ChatWindow