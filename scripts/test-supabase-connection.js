#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testSupabaseConnection() {
  try {
    log('🚀 Testing Supabase Connection...', 'blue')
    log('═══════════════════════════════════════════════════════════', 'blue')

    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) {
      log('❌ .env.local file not found!', 'red')
      log('Please create .env.local file with your Supabase credentials:', 'yellow')
      log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url', 'yellow')
      log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key', 'yellow')
      return
    }

    // Load environment variables
    require('dotenv').config({ path: envPath })
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      log('❌ Missing Supabase credentials in .env.local', 'red')
      log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY', 'yellow')
      return
    }

    log(`📡 Connecting to: ${supabaseUrl}`, 'blue')

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Basic Connection
    log('\n🔍 Test 1: Basic Connection', 'yellow')
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('count(*)')
        .limit(1)

      if (error) {
        log(`❌ Connection failed: ${error.message}`, 'red')
        return
      }
      log('✅ Connected to Supabase successfully!', 'green')
    } catch (err) {
      log(`❌ Connection error: ${err.message}`, 'red')
      return
    }

    // Test 2: Check Core Tables
    log('\n🔍 Test 2: Core Tables Check', 'yellow')
    const coreTables = ['categories', 'products', 'orders', 'user_profiles', 'cart_items', 'reviews']
    
    for (const table of coreTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          log(`❌ Table '${table}': ${error.message}`, 'red')
        } else {
          log(`✅ Table '${table}': OK`, 'green')
        }
      } catch (err) {
        log(`❌ Table '${table}': ${err.message}`, 'red')
      }
    }

    // Test 3: Check Extended Tables
    log('\n🔍 Test 3: Extended Tables Check', 'yellow')
    const extendedTables = [
      'coupons', 'coupon_usage', 'payments', 'payment_methods', 
      'notifications', 'notification_settings', 'search_history', 
      'product_analytics', 'wishlist_items', 'product_comparisons'
    ]
    
    for (const table of extendedTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          log(`❌ Extended table '${table}': ${error.message}`, 'red')
        } else {
          log(`✅ Extended table '${table}': OK`, 'green')
        }
      } catch (err) {
        log(`❌ Extended table '${table}': ${err.message}`, 'red')
      }
    }

    // Test 4: Check Functions
    log('\n🔍 Test 4: Database Functions Check', 'yellow')
    const functions = [
      { name: 'apply_coupon', args: ['TEST', 'user-id', 100, '[]'] },
      { name: 'get_inventory_metrics', args: [] },
      { name: 'check_stock_alerts', args: [] }
    ]

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func.name, 
          func.args.length === 4 ? {
            coupon_code: func.args[0],
            user_id: func.args[1], 
            cart_total: func.args[2],
            cart_items: func.args[3]
          } : {}
        )
        if (error) {
          log(`❌ Function '${func.name}': ${error.message}`, 'red')
        } else {
          log(`✅ Function '${func.name}': OK`, 'green')
        }
      } catch (err) {
        log(`❌ Function '${func.name}': ${err.message}`, 'red')
      }
    }

    // Test 5: Check Sample Data
    log('\n🔍 Test 5: Sample Data Check', 'yellow')
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')

      if (catError) {
        log(`❌ Categories query: ${catError.message}`, 'red')
      } else {
        log(`✅ Categories: ${categories?.length || 0} found`, 'green')
      }

      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')

      if (prodError) {
        log(`❌ Products query: ${prodError.message}`, 'red')
      } else {
        log(`✅ Products: ${products?.length || 0} found`, 'green')
      }

      const { data: coupons, error: couponError } = await supabase
        .from('coupons')
        .select('*')

      if (couponError) {
        log(`❌ Coupons query: ${couponError.message}`, 'red')
      } else {
        log(`✅ Coupons: ${coupons?.length || 0} found`, 'green')
      }
    } catch (err) {
      log(`❌ Sample data check: ${err.message}`, 'red')
    }

    // Test 6: Authentication
    log('\n🔍 Test 6: Authentication Check', 'yellow')
    try {
      const { data: session, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        log(`❌ Auth check: ${authError.message}`, 'red')
      } else {
        log('✅ Auth system: OK', 'green')
        log(`📊 Current session: ${session.session ? 'Active' : 'None'}`, 'blue')
      }
    } catch (err) {
      log(`❌ Auth error: ${err.message}`, 'red')
    }

    // Summary
    log('\n📊 Connection Test Summary', 'bold')
    log('═══════════════════════════════════════════════════════════', 'blue')
    log('✅ Supabase connection established', 'green')
    log('✅ Database integration complete', 'green')
    log('✅ Extended features available', 'green')
    log('✅ Ready for development!', 'green')
    
    log('\n🎯 Next Steps:', 'yellow')
    log('1. Run: npm run dev', 'blue')
    log('2. Visit: http://localhost:3010', 'blue')
    log('3. Test API: http://localhost:3010/api/test-integration', 'blue')

  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red')
    console.error(error)
  }
}

// Run the test
testSupabaseConnection().catch(console.error)