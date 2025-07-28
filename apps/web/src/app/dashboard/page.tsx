'use client'

import { useAuth } from '../../hooks/useAuth'
import ProtectedRoute from '../../components/auth/ProtectedRoute'
import CustomerDashboard from '../../components/dashboard/CustomerDashboard'
import VendorDashboard from '../../components/VendorDashboard'
import AgentDashboard from '../../components/AgentDashboard'
import AdminDashboard from '../../components/dashboard/AdminDashboard'

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    if (!user) return null

    switch (user.role) {
      case 'customer':
        return (
          <CustomerDashboard 
            customerId={user.id}
            customerInfo={{
              name: `${user.profile.first_name} ${user.profile.last_name}`,
              email: user.email,
              avatar: user.profile.avatar_url || undefined
            }}
          />
        )
      
      case 'vendor':
        return (
          <VendorDashboard 
            vendorId={user.id}
            vendorInfo={{
              name: `${user.profile.first_name} ${user.profile.last_name}`,
              email: user.email,
              avatar: user.profile.avatar_url || undefined
            }}
          />
        )
      
      case 'agent':
        return (
          <AgentDashboard 
            agentId={user.id}
            agentInfo={{
              name: `${user.profile.first_name} ${user.profile.last_name}`,
              email: user.email,
              avatar: user.profile.avatar_url || undefined
            }}
          />
        )
      
      case 'admin':
        return (
          <AdminDashboard 
            adminId={user.id}
            adminInfo={{
              name: `${user.profile.first_name} ${user.profile.last_name}`,
              email: user.email,
              avatar: user.profile.avatar_url || undefined
            }}
          />
        )
      
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600">
                Your account role is not recognized. Please contact support.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <ProtectedRoute>
      {renderDashboard()}
    </ProtectedRoute>
  )
}