// Script pour tester l'intégration complète de la homepage avec Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFeaturedProducts() {
  try {
    console.log('📦 Test des Featured Products...')
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (
          id,
          name,
          slug,
          description
        )
      `)
      .eq('featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
    
    if (error) {
      console.error('❌ Erreur Featured Products:', error.message)
      return false
    }
    
    console.log(`✅ ${products.length} produits featured trouvés`)
    
    if (products.length > 0) {
      console.log('   Exemples:')
      products.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - $${product.price}`)
        console.log(`      Catégorie: ${product.category?.name || 'N/A'}`)
        console.log(`      Images: ${product.images?.length || 0}`)
      })
    }
    
    return products.length > 0
    
  } catch (error) {
    console.error('❌ Erreur test Featured Products:', error.message)
    return false
  }
}

async function testDealsTable() {
  try {
    console.log('🎯 Test de la table Deals...')
    
    const { data: deals, error } = await supabase
      .from('deals_of_the_day')
      .select(`
        *,
        product:products (
          id,
          name,
          price,
          images
        )
      `)
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString())
      .limit(4)
    
    if (error) {
      console.log('⚠️  Table deals_of_the_day n\'existe pas encore')
      console.log('💡 Exécutez: supabase/deals-table-fixed.sql dans Supabase Dashboard')
      return false
    }
    
    console.log(`✅ ${deals.length} deals actifs trouvés`)
    
    if (deals.length > 0) {
      console.log('   Exemples:')
      deals.slice(0, 2).forEach((deal, index) => {
        console.log(`   ${index + 1}. ${deal.product.name}`)
        console.log(`      Prix original: $${deal.original_price}`)
        console.log(`      Prix deal: $${deal.deal_price} (-${deal.discount_percentage}%)`)
      })
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur test Deals:', error.message)
    return false
  }
}

async function testCategoriesAndProducts() {
  try {
    console.log('📂 Test des Catégories et Produits...')
    
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5)
    
    if (catError) {
      console.error('❌ Erreur catégories:', catError.message)
      return false
    }
    
    console.log(`✅ ${categories.length} catégories trouvées`)
    
    // Test total products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    if (countError) {
      console.error('❌ Erreur count produits:', countError.message)
      return false
    }
    
    console.log(`✅ ${count} produits actifs total`)
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur test global:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 TEST INTÉGRATION HOMEPAGE SUPABASE')
  console.log('=====================================\n')
  
  const results = {
    categories: await testCategoriesAndProducts(),
    featured: await testFeaturedProducts(),
    deals: await testDealsTable()
  }
  
  console.log('\n📊 RÉSULTATS:')
  console.log('=============')
  console.log(`✅ Catégories & Produits: ${results.categories ? 'OK' : 'ERREUR'}`)
  console.log(`✅ Featured Products: ${results.featured ? 'OK' : 'ERREUR'}`)
  console.log(`✅ Deals of the Day: ${results.deals ? 'OK' : 'SETUP REQUIS'}`)
  
  if (results.categories && results.featured) {
    console.log('\n🎉 HOMEPAGE PRÊTE!')
    console.log('==================')
    console.log('✅ Section Featured Products → Données Supabase')
    if (results.deals) {
      console.log('✅ Section Deal of the Day → Données Supabase')
    } else {
      console.log('⚠️  Section Deal of the Day → Fallback (execute deals SQL)')
    }
    console.log('\n🌐 Testez sur: http://localhost:3010')
  } else {
    console.log('\n❌ ACTIONS REQUISES:')
    if (!results.categories) console.log('   - Vérifier la base de données Supabase')
    if (!results.featured) console.log('   - Marquer des produits comme featured=true')
  }
}

main().catch(console.error)