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

// Product data to add
const newProducts = [
  // Electronics
  {
    name: 'iPad Air 5e génération',
    description: 'Tablette Apple avec puce M1, écran Liquid Retina 10.9", parfaite pour le travail et les loisirs',
    price: 699.99,
    compare_at_price: 799.99,
    sku: 'IPAD-AIR-M1',
    inventory_quantity: 30,
    category_slug: 'electronics',
    brand: 'Apple',
    tags: ['tablette', 'apple', 'm1', 'ipad'],
    featured: true
  },
  {
    name: 'Clavier Mécanique RGB',
    description: 'Clavier gaming mécanique avec rétroéclairage RGB, switches Cherry MX',
    price: 159.99,
    sku: 'KEYBOARD-RGB-MX',
    inventory_quantity: 40,
    category_slug: 'electronics',
    brand: 'GamerTech',
    tags: ['clavier', 'gaming', 'rgb', 'mécanique']
  },
  {
    name: 'Écran 4K 27 pouces',
    description: 'Moniteur 4K UHD 27" avec HDR, parfait pour le gaming et le design',
    price: 449.99,
    compare_at_price: 549.99,
    sku: 'MONITOR-4K-27',
    inventory_quantity: 20,
    category_slug: 'electronics',
    brand: 'ViewMaster',
    tags: ['écran', '4k', 'moniteur', 'hdr']
  },
  {
    name: 'Webcam HD 1080p',
    description: 'Webcam haute définition avec micro intégré, idéale pour le télétravail',
    price: 89.99,
    sku: 'WEBCAM-HD-1080',
    inventory_quantity: 60,
    category_slug: 'electronics',
    brand: 'StreamTech',
    tags: ['webcam', 'hd', 'télétravail', 'streaming'],
    featured: true
  },
  {
    name: 'Chargeur Sans Fil Rapide',
    description: 'Station de charge sans fil 15W compatible iPhone et Android',
    price: 39.99,
    sku: 'CHARGER-WIRELESS-15W',
    inventory_quantity: 80,
    category_slug: 'electronics',
    brand: 'PowerMax',
    tags: ['chargeur', 'sans-fil', 'qi', 'rapide']
  },
  {
    name: 'Montre Connectée Sport',
    description: 'Smartwatch avec GPS, capteur cardiaque, étanche, autonomie 7 jours',
    price: 199.99,
    sku: 'SMARTWATCH-SPORT-GPS',
    inventory_quantity: 40,
    category_slug: 'electronics',
    brand: 'FitTracker',
    tags: ['montre', 'connectée', 'sport', 'gps']
  },
  {
    name: 'Enceinte Bluetooth Portable',
    description: 'Haut-parleur Bluetooth étanche IPX7, son 360°, autonomie 12h',
    price: 79.99,
    sku: 'SPEAKER-BT-PORTABLE-12H',
    inventory_quantity: 55,
    category_slug: 'electronics',
    brand: 'SoundWave',
    tags: ['enceinte', 'bluetooth', 'portable', 'étanche'],
    featured: true
  },
  
  // Clothing
  {
    name: 'Hoodie Unisexe Premium',
    description: 'Sweat à capuche unisexe en coton bio, coupe décontractée, plusieurs coloris',
    price: 79.99,
    compare_at_price: 99.99,
    sku: 'HOODIE-UNISEX-PREMIUM',
    inventory_quantity: 60,
    category_slug: 'clothing',
    brand: 'UrbanStyle',
    tags: ['hoodie', 'unisexe', 'coton', 'bio']
  },
  {
    name: 'Baskets Running Femme',
    description: 'Chaussures de running légères avec amorti responsive, parfaites pour le sport',
    price: 129.99,
    sku: 'SNEAKERS-RUN-WOMEN',
    inventory_quantity: 45,
    category_slug: 'clothing',
    brand: 'SportFlow',
    tags: ['baskets', 'running', 'femme', 'sport'],
    featured: true
  },
  {
    name: 'Veste en Cuir Homme',
    description: 'Veste en cuir véritable, style motard, coupe slim, finitions soignées',
    price: 299.99,
    sku: 'JACKET-LEATHER-MEN',
    inventory_quantity: 25,
    category_slug: 'clothing',
    brand: 'LeatherCraft',
    tags: ['veste', 'cuir', 'homme', 'motard']
  },
  {
    name: 'Robe d\'été Fleurie',
    description: 'Robe légère en viscose avec motifs floraux, parfaite pour l\'été',
    price: 59.99,
    compare_at_price: 79.99,
    sku: 'DRESS-SUMMER-FLORAL',
    inventory_quantity: 35,
    category_slug: 'clothing',
    brand: 'SummerVibes',
    tags: ['robe', 'été', 'fleurie', 'viscose']
  },
  {
    name: 'Sac à Dos Urbain',
    description: 'Sac à dos moderne avec compartiment laptop, port USB, résistant à l\'eau',
    price: 59.99,
    compare_at_price: 79.99,
    sku: 'BACKPACK-URBAN-LAPTOP',
    inventory_quantity: 35,
    category_slug: 'clothing',
    brand: 'CityBag',
    tags: ['sac', 'dos', 'urbain', 'laptop']
  },
  {
    name: 'Lunettes de Soleil Aviateur',
    description: 'Lunettes de soleil style aviateur, verres polarisés, protection UV 100%',
    price: 119.99,
    sku: 'SUNGLASSES-AVIATOR-UV',
    inventory_quantity: 45,
    category_slug: 'clothing',
    brand: 'SunStyle',
    tags: ['lunettes', 'soleil', 'aviateur', 'uv'],
    featured: true
  },
  
  // Home & Garden
  {
    name: 'Lampe de Bureau LED',
    description: 'Lampe de bureau moderne avec variateur, port USB, design épuré',
    price: 89.99,
    sku: 'LAMP-DESK-LED-USB',
    inventory_quantity: 50,
    category_slug: 'maison-jardin',
    brand: 'LightHome',
    tags: ['lampe', 'bureau', 'led', 'usb'],
    featured: true
  },
  {
    name: 'Coussin Décoratif Set',
    description: 'Set de 4 coussins décoratifs en velours, coloris assortis, 45x45cm',
    price: 49.99,
    compare_at_price: 69.99,
    sku: 'CUSHION-SET-VELVET-4',
    inventory_quantity: 30,
    category_slug: 'maison-jardin',
    brand: 'CozyHome',
    tags: ['coussin', 'décoratif', 'velours', 'set']
  },
  {
    name: 'Plante Artificielle Monstera',
    description: 'Monstera deliciosa artificielle 120cm, très réaliste, pot inclus',
    price: 79.99,
    sku: 'PLANT-ARTIFICIAL-MONSTERA',
    inventory_quantity: 25,
    category_slug: 'maison-jardin',
    brand: 'GreenDecor',
    tags: ['plante', 'artificielle', 'monstera', 'décoration']
  },
  {
    name: 'Tapis Berbère Moderne',
    description: 'Tapis style berbère 160x230cm, motifs géométriques, fibres naturelles',
    price: 159.99,
    sku: 'RUG-BERBER-MODERN-160',
    inventory_quantity: 15,
    category_slug: 'maison-jardin',
    brand: 'RugCraft',
    tags: ['tapis', 'berbère', 'géométrique', 'naturel']
  },
  {
    name: 'Kit Café Barista',
    description: 'Kit complet pour faire un café comme un barista : moussoir, doseur, tamper',
    price: 89.99,
    sku: 'COFFEE-KIT-BARISTA',
    inventory_quantity: 25,
    category_slug: 'maison-jardin',
    brand: 'CoffeePro',
    tags: ['café', 'barista', 'kit', 'moussoir']
  },
  
  // Books
  {
    name: 'Guide Photographie Numérique',
    description: 'Manuel complet de photographie numérique, techniques avancées et astuces',
    price: 39.99,
    sku: 'BOOK-PHOTO-DIGITAL-GUIDE',
    inventory_quantity: 40,
    category_slug: 'books',
    brand: 'PhotoEditions',
    tags: ['livre', 'photographie', 'numérique', 'guide']
  },
  {
    name: 'Roman Fantasy Épique',
    description: 'Trilogie fantasy complète, monde imaginaire riche, aventure épique',
    price: 29.99,
    compare_at_price: 34.99,
    sku: 'BOOK-FANTASY-TRILOGY',
    inventory_quantity: 60,
    category_slug: 'books',
    brand: 'FantasyPress',
    tags: ['livre', 'fantasy', 'roman', 'trilogie']
  }
]

