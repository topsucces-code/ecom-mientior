#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function banner() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan')
  log('║                  🚀 SUPABASE SETUP WIZARD                   ║', 'cyan')
  log('║              E-commerce Platform Configuration               ║', 'cyan')
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan')
  log('')
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${prompt}${colors.reset}`, resolve)
  })
}

async function setupEnvironment() {
  log('📝 Configuration des variables d\'environnement', 'blue')
  log('═══════════════════════════════════════════════════════════', 'blue')
  
  const supabaseUrl = await question('🔗 URL de votre projet Supabase: ')
  const supabaseAnonKey = await question('🔑 Clé anonyme (anon key): ')
  const supabaseServiceKey = await question('🛡️  Clé service role (optionnel): ')
  
  log('\n🔐 Configuration de l\'authentification', 'blue')
  const nextAuthSecret = await question('🎯 NEXTAUTH_SECRET (ou appuyez sur Entrée pour générer): ')
  
  // Generate random secret if not provided
  const authSecret = nextAuthSecret || require('crypto').randomBytes(32).toString('hex')
  
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
${supabaseServiceKey ? `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}` : '# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key'}

# Authentication
NEXTAUTH_SECRET=${authSecret}
NEXTAUTH_URL=http://localhost:3010

# Payment Configuration (Optional)
# STRIPE_PUBLIC_KEY=your_stripe_public_key
# STRIPE_SECRET_KEY=your_stripe_secret_key
# PAYPAL_CLIENT_ID=your_paypal_client_id
# PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email Configuration (Optional)
# SMTP_HOST=your_smtp_host
# SMTP_PORT=587
# SMTP_USER=your_smtp_user
# SMTP_PASS=your_smtp_password
`

  const envPath = path.join(process.cwd(), '.env.local')
  fs.writeFileSync(envPath, envContent)
  
  log('✅ Fichier .env.local créé avec succès!', 'green')
  return { supabaseUrl, supabaseAnonKey }
}

async function testConnection(supabaseUrl, supabaseKey) {
  log('\n🔍 Test de connexion à Supabase...', 'blue')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase
      .from('categories')
      .select('count(*)')
      .limit(1)
    
    if (error && error.code === '42P01') {
      log('⚠️  Tables non trouvées - Setup de la base de données requis', 'yellow')
      return { connected: true, tablesExist: false }
    } else if (error) {
      log(`❌ Erreur de connexion: ${error.message}`, 'red')
      return { connected: false, tablesExist: false }
    }
    
    log('✅ Connexion établie avec succès!', 'green')
    return { connected: true, tablesExist: true }
  } catch (err) {
    log(`❌ Erreur de connexion: ${err.message}`, 'red')
    return { connected: false, tablesExist: false }
  }
}

async function setupDatabase() {
  log('\n🗄️ Configuration de la base de données', 'blue')
  log('═══════════════════════════════════════════════════════════', 'blue')
  
  const sqlPath = path.join(process.cwd(), 'supabase', 'setup-complete.sql')
  
  if (!fs.existsSync(sqlPath)) {
    log('❌ Fichier setup-complete.sql non trouvé!', 'red')
    return false
  }
  
  log('📋 Instructions pour configurer la base de données:', 'yellow')
  log('1. Ouvrez votre dashboard Supabase', 'dim')
  log('2. Allez dans "SQL Editor"', 'dim')
  log('3. Cliquez sur "New Query"', 'dim')
  log('4. Copiez le contenu du fichier supabase/setup-complete.sql', 'dim')
  log('5. Collez-le dans l\'éditeur SQL', 'dim')
  log('6. Cliquez sur "RUN" pour exécuter', 'dim')
  
  const proceed = await question('\n✅ Avez-vous exécuté le script SQL? (y/N): ')
  
  if (proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes') {
    log('✅ Configuration de la base de données confirmée!', 'green')
    return true
  }
  
  log('⚠️  Configuration de la base de données reportée', 'yellow')
  return false
}

