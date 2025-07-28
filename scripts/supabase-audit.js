// Audit complet des tables Supabase existantes et manquantes
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fhewhxjprkksjriohxpv.supabase.co'
const supabaseAnonKey = 'sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tables requises pour l'application e-commerce
const requiredTables = [
  {
    name: 'products',
    description: 'Produits de la boutique',
    required: true,
    columns: ['id', 'name', 'description', 'price', 'category_id', 'status']
  },
  {
    name: 'categories',
    description: 'Catégories de produits',
    required: true,
    columns: ['id', 'name', 'slug']
  },
  {
    name: 'user_profiles',
    description: 'Profils utilisateurs étendus',
    required: false,
    columns: ['id', 'email', 'full_name']
  },
  {
    name: 'product_reviews',
    description: 'Avis et notes des produits',
    required: false,
    columns: ['id', 'product_id', 'user_id', 'rating', 'title', 'content']
  },
  {
    name: 'wishlists',
    description: 'Listes de favoris des utilisateurs',
    required: false,
    columns: ['id', 'user_id', 'product_id']
  },
  {
    name: 'product_analytics',
    description: 'Analytics des produits',
    required: false,
    columns: ['id', 'product_id', 'views_count', 'cart_additions']
  },
  {
    name: 'promotions',
    description: 'Codes promo et réductions',
    required: false,
    columns: ['id', 'code', 'discount_type', 'discount_value']
  }
]

async function auditSupabaseTables() {
  console.log('🔍 AUDIT COMPLET DES TABLES SUPABASE\n')
  console.log('='.repeat(50))

  const results = {
    existing: [],
    missing: [],
    errors: []
  }

  try {
    for (const table of requiredTables) {
      console.log(`\n📋 Vérification: ${table.name}`)
      console.log(`   Description: ${table.description}`)
      console.log(`   Requis: ${table.required ? '✅ Obligatoire' : '🔧 Optionnel'}`)

      try {
        // Tester l'existence de la table
        const { data, error, count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`   Statut: ❌ Table manquante`)
          console.log(`   Erreur: ${error.message}`)
          results.missing.push({
            ...table,
            error: error.message
          })
        } else {
          console.log(`   Statut: ✅ Table existe`)
          console.log(`   Enregistrements: ${count || 0}`)
          
          // Tester quelques colonnes importantes
          try {
            const { data: sampleData } = await supabase
              .from(table.name)
              .select(table.columns.join(', '))
              .limit(1)
            
            console.log(`   Colonnes: ✅ Accessibles`)
            results.existing.push({
              ...table,
              count: count || 0,
              sample: sampleData?.[0] || null
            })
          } catch (colError) {
            console.log(`   Colonnes: ⚠️ Problème d'accès`)
            results.existing.push({
              ...table,
              count: count || 0,
              columnError: colError.message
            })
          }
        }
      } catch (generalError) {
        console.log(`   Statut: ❌ Erreur de connexion`)
        console.log(`   Erreur: ${generalError.message}`)
        results.errors.push({
          table: table.name,
          error: generalError.message
        })
      }
    }

    // Résumé final
    console.log('\n' + '='.repeat(50))
    console.log('📊 RÉSUMÉ DE L\'AUDIT')
    console.log('='.repeat(50))

    console.log(`\n✅ TABLES EXISTANTES (${results.existing.length}):`)
    results.existing.forEach(table => {
      console.log(`   • ${table.name} - ${table.count} enregistrements`)
    })

    console.log(`\n❌ TABLES MANQUANTES (${results.missing.length}):`)
    results.missing.forEach(table => {
      const priority = table.required ? '🔴 CRITIQUE' : '🟡 OPTIONNEL'
      console.log(`   • ${table.name} - ${priority}`)
    })

    if (results.errors.length > 0) {
      console.log(`\n⚠️ ERREURS DE CONNEXION (${results.errors.length}):`)
      results.errors.forEach(error => {
        console.log(`   • ${error.table}: ${error.error}`)
      })
    }

    // Recommandations
    console.log('\n' + '='.repeat(50))
    console.log('🎯 RECOMMANDATIONS')
    console.log('='.repeat(50))

    const criticalMissing = results.missing.filter(t => t.required)
    const optionalMissing = results.missing.filter(t => !t.required)

    if (criticalMissing.length > 0) {
      console.log('\n🔴 ACTIONS CRITIQUES REQUISES:')
      criticalMissing.forEach(table => {
        console.log(`   • Créer la table "${table.name}" immédiatement`)
        console.log(`     Description: ${table.description}`)
      })
    }

    if (optionalMissing.length > 0) {
      console.log('\n🟡 AMÉLIORATIONS RECOMMANDÉES:')
      optionalMissing.forEach(table => {
        console.log(`   • Créer la table "${table.name}" pour des fonctionnalités avancées`)
        console.log(`     Description: ${table.description}`)
      })
    }

    if (results.existing.length === requiredTables.length) {
      console.log('\n🎉 TOUTES LES TABLES SONT PRÊTES!')
      console.log('   Votre base de données Supabase est complètement configurée.')
    }

    console.log('\n' + '='.repeat(50))
    console.log('📋 PROCHAINES ÉTAPES')
    console.log('='.repeat(50))

    if (criticalMissing.length > 0 || optionalMissing.length > 0) {
      console.log('\n1. Ouvrir Supabase Dashboard → SQL Editor')
      console.log('2. Exécuter le script de migration final')
      console.log('3. Relancer cet audit pour vérifier')
    } else {
      console.log('\n✅ Aucune action requise - Base de données complète!')
    }

    return results

  } catch (error) {
    console.error('❌ Erreur générale lors de l\'audit:', error.message)
    return null
  }
}

// Exécuter l'audit
auditSupabaseTables().then(results => {
  if (results) {
    console.log(`\n🏁 Audit terminé avec succès!`)
    console.log(`   Tables existantes: ${results.existing.length}`)
    console.log(`   Tables manquantes: ${results.missing.length}`)
    console.log(`   Erreurs: ${results.errors.length}`)
  }
}).catch(error => {
  console.error('💥 Échec de l\'audit:', error.message)
})