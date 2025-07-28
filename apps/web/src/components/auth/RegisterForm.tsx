'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Building, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { RegisterData, UserRole } from '../../lib/supabase/auth'

interface RegisterFormProps {
  onSwitchToLogin: () => void
  redirectTo?: string
}

export default function RegisterForm({ 
  onSwitchToLogin,
  redirectTo = '/dashboard'
}: RegisterFormProps) {
  const { signUp, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'customer',
  })
  const [vendorInfo, setVendorInfo] = useState({
    businessName: '',
    businessType: 'individual' as 'individual' | 'business' | 'corporation',
    description: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    if (formData.role === 'vendor') {
      if (!vendorInfo.businessName || !vendorInfo.description) {
        setError('Please fill in all vendor information')
        return
      }
    }

    try {
      const registerData: RegisterData = {
        ...formData,
        ...(formData.role === 'vendor' ? { vendorInfo } : {})
      }

      await signUp(registerData)
      
      // Redirect will be handled by the auth state change
      router.push(redirectTo)
    } catch (error: any) {
      setError(error.message || 'Failed to create account')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name.startsWith('vendor.')) {
      const field = name.replace('vendor.', '')
      setVendorInfo(prev => ({ ...prev, [field]: value }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/\d/)) strength++
    if (password.match(/[^a-zA-Z\d]/)) strength++
    return strength
  }

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: 'Weak', color: 'text-red-600' }
      case 2:
        return { text: 'Fair', color: 'text-yellow-600' }
      case 3:
        return { text: 'Good', color: 'text-blue-600' }
      case 4:
        return { text: 'Strong', color: 'text-green-600' }
      default:
        return { text: 'Weak', color: 'text-red-600' }
    }
  }

  const strength = passwordStrength(formData.password)
  const strengthInfo = getPasswordStrengthText(strength)

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">Join our marketplace today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </motion.div>
        )}

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Account Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['customer', 'vendor', 'agent'] as UserRole[]).map((role) => (
              <label
                key={role}
                className={`relative flex cursor-pointer rounded-lg border p-3 focus:outline-none ${
                  formData.role === role
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex flex-col items-center text-center">
                  {role === 'customer' && <User size={20} className="text-gray-600 mb-1" />}
                  {role === 'vendor' && <Building size={20} className="text-gray-600 mb-1" />}
                  {role === 'agent' && <User size={20} className="text-gray-600 mb-1" />}
                  <span className="text-sm font-medium capitalize">{role}</span>
                </div>
                {formData.role === role && (
                  <CheckCircle size={16} className="absolute top-2 right-2 text-purple-600" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="John"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={20} className="text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={20} className="text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className={`text-xs font-medium ${strengthInfo.color}`}>
                  {strengthInfo.text}
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strength <= 1 ? 'bg-red-500' :
                    strength === 2 ? 'bg-yellow-500' :
                    strength === 3 ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(strength / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={20} className="text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {confirmPassword && formData.password !== confirmPassword && (
            <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
          )}
        </div>

        {/* Vendor Information */}
        {formData.role === 'vendor' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 border-t pt-6"
          >
            <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
            
            <div>
              <label htmlFor="vendor.businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                id="vendor.businessName"
                name="vendor.businessName"
                type="text"
                required
                value={vendorInfo.businessName}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Your Business Name"
              />
            </div>

            <div>
              <label htmlFor="vendor.businessType" className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                id="vendor.businessType"
                name="vendor.businessType"
                value={vendorInfo.businessType}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="corporation">Corporation</option>
              </select>
            </div>

            <div>
              <label htmlFor="vendor.description" className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                id="vendor.description"
                name="vendor.description"
                rows={3}
                required
                value={vendorInfo.description}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us about your business..."
              />
            </div>
          </motion.div>
        )}

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="acceptTerms" className="text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-purple-600 hover:text-purple-500">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-purple-600 hover:text-purple-500">
                Privacy Policy
              </a>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !acceptTerms}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span className="ml-2">Creating account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>

        <div className="text-center">
          <span className="text-gray-600">Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-purple-600 hover:text-purple-500 font-medium"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  )
}