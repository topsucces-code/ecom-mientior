// Script pour vérifier et migrer le schéma Supabase
// Exécuter avec: node scripts/check-supabase-schema.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = 'https://fhewhxjprkksjriohxpv.supabase.co'
const supabaseAnonKey = 'sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Liste des tables requises pour le schéma complet
const REQUIRED_TABLES = [
  'profiles',
  'vendors', 
  'products',
  'orders',
  'order_items',
  'reviews',
  'cart_items',
  'wishlist_items',
  'inventory',
  'inventory_movements',
  'commissions',
  'chat_agents',
  'chat_conversations', 
  'chat_messages',
  'categories',
  'user_interactions'
]

// Colonnes requises pour chaque table
const REQUIRED_COLUMNS = {
  profiles: [
    'id', 'email', 'first_name', 'last_name', 'role', 'avatar_url', 
    'phone', 'address', 'preferences', 'created_at', 'updated_at'
  ],
  products: [
    'id', 'vendor_id', 'name', 'description', 'price', 'category', 
    'subcategory', 'sku', 'images', 'specifications', 'tags', 
    'status', 'featured', 'rating', 'review_count', 'created_at', 'updated_at'
  ],
  orders: [
    'id', 'customer_id', 'status', 'total_amount', 'tax_amount', 
    'shipping_amount', 'discount_amount', 'payment_status', 'payment_method',
    'shipping_address', 'billing_address', 'tracking_number', 'notes', 
    'metadata', 'created_at', 'updated_at'
  ]
}

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(0)
    return !error
  } catch (err) {
    return false
  }
}

async function getTableColumns(tableName) {
  try {
    // Utiliser une requête pour obtenir les colonnes de la table
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName })
    
    if (error) {
      console.log(`⚠️  Impossible de récupérer les colonnes de ${tableName}`)
      return []
    }
    
    return data || []
  } catch (err) {
    // Fallback: tenter une requête vide pour déduire la structure
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(0)
      if (error) return []
      return Object.keys(data?.[0] || {})
    } catch {
      return []
    }
  }
}

async function checkSchema() {
  console.log('🔍 Vérification du schéma Supabase...\n')
  
  const missingTables = []
  const existingTables = []
  const incompleteColumns = {}

  // Vérifier chaque table requise
  for (const table of REQUIRED_TABLES) {
    const exists = await checkTableExists(table)
    
    if (exists) {
      console.log(`✅ Table ${table} existe`)
      existingTables.push(table)
      
      // Vérifier les colonnes pour les tables critiques
      if (REQUIRED_COLUMNS[table]) {
        const columns = await getTableColumns(table)
        const missingCols = REQUIRED_COLUMNS[table].filter(col => 
          !columns.includes(col)
        )
        
        if (missingCols.length > 0) {
          console.log(`⚠️  Table ${table} - colonnes manquantes: ${missingCols.join(', ')}`)
          incompleteColumns[table] = missingCols
        }
      }
    } else {
      console.log(`❌ Table ${table} manquante`)
      missingTables.push(table)
    }
  }

  return {
    missingTables,
    existingTables,
    incompleteColumns,
    totalTables: REQUIRED_TABLES.length,
    existingTablesCount: existingTables.length
  }
}

