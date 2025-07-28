#!/usr/bin/env node

/**
 * Script to add test products to Supabase database
 * Run with: node scripts/add-test-products.js
 */

const fs = require('fs');
const path = require('path');

// You'll need to install @supabase/supabase-js if not already installed
// npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestProducts() {
  try {
    console.log('🚀 Starting to add test products...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'add-test-products.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing SQL script...');

    // Execute the SQL using Supabase RPC or direct SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }

    console.log('✅ Test products added successfully!');
    
    // Verify by counting products
    const { data: productCount, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Total products in database: ${productCount?.length || 'Unknown'}`);
    }

    // Show some of the newly added products
    const { data: newProducts, error: fetchError } = await supabase
      .from('products')
      .select('name, sku, price, brand')
      .in('sku', [
        'IPAD-AIR-M1',
        'KEYBOARD-RGB-MX',
        'WEBCAM-HD-1080',
        'HOODIE-UNISEX-PREMIUM',
        'SNEAKERS-RUN-WOMEN'
      ]);

    if (!fetchError && newProducts?.length) {
      console.log('\n🛍️ Sample of newly added products:');
      newProducts.forEach(product => {
        console.log(`  • ${product.name} (${product.sku}) - €${product.price} - ${product.brand}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Alternative method if RPC is not available
async function addTestProductsAlternative() {
  try {
    console.log('🚀 Adding test products using individual inserts...');

    // Get category IDs first
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, slug');

    if (catError) {
      console.error('❌ Error fetching categories:', catError);
      return;
    }

    const catMap = categories.reduce((acc, cat) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {});

    console.log('📂 Found categories:', Object.keys(catMap));

    // Sample products to add
    const products = [
      {
        name: 'iPad Air 5e génération',
        description: 'Tablette Apple avec puce M1, écran Liquid Retina 10.9", parfaite pour le travail et les loisirs',
        price: 699.99,
        compare_at_price: 799.99,
        sku: 'IPAD-AIR-M1',
        inventory_quantity: 30,
        category_id: catMap['electronics'],
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
        category_id: catMap['electronics'],
        brand: 'GamerTech',
        tags: ['clavier', 'gaming', 'rgb', 'mécanique'],
        featured: false
      },
      {
        name: 'Hoodie Unisexe Premium',
        description: 'Sweat à capuche unisexe en coton bio, coupe décontractée, plusieurs coloris',
        price: 79.99,
        compare_at_price: 99.99,
        sku: 'HOODIE-UNISEX-PREMIUM',
        inventory_quantity: 60,
        category_id: catMap['clothing'],
        brand: 'UrbanStyle',
        tags: ['hoodie', 'unisexe', 'coton', 'bio'],
        featured: false
      }
    ];

    for (const product of products) {
      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('sku', product.sku)
        .single();

      if (existing) {
        console.log(`⏭️  Product ${product.sku} already exists, skipping...`);
        continue;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();

      if (error) {
        console.error(`❌ Error adding ${product.sku}:`, error);
      } else {
        console.log(`✅ Added: ${product.name} (${product.sku})`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
if (require.main === module) {
  console.log('🛍️  E-Commerce Test Products Loader');
  console.log('=====================================\n');
  
  // Try the RPC method first, fallback to alternative
  addTestProducts().catch(() => {
    console.log('\n🔄 Trying alternative method...');
    addTestProductsAlternative();
  });
}

module.exports = { addTestProducts, addTestProductsAlternative };