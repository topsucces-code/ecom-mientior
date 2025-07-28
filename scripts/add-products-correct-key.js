const fetch = require('node-fetch');

const SUPABASE_URL = 'https://fhewhxjprkksjriohxpv.supabase.co';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G';

// IDs des catégories (récupérés de l'analyse)
const CATEGORIES = {
  electronics: '550e8400-e29b-41d4-a716-446655440001',
  clothing: '550e8400-e29b-41d4-a716-446655440002', 
  books: '550e8400-e29b-41d4-a716-446655440003',
  electronique: '179f2a0d-285b-4668-90f0-0687ea19e963',
  vetements: '1ebddf49-8f9e-4f80-a85e-ecc39cf0dc4b',
  maison: '9714ecd1-69d4-4e7d-a88d-1d257b900acd'
};

// 5 produits de test pour commencer
const testProducts = [
  {
    name: 'iPad Air 5e génération',
    description: 'Tablette Apple avec puce M1, écran Liquid Retina 10.9", parfaite pour le travail et les loisirs',
    price: 699.99,
    compare_at_price: 799.99,
    sku: 'IPAD-AIR-M1',
    inventory_quantity: 30,
    category_id: CATEGORIES.electronics,
    brand: 'Apple',
    tags: ['tablette', 'apple', 'm1', 'ipad'],
    featured: true,
    status: 'active'
  },
  {
    name: 'Webcam HD 1080p',
    description: 'Webcam haute définition avec micro intégré, idéale pour le télétravail',
    price: 89.99,
    sku: 'WEBCAM-HD-1080',
    inventory_quantity: 60,
    category_id: CATEGORIES.electronics,
    brand: 'StreamTech',
    tags: ['webcam', 'hd', 'télétravail', 'streaming'],
    featured: true,
    status: 'active'
  },
  {
    name: 'Baskets Running Femme',
    description: 'Chaussures de running légères avec amorti responsive, parfaites pour le sport',
    price: 129.99,
    sku: 'SNEAKERS-RUN-WOMEN',
    inventory_quantity: 45,
    category_id: CATEGORIES.clothing,
    brand: 'SportFlow',
    tags: ['baskets', 'running', 'femme', 'sport'],
    featured: true,
    status: 'active'
  },
  {
    name: 'Guide Photographie Numérique',
    description: 'Manuel complet de photographie numérique, techniques avancées et astuces',
    price: 39.99,
    sku: 'BOOK-PHOTO-DIGITAL-GUIDE',
    inventory_quantity: 40,
    category_id: CATEGORIES.books,
    brand: 'PhotoEditions',
    tags: ['livre', 'photographie', 'numérique', 'guide'],
    featured: false,
    status: 'active'
  },
  {
    name: 'Enceinte Bluetooth Portable',
    description: 'Haut-parleur Bluetooth étanche IPX7, son 360°, autonomie 12h',
    price: 79.99,
    sku: 'SPEAKER-BT-PORTABLE-12H',
    inventory_quantity: 55,
    category_id: CATEGORIES.electronique,
    brand: 'SoundWave',
    tags: ['enceinte', 'bluetooth', 'portable', 'étanche'],
    featured: true,
    status: 'active'
  }
];

async function testConnection() {
  console.log('🔍 Test de connexion avec la clé publique...');
  
  try {
    // Test de lecture
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=count`,
      {
        headers: {
          'apikey': SUPABASE_PUBLIC_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connexion réussie !');
      console.log(`📊 Produits actuels: ${data[0]?.count || 'N/A'}`);
      return true;
    } else {
      console.log('❌ Erreur de connexion:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    return false;
  }
}

async function addTestProducts() {
  console.log('🚀 Tentative d\'ajout de 5 produits de test...');
  
  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const product of testProducts) {
    try {
      // Vérifier si le produit existe déjà
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/products?sku=eq.${product.sku}`,
        {
          headers: {
            'apikey': SUPABASE_PUBLIC_KEY,
            'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`
          }
        }
      );
      
      const existing = await checkResponse.json();
      
      if (existing.length > 0) {
        console.log(`⚠️  SKU ${product.sku} existe déjà - ignoré`);
        skippedCount++;
        continue;
      }
      
      // Tenter d'ajouter le produit
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLIC_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        console.log(`✅ Ajouté: ${product.name} (${product.sku})`);
        addedCount++;
      } else {
        const error = await response.text();
        console.log(`❌ Erreur ${product.sku}:`, error);
        errorCount++;
      }
      
      // Pause pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`❌ Exception ${product.sku}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 RÉSULTATS:`);
  console.log(`   ✅ Produits ajoutés: ${addedCount}`);
  console.log(`   ⚠️  Produits ignorés: ${skippedCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log(`\n💡 Si erreurs RLS: utilisez le script SQL dans le dashboard Supabase`);
    console.log(`📁 Script prêt: supabase/add-products-massive.sql`);
  }
  
  if (addedCount > 0) {
    console.log(`\n🎉 ${addedCount} produits ajoutés ! Rafraîchissez localhost:3010`);
  }
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    await addTestProducts();
  } else {
    console.log('\n💡 Solutions alternatives:');
    console.log('1. Vérifiez que RLS est bien désactivé sur la table products');
    console.log('2. Utilisez le script SQL: supabase/add-products-massive.sql');
    console.log('3. Vérifiez la clé API dans le dashboard Supabase');
  }
}

main().catch(console.error);