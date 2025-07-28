// Script pour tester les produits featured depuis Supabase
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
    console.log('🎯 TEST FEATURED PRODUCTS')
    console.log('========================\n')
    
    console.log('🔍 Test de connexion Supabase...')
    
    // Test basique de connexion
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError.message)
      return false
    }
    
    console.log(`✅ Connexion OK - ${testData} produits total dans la base`)
    
    // Test des produits featured
    console.log('\n📦 Test des produits featured...')
    
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        images,
        featured,
        status,
        category_id,
        created_at
      `)
      .eq('featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
    
    if (featuredError) {
      console.error('❌ Erreur produits featured:', featuredError.message)
      return false
    }
    
    console.log(`✅ ${featuredProducts.length} produits featured trouvés`)
    
    if (featuredProducts.length === 0) {
      console.log('\n⚠️  Aucun produit featured trouvé')
      console.log('💡 Solution: Marquer quelques produits comme featured')
      console.log('   1. Aller dans Supabase Dashboard')
      console.log('   2. Table "products"')
      console.log('   3. Modifier featured = true pour quelques produits')
      
      // Essayons de récupérer tous les produits actifs
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('id, name, featured, status')
        .eq('status', 'active')
        .limit(10)
      
      if (!allError && allProducts.length > 0) {
        console.log(`\n📋 ${allProducts.length} produits actifs disponibles:`)
        allProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (featured: ${product.featured})`)
        })
      }
      
      return false
    }
    
    console.log('\n🎉 Produits featured trouvés:')
    featuredProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`)
      console.log(`   Prix: $${product.price}`)
      console.log(`   Catégorie ID: ${product.category_id}`)
      console.log(`   Images: ${product.images?.length || 0}`)
      console.log(`   Status: ${product.status}`)
      console.log('')
    })
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    return false
  }
}

async function checkProductsTable() {
  try {
    console.log('🔍 Vérification de la table products...')
    
    // Vérifier la structure de la table
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erreur table products:', error.message)
      console.log('\n💡 La table products n\'existe peut-être pas encore')
      console.log('📋 Étapes à suivre:')
      console.log('   1. Exécuter le script de migration principale')
      console.log('   2. Puis revenir tester les featured products')
      return false
    }
    
    console.log('✅ Table products existe et accessible')
    return true
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return false
  }
}

async function main() {
  const tableExists = await checkProductsTable()
  
  if (tableExists) {
    const success = await testFeaturedProducts()
    
    if (success) {
      console.log('\n✅ TEST RÉUSSI!')
      console.log('🌐 La section Featured Products devrait maintenant fonctionner')
      console.log('🚀 Vérifiez sur: http://localhost:3010')
    } else {
      console.log('\n⚠️  Actions requises pour finaliser')
    }
  }
}

main().catch(console.error)