async function suggestMigrationSteps(schemaCheck) {
  console.log('\n📋 RAPPORT DE MIGRATION\n')
  console.log('=' * 50)
  
  console.log(`\n📊 STATUT ACTUEL:`)
  console.log(`   Tables existantes: ${schemaCheck.existingTablesCount}/${schemaCheck.totalTables}`)
  console.log(`   Progression: ${Math.round((schemaCheck.existingTablesCount / schemaCheck.totalTables) * 100)}%`)

  if (schemaCheck.missingTables.length > 0) {
    console.log(`\n❌ TABLES MANQUANTES (${schemaCheck.missingTables.length}):`)
    schemaCheck.missingTables.forEach(table => {
      console.log(`   - ${table}`)
    })
  }

  if (Object.keys(schemaCheck.incompleteColumns).length > 0) {
    console.log(`\n⚠️  COLONNES MANQUANTES:`)
    for (const [table, columns] of Object.entries(schemaCheck.incompleteColumns)) {
      console.log(`   ${table}: ${columns.join(', ')}`)
    }
  }

  console.log(`\n🔧 ÉTAPES DE MIGRATION RECOMMANDÉES:`)
  
  if (schemaCheck.missingTables.length > 0 || Object.keys(schemaCheck.incompleteColumns).length > 0) {
    console.log(`\n1. Exécuter le script de migration complet:`)
    console.log(`   📁 Fichier: supabase/migration-complete-schema.sql`)
    console.log(`   🎯 Action: Copier et exécuter dans l'éditeur SQL de Supabase`)
    
    console.log(`\n2. Vérifier les fonctions personnalisées:`)
    console.log(`   📁 Fichier: supabase/database-functions.sql`)
    console.log(`   🎯 Action: Exécuter les fonctions avancées`)
    
    console.log(`\n3. Configurer Row Level Security:`)
    console.log(`   🔒 Les politiques RLS seront appliquées automatiquement`)
    
    console.log(`\n4. Tester la migration:`)
    console.log(`   🧪 Commande: node scripts/test-supabase-integration.js`)
  } else {
    console.log(`   ✅ Schéma complet - Aucune migration nécessaire!`)
  }

  return schemaCheck
}

async function createMigrationGuide(schemaCheck) {
  const guideContent = `
# Guide de Migration Supabase - E-commerce Platform

## Statut Actuel
- Tables existantes: ${schemaCheck.existingTablesCount}/${schemaCheck.totalTables}
- Progression: ${Math.round((schemaCheck.existingTablesCount / schemaCheck.totalTables) * 100)}%

## Tables Manquantes
${schemaCheck.missingTables.map(table => `- ${table}`).join('\n')}

## Colonnes Manquantes
${Object.entries(schemaCheck.incompleteColumns).map(([table, columns]) => 
  `- ${table}: ${columns.join(', ')}`
).join('\n')}

## Instructions de Migration

### 1. Ouvrir Supabase Dashboard
1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Aller dans "SQL Editor"

### 2. Exécuter le Script de Migration
1. Copier le contenu de \`supabase/migration-complete-schema.sql\`
2. Coller dans l'éditeur SQL
3. Cliquer sur "Run"

### 3. Exécuter les Fonctions Avancées
1. Copier le contenu de \`supabase/database-functions.sql\`
2. Coller dans l'éditeur SQL
3. Cliquer sur "Run"

### 4. Vérifier la Migration
Exécuter le script de test:
\`\`\`bash
node scripts/test-supabase-integration.js
\`\`\`

### 5. Configurer les Variables d'Environnement
Vérifier que vos fichiers .env.local contiennent:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://fhewhxjprkksjriohxpv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G
\`\`\`

## Prochaines Étapes Après Migration
1. Tester l'authentification
2. Tester la création de produits
3. Tester le panier et les commandes
4. Configurer les paiements (Stripe/PayPal)
5. Optimiser les performances

---
Généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}
`

  const guidePath = path.join(process.cwd(), 'MIGRATION_GUIDE.md')
  fs.writeFileSync(guidePath, guideContent)
  console.log(`\n📝 Guide de migration créé: ${guidePath}`)
}

async function main() {
  console.log('🚀 VÉRIFICATION ET MIGRATION DU SCHÉMA SUPABASE')
  console.log('=' * 60)
  
  try {
    const schemaCheck = await checkSchema()
    await suggestMigrationSteps(schemaCheck)
    await createMigrationGuide(schemaCheck)
    
    console.log('\n🎯 ACTIONS RECOMMANDÉES:')
    
    if (schemaCheck.missingTables.length > 0) {
      console.log('\n🔴 MIGRATION REQUISE:')
      console.log('   1. Ouvrir Supabase Dashboard > SQL Editor')
      console.log('   2. Exécuter: supabase/migration-complete-schema.sql')
      console.log('   3. Exécuter: supabase/database-functions.sql')
      console.log('   4. Relancer ce script pour vérifier')
    } else {
      console.log('\n🟢 SCHÉMA PRÊT:')
      console.log('   1. Lancer les applications: npm run dev')
      console.log('   2. Tester les fonctionnalités')
      console.log('   3. Configurer les paiements')
    }
    
    console.log('\n✨ Vérification terminée!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
    process.exit(1)
  }
}

// Exécuter la vérification
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { checkSchema, suggestMigrationSteps }