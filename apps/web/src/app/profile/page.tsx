'use client'

import { useState, useEffect } from 'react'
import { Header } from '../../components/Header'
import { Button, Input } from '@ecommerce/ui'
import { useAuthStore } from '../../lib/auth-store'

export default function ProfilePage() {
  const { user, updateProfile, loading, initialize } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.first_name || '',
        lastName: user.profile?.last_name || '',
        email: user.email || '',
        phone: user.profile?.phone || ''
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone
      })
      
      setSuccess('Profile updated successfully!')
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.profile?.first_name || '',
        lastName: user.profile?.last_name || '',
        email: user.email || '',
        phone: user.profile?.phone || ''
      })
    }
    setEditing(false)
    setError('')
    setSuccess('')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Please sign in to view your profile
            </h1>
            <Button onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Profile Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {user.profile?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.profile?.first_name 
                      ? `${user.profile.first_name} ${user.profile.last_name}`
                      : user.email
                    }
                  </h1>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              
              {!editing && (
                <Button onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="px-6 py-8">
            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!editing}
                    className={!editing ? 'bg-gray-50' : ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!editing}
                    className={!editing ? 'bg-gray-50' : ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!editing}
                    className={!editing ? 'bg-gray-50' : ''}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {editing && (
                <div className="flex space-x-4 pt-6 border-t">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Account Settings */}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h3 className="font-medium text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600">View your past orders and their status</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/orders'}
              >
                View Orders
              </Button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h3 className="font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-600">Change your account password</p>
              </div>
              <Button
                variant="outline"
                onClick={() => alert('Password change functionality coming soon!')}
              >
                Change Password
              </Button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-gray-900">Email Preferences</h3>
                <p className="text-sm text-gray-600">Manage your email notifications</p>
              </div>
              <Button
                variant="outline"
                onClick={() => alert('Email preferences coming soon!')}
              >
                Manage
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}