async function runDatabaseTests(supabaseUrl, supabaseKey) {
  log('\n🧪 Tests d\'intégration...', 'blue')
  log('═══════════════════════════════════════════════════════════', 'blue')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const tests = [
    {
      name: 'Tables principales',
      tables: ['categories', 'products', 'orders', 'user_profiles']
    },
    {
      name: 'Tables étendues',
      tables: ['coupons', 'payments', 'notifications', 'search_history']
    },
    {
      name: 'Fonctions base de données',
      functions: ['apply_coupon', 'get_inventory_metrics', 'check_stock_alerts']
    }
  ]
  
  let allPassed = true
  
  // Test tables
  for (const test of tests.slice(0, 2)) {
    log(`\n🔍 Test: ${test.name}`, 'yellow')
    for (const table of test.tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          log(`  ❌ ${table}: ${error.message}`, 'red')
          allPassed = false
        } else {
          log(`  ✅ ${table}: OK`, 'green')
        }
      } catch (err) {
        log(`  ❌ ${table}: ${err.message}`, 'red')
        allPassed = false
      }
    }
  }
  
  // Test functions
  log(`\n🔍 Test: ${tests[2].name}`, 'yellow')
  for (const func of tests[2].functions) {
    try {
      let result
      if (func === 'apply_coupon') {
        result = await supabase.rpc(func, {
          coupon_code: 'TEST',
          user_id: 'test-user',
          cart_total: 100,
          cart_items: '[]'
        })
      } else {
        result = await supabase.rpc(func)
      }
      
      if (result.error) {
        log(`  ❌ ${func}: ${result.error.message}`, 'red')
        allPassed = false
      } else {
        log(`  ✅ ${func}: OK`, 'green')
      }
    } catch (err) {
      log(`  ❌ ${func}: ${err.message}`, 'red')
      allPassed = false
    }
  }
  
  return allPassed
}

async function createSampleData(supabaseUrl, supabaseKey) {
  log('\n📊 Création de données d\'exemple...', 'blue')
  
  const create = await question('Voulez-vous créer des données d\'exemple? (Y/n): ')
  
  if (create.toLowerCase() === 'n' || create.toLowerCase() === 'no') {
    log('⏭️  Création de données d\'exemple ignorée', 'yellow')
    return true
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Check if data already exists
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (existingCategories && existingCategories.length > 0) {
      log('ℹ️  Des données existent déjà', 'blue')
      const overwrite = await question('Voulez-vous les remplacer? (y/N): ')
      
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        log('⏭️  Conservation des données existantes', 'yellow')
        return true
      }
    }
    
    // Sample categories
    const categories = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        slug: 'electronics',
        image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Clothing',
        description: 'Fashion and clothing items',
        slug: 'clothing',
        image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Books',
        description: 'Books and literature',
        slug: 'books',
        image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'
      }
    ]
    
    // Insert categories
    const { error: catError } = await supabase
      .from('categories')
      .upsert(categories)
    
    if (catError) {
      log(`❌ Erreur lors de la création des catégories: ${catError.message}`, 'red')
      return false
    }
    
    log('✅ Catégories créées', 'green')
    
    // Sample products
    const products = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 299.99,
        compare_at_price: 399.99,
        sku: 'WH-001',
        inventory_quantity: 50,
        category_id: '550e8400-e29b-41d4-a716-446655440001',
        brand: 'TechBrand',
        weight: 0.5,
        dimensions: '20x15x8 cm',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        tags: ['wireless', 'bluetooth', 'noise-canceling'],
        status: 'active',
        featured: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Smartphone Pro',
        description: 'Latest smartphone with advanced camera system',
        price: 899.99,
        sku: 'SP-002',
        inventory_quantity: 25,
        category_id: '550e8400-e29b-41d4-a716-446655440001',
        brand: 'PhoneBrand',
        weight: 0.2,
        dimensions: '15x7x1 cm',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
        tags: ['smartphone', '5G', 'camera'],
        status: 'active',
        featured: true
      }
    ]
    
    const { error: prodError } = await supabase
      .from('products')
      .upsert(products)
    
    if (prodError) {
      log(`❌ Erreur lors de la création des produits: ${prodError.message}`, 'red')
      return false
    }
    
    log('✅ Produits créés', 'green')
    
    // Sample coupons
    const coupons = [
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        description: '10% off your first order',
        minimum_order_amount: 50,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        usage_count: 0
      },
      {
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        description: 'Free shipping on orders over $75',
        minimum_order_amount: 75,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        usage_count: 0
      }
    ]
    
    const { error: couponError } = await supabase
      .from('coupons')
      .upsert(coupons)
    
    if (couponError) {
      log(`❌ Erreur lors de la création des coupons: ${couponError.message}`, 'red')
      return false
    }
    
    log('✅ Coupons créés', 'green')
    log('✅ Données d\'exemple créées avec succès!', 'green')
    
    return true
    
  } catch (err) {
    log(`❌ Erreur lors de la création des données: ${err.message}`, 'red')
    return false
  }
}

