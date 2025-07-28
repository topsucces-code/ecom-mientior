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

async function executeSQLScript() {
  try {
    log('🚀 Executing SQL Script: add-more-products.sql', 'blue')
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

    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'supabase', 'add-more-products.sql')
    if (!fs.existsSync(sqlPath)) {
      log('❌ SQL script not found: supabase/add-more-products.sql', 'red')
      return
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    log('✅ SQL script loaded successfully', 'green')
    log(`📄 Script size: ${sqlContent.length} characters`, 'blue')

    // Test connection first
    log('\n🔍 Testing connection...', 'yellow')
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('*')
      .limit(1)

    if (testError) {
      log(`❌ Connection failed: ${testError.message}`, 'red')
      return
    }
    log('✅ Connection successful!', 'green')

    // Execute the SQL script using RPC
    log('\n🚀 Executing SQL script...', 'yellow')
    
    // Since Supabase client doesn't directly support executing raw SQL,
    // we'll use the RPC method if available, or break down the script
    
    // For this specific script, let's execute it by parsing the content
    // and executing individual INSERT statements
    
    // Extract individual statements (simplified approach)
    const statements = sqlContent
      .split('INSERT INTO public.products')
      .filter(stmt => stmt.trim().length > 0)
      .slice(1) // Remove the first empty element
      .map(stmt => 'INSERT INTO public.products' + stmt.split(';')[0] + ';')

    log(`📊 Found ${statements.length} product INSERT statements`, 'blue')

    let successCount = 0
    let errorCount = 0

    // Since we can't execute raw SQL directly, let's check if products exist
    // and provide feedback about the script content
    
    log('\n📋 Script Analysis:', 'yellow')
    log('- Electronics: iPad Air, RGB Keyboard, 4K Monitor, Webcam, Wireless Charger', 'blue')
    log('- Clothing: Premium Hoodie, Running Sneakers, Leather Jacket, Summer Dress', 'blue')
    log('- Home & Decor: LED Desk Lamp, Velvet Cushions, Artificial Monstera, Berber Rug', 'blue')
    log('- Books: Digital Photography Guide, Fantasy Trilogy', 'blue')
    log('- Accessories: Bluetooth Speaker, Urban Backpack, Coffee Kit, Aviator Sunglasses', 'blue')

    // Check current product count
    const { data: currentProducts, error: countError } = await supabase
      .from('products')
      .select('id, name, sku')

    if (countError) {
      log(`❌ Could not count current products: ${countError.message}`, 'red')
    } else {
      log(`\n📊 Current products in database: ${currentProducts?.length || 0}`, 'blue')
    }

    // Since we can't execute the full SQL script directly through the JS client,
    // provide instructions for manual execution
    log('\n🔧 Manual Execution Required:', 'yellow')
    log('═══════════════════════════════════════════════════════════', 'yellow')
    log('The SQL script contains complex DO blocks that need to be executed', 'blue')
    log('directly in the Supabase SQL Editor. Follow these steps:', 'blue')
    log('', 'reset')
    log('1. Go to your Supabase Dashboard', 'green')
    log('2. Navigate to SQL Editor', 'green')
    log('3. Create a new query', 'green')
    log('4. Copy the content from: supabase/add-more-products.sql', 'green')
    log('5. Paste and run the query', 'green')
    log('', 'reset')
    log('📝 Script location: ' + sqlPath, 'blue')
    log('🌐 Supabase Dashboard: ' + supabaseUrl.replace('/rest/v1', ''), 'blue')

    log('\n✨ What the script will add:', 'yellow')
    log('- 20+ new products across multiple categories', 'green')
    log('- Electronics: tablets, keyboards, monitors, webcams, chargers', 'green')
    log('- Fashion: hoodies, sneakers, jackets, dresses, accessories', 'green')
    log('- Home: lamps, cushions, plants, rugs, coffee kits', 'green')
    log('- Books: photography guides, fantasy novels', 'green')
    log('- Product images for existing items', 'green')
    log('- Proper categorization and inventory levels', 'green')

    log('\n🎯 After execution, your e-commerce platform will have:', 'bold')
    log('✅ Comprehensive product catalog', 'green')
    log('✅ Diverse categories with real products', 'green')
    log('✅ Proper inventory and pricing', 'green')
    log('✅ Featured products for homepage', 'green')
    log('✅ Product images and descriptions', 'green')

  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red')
    console.error(error)
  }
}

// Run the script
executeSQLScript().catch(console.error)