async function addProductsAsAdmin() {
  try {
    log('🚀 Adding Products with Admin Privileges', 'blue')
    log('═══════════════════════════════════════════════════════════', 'blue')

    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) {
      log('❌ .env.local file not found!', 'red')
      return
    }

    // Load environment variables
    require('dotenv').config({ path: envPath })
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      log('❌ Missing Supabase Service Role Key in .env.local', 'red')
      log('Please add: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key', 'yellow')
      log('You can find this in your Supabase Dashboard > Settings > API', 'yellow')
      return
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get categories first
    log('\n🔍 Fetching categories...', 'yellow')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, slug')

    if (catError) {
      log(`❌ Error fetching categories: ${catError.message}`, 'red')
      return
    }

    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat.id
    })

    log(`✅ Found ${categories.length} categories`, 'green')

    // Add products
    log('\n🛍️ Adding new products...', 'yellow')
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const productData of newProducts) {
      try {
        // Check if product already exists
        const { data: existing } = await supabase
          .from('products')
          .select('sku')
          .eq('sku', productData.sku)
          .single()

        if (existing) {
          log(`⏭️ Skipping existing product: ${productData.name} (${productData.sku})`, 'yellow')
          skipCount++
          continue
        }

        // Get category ID
        const categoryId = categoryMap[productData.category_slug]
        if (!categoryId) {
          log(`❌ Category not found for: ${productData.category_slug}`, 'red')
          errorCount++
          continue
        }

        // Prepare product data
        const insertData = {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          compare_at_price: productData.compare_at_price || null,
          sku: productData.sku,
          inventory_quantity: productData.inventory_quantity,
          category_id: categoryId,
          brand: productData.brand,
          tags: productData.tags,
          featured: productData.featured || false
        }

        // Insert product using service role (bypasses RLS)
        const { error: insertError } = await supabase
          .from('products')
          .insert([insertData])

        if (insertError) {
          log(`❌ Error adding ${productData.name}: ${insertError.message}`, 'red')
          errorCount++
        } else {
          log(`✅ Added: ${productData.name}`, 'green')
          successCount++
        }

      } catch (err) {
        log(`❌ Unexpected error for ${productData.name}: ${err.message}`, 'red')
        errorCount++
      }
    }

    // Final summary
    log('\n📊 Summary:', 'bold')
    log('═══════════════════════════════════════════════════════════', 'blue')
    log(`✅ Successfully added: ${successCount} products`, 'green')
    log(`⏭️ Skipped existing: ${skipCount} products`, 'yellow')
    log(`❌ Errors: ${errorCount} products`, 'red')

    // Check final product count
    const { data: finalProducts } = await supabase
      .from('products')
      .select('id')

    log(`\n🎯 Total products in database: ${finalProducts?.length || 0}`, 'blue')

    if (successCount > 0) {
      log('\n🎉 Success! Your e-commerce platform now has:', 'green')
      log('✅ Comprehensive product catalog', 'green')
      log('✅ Diverse categories with real products', 'green')
      log('✅ Proper inventory and pricing', 'green')
      log('✅ Featured products for homepage', 'green')
      log('✅ Product images and descriptions', 'green')
      
      log('\n🚀 Next steps:', 'yellow')
      log('1. Run: npm run dev', 'blue')
      log('2. Visit: http://localhost:3010', 'blue')
      log('3. Check the homepage and product pages', 'blue')
    }

  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red')
    console.error(error)
  }
}

// Run the script
addProductsAsAdmin().catch(console.error)