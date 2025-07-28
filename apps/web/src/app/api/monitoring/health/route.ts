import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@ecommerce/shared'

interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  latency?: number
  error?: string
  metadata?: any
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: HealthCheck[]
  summary: {
    healthy: number
    unhealthy: number
    degraded: number
    total: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: HealthCheck[] = []
  
  // Check 1: Database Connection
  const dbCheck = await checkDatabase()
  checks.push(dbCheck)
  
  // Check 2: Core Tables
  const tablesCheck = await checkCoreTables()
  checks.push(tablesCheck)
  
  // Check 3: Extended Features
  const featuresCheck = await checkExtendedFeatures()
  checks.push(featuresCheck)
  
  // Check 4: Database Functions
  const functionsCheck = await checkDatabaseFunctions()
  checks.push(functionsCheck)
  
  // Check 5: Authentication System
  const authCheck = await checkAuthentication()
  checks.push(authCheck)
  
  // Check 6: File System
  const fsCheck = await checkFileSystem()
  checks.push(fsCheck)
  
  // Check 7: Memory Usage
  const memoryCheck = checkMemoryUsage()
  checks.push(memoryCheck)
  
  // Calculate summary
  const summary = {
    healthy: checks.filter(c => c.status === 'healthy').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    degraded: checks.filter(c => c.status === 'degraded').length,
    total: checks.length
  }
  
  // Determine overall status
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
  if (summary.unhealthy > 0) {
    overallStatus = 'unhealthy'
  } else if (summary.degraded > 0) {
    overallStatus = 'degraded'
  }
  
  const health: SystemHealth = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    summary
  }
  
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503
  
  return NextResponse.json(health, { status: statusCode })
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count(*)')
      .limit(1)
    
    const latency = Date.now() - startTime
    
    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        latency,
        error: error.message
      }
    }
    
    return {
      service: 'database',
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency,
      metadata: { connectionPool: 'active' }
    }
  } catch (err) {
    return {
      service: 'database',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

async function checkCoreTables(): Promise<HealthCheck> {
  const startTime = Date.now()
  const tables = ['categories', 'products', 'orders', 'user_profiles', 'cart_items']
  const results: { table: string; status: string }[] = []
  
  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1)
      results.push({
        table,
        status: error ? 'error' : 'ok'
      })
    }
    
    const latency = Date.now() - startTime
    const errorCount = results.filter(r => r.status === 'error').length
    
    if (errorCount > 0) {
      return {
        service: 'core-tables',
        status: errorCount === tables.length ? 'unhealthy' : 'degraded',
        latency,
        metadata: { tables: results }
      }
    }
    
    return {
      service: 'core-tables',
      status: 'healthy',
      latency,
      metadata: { tablesChecked: tables.length }
    }
  } catch (err) {
    return {
      service: 'core-tables',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

async function checkExtendedFeatures(): Promise<HealthCheck> {
  const startTime = Date.now()
  const tables = ['coupons', 'payments', 'notifications', 'search_history']
  const results: { table: string; status: string }[] = []
  
  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1)
      results.push({
        table,
        status: error ? 'error' : 'ok'
      })
    }
    
    const latency = Date.now() - startTime
    const errorCount = results.filter(r => r.status === 'error').length
    
    if (errorCount > 0) {
      return {
        service: 'extended-features',
        status: errorCount === tables.length ? 'unhealthy' : 'degraded',
        latency,
        metadata: { tables: results }
      }
    }
    
    return {
      service: 'extended-features',
      status: 'healthy',
      latency,
      metadata: { featuresAvailable: tables.length }
    }
  } catch (err) {
    return {
      service: 'extended-features',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

async function checkDatabaseFunctions(): Promise<HealthCheck> {
  const startTime = Date.now()
  const functions = ['apply_coupon', 'get_inventory_metrics', 'check_stock_alerts']
  const results: { function: string; status: string }[] = []
  
  try {
    for (const func of functions) {
      try {
        let rpcCall
        if (func === 'apply_coupon') {
          rpcCall = supabase.rpc(func, {
            coupon_code: 'HEALTH_CHECK',
            user_id: 'health-check-user',
            cart_total: 100,
            cart_items: '[]'
          })
        } else {
          rpcCall = supabase.rpc(func)
        }
        
        const { error } = await rpcCall
        results.push({
          function: func,
          status: error ? 'error' : 'ok'
        })
      } catch (err) {
        results.push({
          function: func,
          status: 'error'
        })
      }
    }
    
    const latency = Date.now() - startTime
    const errorCount = results.filter(r => r.status === 'error').length
    
    if (errorCount > 0) {
      return {
        service: 'database-functions',
        status: errorCount === functions.length ? 'unhealthy' : 'degraded',
        latency,
        metadata: { functions: results }
      }
    }
    
    return {
      service: 'database-functions',
      status: 'healthy',
      latency,
      metadata: { functionsChecked: functions.length }
    }
  } catch (err) {
    return {
      service: 'database-functions',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

async function checkAuthentication(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase.auth.getSession()
    const latency = Date.now() - startTime
    
    if (error) {
      return {
        service: 'authentication',
        status: 'unhealthy',
        latency,
        error: error.message
      }
    }
    
    return {
      service: 'authentication',
      status: 'healthy',
      latency,
      metadata: { sessionCheck: 'ok' }
    }
  } catch (err) {
    return {
      service: 'authentication',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

async function checkFileSystem(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Check if critical files exist
    const criticalFiles = [
      'package.json',
      '.env.local',
      'supabase/schema.sql'
    ]
    
    const results = criticalFiles.map(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file))
      return { file, exists }
    })
    
    const latency = Date.now() - startTime
    const missingFiles = results.filter(r => !r.exists)
    
    if (missingFiles.length > 0) {
      return {
        service: 'filesystem',
        status: 'degraded',
        latency,
        metadata: { missingFiles: missingFiles.map(f => f.file) }
      }
    }
    
    return {
      service: 'filesystem',
      status: 'healthy',
      latency,
      metadata: { filesChecked: criticalFiles.length }
    }
  } catch (err) {
    return {
      service: 'filesystem',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

function checkMemoryUsage(): HealthCheck {
  const startTime = Date.now()
  
  try {
    const memUsage = process.memoryUsage()
    const totalMem = memUsage.heapTotal
    const usedMem = memUsage.heapUsed
    const memoryUsagePercent = (usedMem / totalMem) * 100
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (memoryUsagePercent > 90) {
      status = 'unhealthy'
    } else if (memoryUsagePercent > 75) {
      status = 'degraded'
    }
    
    return {
      service: 'memory',
      status,
      latency: Date.now() - startTime,
      metadata: {
        heapUsed: Math.round(usedMem / 1024 / 1024) + ' MB',
        heapTotal: Math.round(totalMem / 1024 / 1024) + ' MB',
        usagePercent: Math.round(memoryUsagePercent) + '%',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      }
    }
  } catch (err) {
    return {
      service: 'memory',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}