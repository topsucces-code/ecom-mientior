// Script pour tester les catégories disponibles dans Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCategories() {
  try {
    console.log('📂 TEST DES CATÉGORIES SUPABASE')
    console.log('===============================\n')
    
    // Récupérer toutes les catégories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (catError) {
      console.error('❌ Erreur catégories:', catError.message)
      return false
    }
    
    console.log(`✅ ${categories.length} catégories trouvées:`)
    console.log('=====================================')
    
    for (const category of categories) {
      console.log(`📁 ${category.name}`)
      console.log(`   ID: ${category.id}`)
      console.log(`   Slug: ${category.slug}`)
      console.log(`   Description: ${category.description || 'N/A'}`)
      
      // Compter les produits dans cette catégorie
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'active')
      
      if (!countError) {
        console.log(`   Produits: ${count} actifs`)
      }
      
      // Montrer quelques exemples de produits
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('name, price')
        .eq('category_id', category.id)
        .eq('status', 'active')
        .limit(3)
      
      if (!prodError && products.length > 0) {
        console.log(`   Exemples:`)
        products.forEach((product, index) => {
          console.log(`     ${index + 1}. ${product.name} - $${product.price}`)
        })
      }
      
      console.log('   URL suggérée: /category/' + category.slug.toLowerCase())
      console.log('')
    }
    
    return categories
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    return false
  }
}

async function suggestCategoryRoutes(categories) {
  console.log('🌐 ROUTES DE CATÉGORIES SUGGÉRÉES')
  console.log('=================================')
  
  categories.forEach(category => {
    const slug = category.slug.toLowerCase()
    console.log(`✅ /category/${slug} → ${category.name}`)
  })
  
  console.log('\n📋 Routes populaires à implémenter:')
  const popularSlugs = ['electronics', 'fashion', 'clothing', 'home', 'books', 'sports']
  
  popularSlugs.forEach(slug => {
    const matchingCategory = categories.find(cat => 
      cat.slug.toLowerCase().includes(slug) || 
      cat.name.toLowerCase().includes(slug)
    )
    
    if (matchingCategory) {
      console.log(`🎯 /category/${slug} → ${matchingCategory.name} (${matchingCategory.slug})`)
    } else {
      console.log(`⚠️  /category/${slug} → Catégorie manquante`)
    }
  })
}

async function main() {
  const categories = await testCategories()
  
  if (categories && categories.length > 0) {
    await suggestCategoryRoutes(categories)
    
    console.log('\n🚀 PROCHAINES ÉTAPES:')
    console.log('====================')
    console.log('1. Créer apps/web/src/app/category/[slug]/page.tsx')
    console.log('2. Implémenter la logique de récupération par slug')
    console.log('3. Afficher les produits de la catégorie')
    console.log('4. Ajouter filtres et tri')
    console.log('5. Tester les routes populaires')
  }
}

main().catch(console.error)