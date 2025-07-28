'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import LoginForm from '../../components/auth/LoginForm'
import RegisterForm from '../../components/auth/RegisterForm'
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'

type AuthMode = 'login' | 'register' | 'forgot-password'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>('login')

  useEffect(() => {
    // Get mode from URL params
    const modeParam = searchParams?.get('mode') as AuthMode
    if (modeParam && ['login', 'register', 'forgot-password'].includes(modeParam)) {
      setMode(modeParam)
    }
  }, [searchParams])

  useEffect(() => {
    // Redirect if already authenticated
    if (user && !loading) {
      const redirectTo = searchParams?.get('redirect') || '/dashboard'
      window.location.href = redirectTo
    }
  }, [user, loading, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  const formVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.div
                  key="login"
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm
                    onSwitchToRegister={() => setMode('register')}
                    onForgotPassword={() => setMode('forgot-password')}
                  />
                </motion.div>
              )}

              {mode === 'register' && (
                <motion.div
                  key="register"
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <RegisterForm
                    onSwitchToLogin={() => setMode('login')}
                  />
                </motion.div>
              )}

              {mode === 'forgot-password' && (
                <motion.div
                  key="forgot-password"
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <ForgotPasswordForm
                    onBack={() => setMode('login')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side - Hero */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 to-purple-800 items-center justify-center px-12">
          <div className="text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold mb-6">
                Welcome to Our Marketplace
              </h1>
              <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                Discover amazing products from trusted vendors around the world. 
                Join thousands of satisfied customers and start shopping today.
              </p>
              
              <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Global Marketplace</h3>
                    <p className="text-purple-200 text-sm">Shop from vendors worldwide</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Secure Payments</h3>
                    <p className="text-purple-200 text-sm">Safe and secure transactions</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Smart Recommendations</h3>
                    <p className="text-purple-200 text-sm">AI-powered product suggestions</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-purple-700 rounded-lg">
                <h4 className="font-semibold mb-2">24/7 Customer Support</h4>
                <p className="text-purple-200 text-sm">
                  Our live chat support team is always ready to help you with any questions or issues.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Hero */}
      <div className="lg:hidden bg-purple-600 text-white text-center py-8 px-4">
        <h2 className="text-2xl font-bold mb-2">Welcome to Our Marketplace</h2>
        <p className="text-purple-100">Join thousands of satisfied customers worldwide</p>
      </div>
    </div>
  )
}