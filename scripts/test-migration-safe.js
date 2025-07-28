// Script pour tester le nouveau script de migration sécurisé
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fhewhxjprkksjriohxpv.supabase.co'
const supabaseAnonKey = 'sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🧪 Test de connexion au script de migration sécurisé...\n')
  
  try {
    // Test basique de connexion
    const { data, error } = await supabase.from('products').select('count').limit(1)
    
    if (error) {
      console.log('❌ Erreur de connexion:', error.message)
    } else {
      console.log('✅ Connexion à Supabase réussie')
    }

    console.log('\n📋 INSTRUCTIONS POUR EXÉCUTER LA MIGRATION SÉCURISÉE:')
    console.log('=' * 60)
    console.log('\n🔧 NOUVEAU SCRIPT SÉCURISÉ CRÉÉ:')
    console.log('   📁 Fichier: supabase/migration-safe.sql')
    console.log('   ✨ Avantages: Évite les conflits de contraintes')
    console.log('   🛡️  Sécurisé: Vérifications avant chaque opération')
    
    console.log('\n🚀 ÉTAPES D\'EXÉCUTION:')
    console.log('   1. 🌐 Ouvrir: https://supabase.com/dashboard')
    console.log('   2. 📂 Projet: fhewhxjprkksjriohxpv')
    console.log('   3. ⚙️  Aller dans: SQL Editor')
    console.log('   4. 📝 Copier: supabase/migration-safe.sql')
    console.log('   5. ▶️  Exécuter: Cliquer "Run"')
    console.log('   6. ✅ Attendre: Message de succès')
    
    console.log('\n🎯 RÉSULTAT ATTENDU:')
    console.log('   ✅ "Migration sécurisée Supabase terminée avec succès! 🎉"')
    console.log('   ✅ Aucune erreur de contrainte')
    console.log('   ✅ Toutes les tables créées')
    
    console.log('\n🧪 APRÈS LA MIGRATION:')
    console.log('   🔍 Vérifier: node scripts/check-supabase-schema.js')
    console.log('   🚀 Tester: node scripts/test-supabase-integration.js')
    console.log('   💻 Lancer: npm run dev --workspace=@ecommerce/web')
    
    console.log('\n💡 AVANTAGES DU SCRIPT SÉCURISÉ:')
    console.log('   ✅ Évite les erreurs de contraintes existantes')
    console.log('   ✅ Vérifie avant chaque modification')
    console.log('   ✅ Idempotent (peut être exécuté plusieurs fois)')
    console.log('   ✅ Conserve les données existantes')
    console.log('   ✅ Gestion des conflits automatique')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

testConnection()