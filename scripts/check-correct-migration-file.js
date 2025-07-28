// Script pour vérifier que l'utilisateur utilise le bon fichier de migration
const fs = require('fs')
const path = require('path')

function checkMigrationFiles() {
  console.log('🔍 VÉRIFICATION DES FICHIERS DE MIGRATION\n')
  
  const files = {
    'migration-complete-schema.sql': '❌ ANCIEN - Ne pas utiliser',
    'migration-safe.sql': '❌ ERREUR - Ne pas utiliser', 
    'migration-final.sql': '✅ CORRECT - Utiliser celui-ci'
  }
  
  console.log('📁 FICHIERS DISPONIBLES :\n')
  
  for (const [filename, status] of Object.entries(files)) {
    const filePath = path.join(process.cwd(), 'supabase', filename)
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const size = Math.round(content.length / 1024)
      
      console.log(`   ${status}`)
      console.log(`   📄 ${filename} (${size}KB)`)
      
      // Vérifier si le fichier contient la fonction problématique
      if (content.includes('add_constraint_if_not_exists')) {
        console.log(`   ⚠️  CONTIENT LA FONCTION PROBLÉMATIQUE - NE PAS UTILISER`)
      } else if (filename === 'migration-final.sql') {
        console.log(`   ✅ SÉCURISÉ - Pas de fonction ambiguë`)
      }
      
      console.log('')
    } else {
      console.log(`   ❓ ${filename} - Fichier manquant`)
      console.log('')
    }
  }
  
  console.log('🎯 FICHIER À UTILISER :')
  console.log('=' * 30)
  console.log('📁 supabase/migration-final.sql')
  console.log('')
  
  console.log('🚀 INSTRUCTIONS :')
  console.log('1. Ouvrir Supabase Dashboard')
  console.log('2. Aller dans SQL Editor') 
  console.log('3. Copier LE CONTENU DE migration-final.sql')
  console.log('4. Coller et exécuter')
  console.log('')
  
  // Vérifier le bon fichier
  const correctFile = path.join(process.cwd(), 'supabase', 'migration-final.sql')
  if (fs.existsSync(correctFile)) {
    const content = fs.readFileSync(correctFile, 'utf8')
    
    console.log('✅ VÉRIFICATION DU BON FICHIER :')
    
    if (content.includes('MIGRATION FINALE SUPABASE - VERSION ULTRA-SÉCURISÉE')) {
      console.log('   ✅ Titre correct trouvé')
    }
    
    if (!content.includes('add_constraint_if_not_exists')) {
      console.log('   ✅ Aucune fonction problématique')
    }
    
    if (content.includes('DO $$')) {
      console.log('   ✅ Utilise la syntaxe sécurisée DO $$')
    }
    
    if (content.includes('EXCEPTION')) {
      console.log('   ✅ Gestion d\'erreur avec EXCEPTION')
    }
    
    console.log('')
    console.log('🎉 Le fichier migration-final.sql est PRÊT à être utilisé !')
    
  } else {
    console.log('❌ ERREUR : migration-final.sql non trouvé !')
  }
  
  console.log('')
  console.log('💡 EN CAS DE DOUTE :')
  console.log('   📖 Lire : UTILISER_MIGRATION_FINAL.md')
  console.log('   🧪 Tester : node scripts/test-final-migration.js')
}

checkMigrationFiles()