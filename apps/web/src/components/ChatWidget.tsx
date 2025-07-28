'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Star
} from 'lucide-react'
import { 
  useChatStore, 
  useChatMessages, 
  useChatConversations, 
  useTypingIndicators,
  useChatUnreadCount 
} from '../lib/chat-store'
import { ChatMessage, ChatConversation } from '@ecommerce/shared'

interface ChatWidgetProps {
  customerId: string
  customerInfo: {
    name: string
    email: string
    avatar?: string
  }
  position?: 'bottom-right' | 'bottom-left'
  theme?: 'light' | 'dark'
  primaryColor?: string
}

const ChatWidget = memo(({
  customerId,
  customerInfo,
  position = 'bottom-right',
  theme = 'light',
  primaryColor = '#8B5CF6'
}: ChatWidgetProps) => {
  const {
    isChatWidgetOpen,
    isChatWindowMinimized,
    selectedConversationId,
    currentConversationId,
    conversationsLoading,
    messagesLoading,
    setCurrentUser,
    toggleChatWidget,
    openChatWindow,
    minimizeChatWindow,
    createConversation,
    selectConversation,
    sendMessage,
    setTyping,
    markAsRead,
    submitFeedback,
  } = useChatStore()

  const conversations = useChatConversations()
  const messages = useChatMessages(selectedConversationId || '')
  const typingIndicators = useTypingIndicators(selectedConversationId || '')
  const totalUnreadCount = useChatUnreadCount()

  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showStartConversation, setShowStartConversation] = useState(false)
  const [conversationTopic, setConversationTopic] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ChatConversation['category']>('general')
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize user on mount
  useEffect(() => {
    setCurrentUser(customerId, 'customer')
  }, [customerId, setCurrentUser])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-focus message input when chat opens
  useEffect(() => {
    if (isChatWidgetOpen && !isChatWindowMinimized && messageInputRef.current) {
      messageInputRef.current.focus()
    }
  }, [isChatWidgetOpen, isChatWindowMinimized])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleOpenChat = useCallback(() => {
    if (!isChatWidgetOpen) {
      toggleChatWidget()
    }

    // If no conversations exist, show start conversation form
    if (conversations.length === 0) {
      setShowStartConversation(true)
    } else {
      // Select the most recent conversation
      const recentConversation = conversations[0]
      if (recentConversation) {
        selectConversation(recentConversation.id)
      }
    }
  }, [isChatWidgetOpen, toggleChatWidget, conversations, selectConversation])

  const handleStartConversation = useCallback(async () => {
    if (!conversationTopic.trim()) return

    try {
      const conversation = await createConversation({
        customer_id: customerId,
        category: selectedCategory,
        priority: 'medium',
        initial_message: conversationTopic,
        customer_info: customerInfo,
        metadata: {
          session_id: Date.now().toString(),
          user_agent: navigator.userAgent,
        },
      })

      setShowStartConversation(false)
      setConversationTopic('')
      selectConversation(conversation.id)
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }, [conversationTopic, selectedCategory, customerId, customerInfo, createConversation, selectConversation])

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversationId) return

    const message = messageInput.trim()
    setMessageInput('')

    try {
      await sendMessage({
        conversation_id: selectedConversationId,
        sender_id: customerId,
        sender_type: 'customer',
        message,
        message_type: 'text',
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessageInput(message) // Restore message on error
    }
  }, [messageInput, selectedConversationId, customerId, sendMessage])

  const handleTyping = useCallback(() => {
    if (!selectedConversationId) return

    if (!isTyping) {
      setIsTyping(true)
      setTyping(selectedConversationId, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
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

  const handleSubmitFeedback = useCallback(async () => {
    if (!selectedConversationId || feedbackRating === 0) return

    try {
      await submitFeedback(selectedConversationId, customerId, feedbackRating, feedbackText)
      setShowFeedback(false)
      setFeedbackRating(0)
      setFeedbackText('')
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }, [selectedConversationId, customerId, feedbackRating, feedbackText, submitFeedback])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4'

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      <AnimatePresence>
        {!isChatWidgetOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleOpenChat}
            className="relative bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle size={24} />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </motion.button>
        )}

        {isChatWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isChatWindowMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`bg-white rounded-lg shadow-2xl w-80 border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b rounded-t-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="text-white">
                  <h3 className="font-semibold">Customer Support</h3>
                  <p className="text-xs opacity-90">We're here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={minimizeChatWindow}
                  className="text-white hover:bg-white/20 p-1 rounded"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  onClick={toggleChatWidget}
                  className="text-white hover:bg-white/20 p-1 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isChatWindowMinimized && (
              <>
                {/* Start Conversation Form */}
                {showStartConversation ? (
                  <div className="p-4 space-y-4">
                    <h4 className="font-semibold text-gray-900">Start a conversation</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What can we help you with?
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as ChatConversation['category'])}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="general">General Support</option>
                        <option value="order_support">Order Support</option>
                        <option value="technical">Technical Issues</option>
                        <option value="billing">Billing Questions</option>
                        <option value="product_inquiry">Product Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe your issue
                      </label>
                      <textarea
                        value={conversationTopic}
                        onChange={(e) => setConversationTopic(e.target.value)}
                        placeholder="Please describe what you need help with..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowStartConversation(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStartConversation}
                        disabled={!conversationTopic.trim()}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Start Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="h-80 overflow-y-auto p-4 space-y-4">
                      {conversationsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-sm">Start a conversation to get help</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                  message.sender_type === 'customer'
                                    ? 'bg-purple-600 text-white'
                                    : message.sender_type === 'bot'
                                    ? 'bg-gray-100 text-gray-800 border'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                style={
                                  message.sender_type === 'customer' 
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                              >
                                <p className="text-sm">{message.message}</p>
                                <span className="text-xs opacity-75 mt-1 block">
                                  {formatTime(message.created_at)}
                                </span>
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
                    {selectedConversationId && (
                      <div className="border-t p-4">
                        <div className="flex items-end gap-2">
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
                              rows={1}
                            />
                          </div>
                          <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Send size={16} />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <Paperclip size={16} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <Smile size={16} />
                            </button>
                          </div>
                          <button
                            onClick={() => setShowFeedback(true)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Rate this conversation
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    {!selectedConversationId && conversations.length === 0 && (
                      <div className="p-4 border-t">
                        <button
                          onClick={() => setShowStartConversation(true)}
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Start New Conversation
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Feedback Modal */}
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 m-4 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`p-1 ${
                      star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star size={24} fill="currentColor" />
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us about your experience (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackRating === 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

ChatWidget.displayName = 'ChatWidget'

export default ChatWidget