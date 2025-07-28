'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  Calendar,
  Download,
  Star,
  User,
  Phone,
  Video,
  FileText,
  Tag,
  MoreVertical,
  Eye,
  MessageSquare,
  Activity,
  Zap,
  Target,
  Award
} from 'lucide-react'
import { 
  useChatStore, 
  useChatConversations, 
  useChatAgents,
  useChatUnreadCount 
} from '../lib/chat-store'
import { ChatAgent, ChatConversation, ChatAnalytics } from '@ecommerce/shared'
import { chatService } from '../lib/chat-service'

interface AgentDashboardProps {
  agentId: string
  agentInfo: {
    name: string
    email: string
    avatar?: string
  }
}

const AgentDashboard = memo(({ agentId, agentInfo }: AgentDashboardProps) => {
  const {
    setCurrentUser,
    loadConversations,
    loadAgents,
    selectConversation,
    updateAgentStatus,
    assignAgent,
    updateConversationStatus,
  } = useChatStore()

  const conversations = useChatConversations()
  const agents = useChatAgents()
  const totalUnreadCount = useChatUnreadCount()

  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null)
  const [currentAgent, setCurrentAgent] = useState<ChatAgent | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ChatAgent['status']>('online')
  const [conversationFilter, setConversationFilter] = useState<'all' | 'my_chats' | 'unassigned'>('my_chats')
  const [statusFilter, setStatusFilter] = useState<'all' | ChatConversation['status']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [showSettings, setShowSettings] = useState(false)

  // Initialize agent and load data
  useEffect(() => {
    setCurrentUser(agentId, 'agent')
    loadConversations()
    loadAgents()
    loadAnalytics()
  }, [agentId, setCurrentUser, loadConversations, loadAgents])

  // Find current agent from agents list
  useEffect(() => {
    const agent = agents.find(a => a.user_id === agentId)
    setCurrentAgent(agent || null)
  }, [agents, agentId])

  const loadAnalytics = useCallback(async () => {
    try {
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const data = await chatService.getChatAnalytics(startDate, endDate)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }, [])

  const handleStatusChange = useCallback(async (status: ChatAgent['status']) => {
    try {
      await updateAgentStatus(status)
      setSelectedStatus(status)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }, [updateAgentStatus])

  const handleTakeConversation = useCallback(async (conversationId: string) => {
    try {
      await assignAgent(conversationId, agentId)
      await selectConversation(conversationId)
    } catch (error) {
      console.error('Failed to take conversation:', error)
    }
  }, [assignAgent, agentId, selectConversation])

  const handleConversationStatusChange = useCallback(async (
    conversationId: string, 
    status: ChatConversation['status']
  ) => {
    try {
      await updateConversationStatus(conversationId, status)
    } catch (error) {
      console.error('Failed to update conversation status:', error)
    }
  }, [updateConversationStatus])

  // Filter conversations based on current filters
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer_info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer_info.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesConversationFilter = 
      conversationFilter === 'all' ||
      (conversationFilter === 'my_chats' && conv.agent_id === agentId) ||
      (conversationFilter === 'unassigned' && !conv.agent_id)
    
    const matchesStatusFilter = statusFilter === 'all' || conv.status === statusFilter

    return matchesSearch && matchesConversationFilter && matchesStatusFilter
  })

  // Get my conversations for statistics
  const myConversations = conversations.filter(conv => conv.agent_id === agentId)
  const activeConversations = myConversations.filter(conv => 
    conv.status === 'open' || conv.status === 'assigned'
  )

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

  const getAgentStatusColor = (status: ChatAgent['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                getAgentStatusColor(currentAgent?.status || 'offline')
              }`}></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {agentInfo.name}
              </h1>
              <p className="text-gray-600">Agent Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as ChatAgent['status'])}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Settings size={20} />
            </button>

            <div className="relative">
              <Bell size={20} className="text-gray-400" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Chats</p>
                  <p className="text-3xl font-bold text-gray-900">{activeConversations.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle size={24} className="text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {currentAgent?.max_concurrent_chats || 5} max concurrent
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {currentAgent?.average_response_time || 45}s
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock size={24} className="text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">↓ 12% from yesterday</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer Rating</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {currentAgent?.customer_rating?.toFixed(1) || '4.8'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-yellow-600">★★★★★</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Chats Handled</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {currentAgent?.total_chats_handled || 1250}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target size={24} className="text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600">All time</span>
              </div>
            </div>
          </div>

          {/* Conversations Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                <div className="flex items-center gap-3">
                  <select
                    value={conversationFilter}
                    onChange={(e) => setConversationFilter(e.target.value as typeof conversationFilter)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Conversations</option>
                    <option value="my_chats">My Chats</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No conversations found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredConversations.map((conversation) => (
                    <div key={conversation.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <User size={20} className="text-gray-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {conversation.customer_info.name}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                                {conversation.status}
                              </span>
                              <span className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                                {conversation.priority}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-1">
                              {conversation.subject || conversation.category}
                            </p>
                            
                            <p className="text-xs text-gray-500">
                              {conversation.customer_info.email} • {formatDate(conversation.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!conversation.agent_id && conversationFilter !== 'my_chats' && (
                            <button
                              onClick={() => handleTakeConversation(conversation.id)}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                            >
                              Take
                            </button>
                          )}
                          
                          {conversation.agent_id === agentId && (
                            <select
                              value={conversation.status}
                              onChange={(e) => handleConversationStatusChange(
                                conversation.id, 
                                e.target.value as ChatConversation['status']
                              )}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="open">Open</option>
                              <option value="assigned">Assigned</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          )}
                          
                          <button
                            onClick={() => selectConversation(conversation.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analytics Section */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Conversations</span>
                    <span className="font-medium">{analytics.metrics.total_conversations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resolved Conversations</span>
                    <span className="font-medium">{analytics.metrics.resolved_conversations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resolution Rate</span>
                    <span className="font-medium">
                      {(analytics.metrics.resolution_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Customer Satisfaction</span>
                    <span className="font-medium">{analytics.metrics.customer_satisfaction}/5</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
                <div className="space-y-3">
                  {analytics.agent_performance.slice(0, 5).map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{agent.agent_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{agent.customer_rating.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">{agent.conversations_handled} chats</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Unassigned Chats</h4>
              <p className="text-sm text-blue-700 mb-3">
                {conversations.filter(c => !c.agent_id).length} conversations waiting
              </p>
              <button
                onClick={() => setConversationFilter('unassigned')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All
              </button>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">Urgent Priority</h4>
              <p className="text-sm text-yellow-700 mb-3">
                {conversations.filter(c => c.priority === 'urgent').length} urgent conversations
              </p>
              <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                Handle Urgent
              </button>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Knowledge Base</h4>
              <p className="text-sm text-green-700 mb-3">
                Access help articles and templates
              </p>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Browse KB
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="font-medium text-gray-900 mb-4">Online Agents</h4>
            <div className="space-y-3">
              {agents.filter(agent => agent.status === 'online').map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.current_chat_count}/{agent.max_concurrent_chats} chats</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 m-4 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold mb-4">Agent Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Concurrent Chats
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={currentAgent?.max_concurrent_chats || 5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="space-y-2">
                  {['general', 'technical', 'billing', 'order_support', 'product_inquiry'].map((specialty) => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={currentAgent?.specialties.includes(specialty)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {specialty.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
})

AgentDashboard.displayName = 'AgentDashboard'

export default AgentDashboard