async function finalSetup() {
  log('\n🎯 Configuration finale...', 'blue')
  log('═══════════════════════════════════════════════════════════', 'blue')
  
  // Update package.json scripts if needed
  const packagePath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    if (!packageJson.scripts['test:supabase']) {
      packageJson.scripts['test:supabase'] = 'node scripts/test-supabase-connection.js'
      packageJson.scripts['setup:supabase'] = 'node scripts/setup-supabase.js'
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
      log('✅ Scripts ajoutés au package.json', 'green')
    }
  }
  
  log('\n🎉 Configuration terminée avec succès!', 'green')
  log('═══════════════════════════════════════════════════════════', 'green')
  log('')
  log('📋 Prochaines étapes:', 'yellow')
  log('1. npm run dev                     # Démarrer le serveur', 'dim')
  log('2. http://localhost:3010           # Ouvrir l\'application', 'dim')
  log('3. npm run test:supabase           # Tester la connexion', 'dim')
  log('4. /api/test-integration           # Tester l\'API', 'dim')
  log('')
  log('📚 Documentation:', 'yellow')
  log('- SUPABASE_SETUP_GUIDE.md         # Guide complet', 'dim')
  log('- /api/test-integration            # Tests d\'intégration', 'dim')
  log('- Supabase Dashboard               # Gestion de la DB', 'dim')
  log('')
  log('🆘 Support:', 'yellow')
  log('- GitHub Issues pour les problèmes', 'dim')
  log('- Documentation Supabase officielle', 'dim')
  log('')
}

async function main() {
  try {
    banner()
    
    log('Ce wizard va vous guider dans la configuration de Supabase', 'blue')
    log('pour votre plateforme e-commerce.\n', 'blue')
    
    // Step 1: Environment setup
    const { supabaseUrl, supabaseAnonKey } = await setupEnvironment()
    
    // Step 2: Test connection
    const { connected, tablesExist } = await testConnection(supabaseUrl, supabaseAnonKey)
    
    if (!connected) {
      log('\n❌ Impossible de se connecter à Supabase', 'red')
      log('Vérifiez vos credentials et réessayez.', 'yellow')
      process.exit(1)
    }
    
    // Step 3: Database setup
    if (!tablesExist) {
      const dbSetup = await setupDatabase()
      if (dbSetup) {
        // Test again after setup
        const testsPassed = await runDatabaseTests(supabaseUrl, supabaseAnonKey)
        if (!testsPassed) {
          log('\n⚠️  Certains tests ont échoué', 'yellow')
          log('Vérifiez la configuration dans le dashboard Supabase', 'yellow')
        }
      }
    } else {
      log('\n✅ Tables déjà configurées', 'green')
      await runDatabaseTests(supabaseUrl, supabaseAnonKey)
    }
    
    // Step 4: Sample data
    await createSampleData(supabaseUrl, supabaseAnonKey)
    
    // Step 5: Final setup
    await finalSetup()
    
  } catch (error) {
    log(`\n💥 Erreur inattendue: ${error.message}`, 'red')
    console.error(error)
  } finally {
    rl.close()
  }
}

// Handle CTRL+C gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Configuration interrompue', 'yellow')
  rl.close()
  process.exit(0)
})

main().catch(console.error)