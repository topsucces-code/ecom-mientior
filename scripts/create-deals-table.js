// Script pour créer la table deals_of_the_day dans Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Définie' : '❌ Manquante')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDealsTable() {
  try {
    console.log('🚀 Création de la table deals_of_the_day...')
    
    // Vérifier si la table existe déjà
    const { data: existingTable, error: checkError } = await supabase
      .from('deals_of_the_day')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ Table deals_of_the_day existe déjà')
      
      // Compter les deals existants
      const { count, error: countError } = await supabase
        .from('deals_of_the_day')
        .select('*', { count: 'exact', head: true })
      
      if (!countError) {
        console.log(`📊 Nombre de deals existants: ${count}`)
      }
      
      return true
    }
    
    console.log('⚠️  Table deals_of_the_day n\'existe pas encore')
    console.log('📋 Instructions:')
    console.log('1. Ouvrir https://supabase.com/dashboard')
    console.log('2. Aller dans SQL Editor')
    console.log('3. Exécuter le contenu de supabase/deals-table.sql')
    console.log('')
    console.log('📁 Fichier SQL: supabase/deals-table.sql')
    
    return false
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
    return false
  }
}

async function testDealsService() {
  try {
    console.log('🧪 Test du service des deals...')
    
    // Test de récupération des deals actifs
    const { data: deals, error } = await supabase
      .from('deals_of_the_day')
      .select(`
        *,
        product:products (
          id,
          name,
          description,
          price,
          images,
          brand,
          inventory_quantity
        )
      `)
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString())
      .limit(5)
    
    if (error) {
      console.error('❌ Erreur lors du test:', error.message)
      return false
    }
    
    console.log(`✅ ${deals.length} deals actifs trouvés`)
    
    if (deals.length > 0) {
      console.log('\n📦 Exemples de deals:')
      deals.forEach((deal, index) => {
        console.log(`${index + 1}. ${deal.product.name}`)
        console.log(`   Prix original: $${deal.original_price}`)
        console.log(`   Prix deal: $${deal.deal_price}`)
        console.log(`   Réduction: ${deal.discount_percentage}%`)
        console.log(`   Se termine: ${new Date(deal.ends_at).toLocaleDateString('fr-FR')}`)
        console.log('')
      })
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    return false
  }
}

async function main() {
  console.log('🎯 SETUP DEALS OF THE DAY')
  console.log('========================\n')
  
  const tableExists = await createDealsTable()
  
  if (tableExists) {
    await testDealsService()
    console.log('\n✅ Setup terminé! La fonctionnalité Deal of the Day est prête.')
    console.log('🌐 Vérifiez sur http://localhost:3010')
  } else {
    console.log('\n⚠️  Veuillez d\'abord exécuter le script SQL dans Supabase')
    console.log('📖 Voir: SETUP_DEALS_TABLE.md pour les instructions')
  }
}

main().catch(console.error)