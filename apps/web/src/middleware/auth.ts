import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface AuthUser {
  id: string
  email: string
  role?: string
  profile?: any
}

// Middleware to authenticate API requests
export async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean
  user?: AuthUser
  error?: string
}> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Missing or invalid authorization header'
      }
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return {
        authenticated: false,
        error: error?.message || 'Invalid token'
      }
    }
    
    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email!,
        role: profile?.role || 'customer',
        profile
      }
    }
    
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

// Middleware to check user roles
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest, user: AuthUser): Promise<{
    authorized: boolean
    error?: string
  }> => {
    if (!user.role) {
      return {
        authorized: false,
        error: 'User role not found'
      }
    }
    
    if (!allowedRoles.includes(user.role)) {
      return {
        authorized: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      }
    }
    
    return { authorized: true }
  }
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export function rateLimit(options: {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
}) {
  return (request: NextRequest): {
    allowed: boolean
    error?: string
    remaining?: number
  } => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowMs = options.windowMs
    
    // Get or create rate limit data for this IP
    let rateLimitData = rateLimitMap.get(ip)
    
    if (!rateLimitData || now - rateLimitData.lastReset > windowMs) {
      rateLimitData = { count: 0, lastReset: now }
      rateLimitMap.set(ip, rateLimitData)
    }
    
    // Increment request count
    rateLimitData.count++
    
    if (rateLimitData.count > options.maxRequests) {
      return {
        allowed: false,
        error: 'Rate limit exceeded',
        remaining: 0
      }
    }
    
    return {
      allowed: true,
      remaining: options.maxRequests - rateLimitData.count
    }
  }
}

// API key validation middleware
export function validateApiKey(request: NextRequest): {
  valid: boolean
  error?: string
} {
  const apiKey = request.headers.get('x-api-key')
  const validApiKeys = process.env.API_KEYS?.split(',') || []
  
  if (!apiKey) {
    return {
      valid: false,
      error: 'API key required'
    }
  }
  
  if (!validApiKeys.includes(apiKey)) {
    return {
      valid: false,
      error: 'Invalid API key'
    }
  }
  
  return { valid: true }
}

// CORS middleware
export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3010',
    'http://localhost:3000',
    'https://your-domain.com'
  ]
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  
  return null
}

// Request logging middleware
export function logRequest(request: NextRequest, user?: AuthUser) {
  const timestamp = new Date().toISOString()
  const method = request.method
  const url = request.url
  const userAgent = request.headers.get('user-agent')
  const ip = request.ip || request.headers.get('x-forwarded-for')
  
  console.log(`[${timestamp}] ${method} ${url}`, {
    ip,
    userAgent,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role
  })
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

// Combined middleware wrapper
export function withMiddleware(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    requireRoles?: string[]
    rateLimit?: { maxRequests: number; windowMs: number }
    requireApiKey?: boolean
    enableCors?: boolean
    logRequests?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Handle CORS
      if (options.enableCors) {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse
      }
      
      // Rate limiting
      if (options.rateLimit) {
        const rateLimitResult = rateLimit(options.rateLimit)(request)
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { error: rateLimitResult.error },
            { status: 429 }
          )
        }
      }
      
      // API key validation
      if (options.requireApiKey) {
        const apiKeyResult = validateApiKey(request)
        if (!apiKeyResult.valid) {
          return NextResponse.json(
            { error: apiKeyResult.error },
            { status: 401 }
          )
        }
      }
      
      let user: AuthUser | undefined
      
      // Authentication
      if (options.requireAuth) {
        const authResult = await authenticateRequest(request)
        if (!authResult.authenticated) {
          return NextResponse.json(
            { error: authResult.error },
            { status: 401 }
          )
        }
        user = authResult.user
      }
      
      // Role authorization
      if (options.requireRoles && user) {
        const roleCheck = await requireRole(options.requireRoles)(request, user)
        if (!roleCheck.authorized) {
          return NextResponse.json(
            { error: roleCheck.error },
            { status: 403 }
          )
        }
      }
      
      // Request logging
      if (options.logRequests) {
        logRequest(request, user)
      }
      
      // Execute the handler
      const response = await handler(request, { user })
      
      // Add security headers
      return addSecurityHeaders(response)
      
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Utility function to extract user from request context
export function getUserFromContext(context: any): AuthUser | null {
  return context?.user || null
}