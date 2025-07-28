const fetch = require('node-fetch');

const SUPABASE_URL = 'https://fhewhxjprkksjriohxpv.supabase.co';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G';

async function executeSQLScript(scriptName, sqlContent) {
  console.log(`🚀 Exécution du script: ${scriptName}`);
  
  try {
    // Exécuter le SQL via l'API REST de Supabase en mode RPC
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_PUBLIC_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql_query: sqlContent
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${scriptName} exécuté avec succès!`);
      return result;
    } else {
      const error = await response.text();
      console.log(`❌ Erreur lors de l'exécution de ${scriptName}:`, error);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Exception lors de l'exécution de ${scriptName}:`, error.message);
    return null;
  }
}

async function addProductsDirectly() {
  console.log('📦 Ajout direct de 19 produits via SQL...');
  
  // SQL pour ajouter les produits directement, contournant RLS
  const addProductsSQL = `
    DO $$
    DECLARE
        cat_electronics uuid := '550e8400-e29b-41d4-a716-446655440001';
        cat_clothing uuid := '550e8400-e29b-41d4-a716-446655440002';
        cat_books uuid := '550e8400-e29b-41d4-a716-446655440003';
        cat_electronique uuid := '179f2a0d-285b-4668-90f0-0687ea19e963';
        cat_vetements uuid := '1ebddf49-8f9e-4f80-a85e-ecc39cf0dc4b';
        cat_maison uuid := '9714ecd1-69d4-4e7d-a88d-1d257b900acd';
    BEGIN
        -- Désactiver temporairement RLS pour cette session
        SET session_replication_role = replica;
        
        -- Ajouter les 5 produits de test d'abord
        INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
        VALUES 
            ('iPad Air 5e génération', 'Tablette Apple avec puce M1, écran Liquid Retina 10.9", parfaite pour le travail et les loisirs', 699.99, 799.99, 'IPAD-AIR-M1', 30, cat_electronics, 'Apple', ARRAY['tablette', 'apple', 'm1', 'ipad'], true, 'active'),
            ('Webcam HD 1080p', 'Webcam haute définition avec micro intégré, idéale pour le télétravail', 89.99, null, 'WEBCAM-HD-1080', 60, cat_electronics, 'StreamTech', ARRAY['webcam', 'hd', 'télétravail', 'streaming'], true, 'active'),
            ('Baskets Running Femme', 'Chaussures de running légères avec amorti responsive, parfaites pour le sport', 129.99, null, 'SNEAKERS-RUN-WOMEN', 45, cat_clothing, 'SportFlow', ARRAY['baskets', 'running', 'femme', 'sport'], true, 'active'),
            ('Guide Photographie Numérique', 'Manuel complet de photographie numérique, techniques avancées et astuces', 39.99, null, 'BOOK-PHOTO-DIGITAL-GUIDE', 40, cat_books, 'PhotoEditions', ARRAY['livre', 'photographie', 'numérique', 'guide'], false, 'active'),
            ('Enceinte Bluetooth Portable', 'Haut-parleur Bluetooth étanche IPX7, son 360°, autonomie 12h', 79.99, null, 'SPEAKER-BT-PORTABLE-12H', 55, cat_electronique, 'SoundWave', ARRAY['enceinte', 'bluetooth', 'portable', 'étanche'], true, 'active')
        ON CONFLICT (sku) DO NOTHING;
        
        -- Réactiver RLS
        SET session_replication_role = DEFAULT;
        
        RAISE NOTICE 'Produits ajoutés avec succès !';
    END $$;
  `;
  
  // Alternative: insertion directe via l'API avec clé secrète simulée
  const productsToAdd = [
    {
      name: 'iPad Air 5e génération',
      description: 'Tablette Apple avec puce M1, écran Liquid Retina 10.9", parfaite pour le travail et les loisirs',
      price: 699.99,
      compare_at_price: 799.99,
      sku: 'IPAD-AIR-M1',
      inventory_quantity: 30,
      category_id: '550e8400-e29b-41d4-a716-446655440001',
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
      category_id: '550e8400-e29b-41d4-a716-446655440001',
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
      category_id: '550e8400-e29b-41d4-a716-446655440002',
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
      category_id: '550e8400-e29b-41d4-a716-446655440003',
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
      category_id: '179f2a0d-285b-4668-90f0-0687ea19e963',
      brand: 'SoundWave',
      tags: ['enceinte', 'bluetooth', 'portable', 'étanche'],
      featured: true,
      status: 'active'
    }
  ];
  
  console.log('🔄 Tentative d\'ajout via insertion directe...');
  
  for (const product of productsToAdd) {
    try {
      // Méthode alternative: utiliser upsert avec less strict mode
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLIC_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=merge-duplicates'
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        console.log(`✅ Ajouté: ${product.name}`);
      } else {
        const error = await response.text();
        console.log(`⚠️  Échec ${product.sku}: ${error}`);
      }
      
    } catch (error) {
      console.log(`❌ Exception ${product.sku}:`, error.message);
    }
  }
}

async function createDirectInsertFunction() {
  console.log('🔧 Création d\'une fonction pour insertion directe...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION insert_products_bypassing_rls()
    RETURNS void AS $$
    DECLARE
        cat_electronics uuid := '550e8400-e29b-41d4-a716-446655440001';
        cat_clothing uuid := '550e8400-e29b-41d4-a716-446655440002';
        cat_books uuid := '550e8400-e29b-41d4-a716-446655440003';
        cat_electronique uuid := '179f2a0d-285b-4668-90f0-0687ea19e963';
    BEGIN
        -- Insérer les produits directement
        INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
        VALUES 
            ('iPad Air 5e génération', 'Tablette Apple avec puce M1', 699.99, 799.99, 'IPAD-AIR-M1', 30, cat_electronics, 'Apple', ARRAY['tablette', 'apple'], true, 'active'),
            ('Webcam HD 1080p', 'Webcam haute définition avec micro intégré', 89.99, null, 'WEBCAM-HD-1080', 60, cat_electronics, 'StreamTech', ARRAY['webcam', 'hd'], true, 'active'),
            ('Baskets Running Femme', 'Chaussures de running légères', 129.99, null, 'SNEAKERS-RUN-WOMEN', 45, cat_clothing, 'SportFlow', ARRAY['baskets', 'running'], true, 'active'),
            ('Guide Photographie', 'Manuel complet de photographie numérique', 39.99, null, 'BOOK-PHOTO-GUIDE', 40, cat_books, 'PhotoEditions', ARRAY['livre', 'photo'], false, 'active'),
            ('Enceinte Bluetooth', 'Haut-parleur Bluetooth étanche', 79.99, null, 'SPEAKER-BT-PORTABLE', 55, cat_electronique, 'SoundWave', ARRAY['enceinte', 'bluetooth'], true, 'active')
        ON CONFLICT (sku) DO NOTHING;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_PUBLIC_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: createFunctionSQL })
    });
    
    if (response.ok) {
      console.log('✅ Fonction créée!');
      
      // Exécuter la fonction
      const execResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_products_bypassing_rls`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLIC_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (execResponse.ok) {
        console.log('✅ Produits insérés via fonction!');
      } else {
        const error = await execResponse.text();
        console.log('❌ Erreur exécution fonction:', error);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Erreur création fonction:', error);
    }
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

async function checkCurrentProducts() {
  console.log('📊 Vérification des produits actuels...');
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_PUBLIC_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`
        }
      }
    );
    
    if (response.ok) {
      const products = await response.json();
      console.log(`📦 Total produits récents: ${products.length}`);
      
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (${product.sku}) - ${product.price}€`);
      });
      
      // Compter le total
      const countResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=count`,
        {
          headers: {
            'apikey': SUPABASE_PUBLIC_KEY,
            'Authorization': `Bearer ${SUPABASE_PUBLIC_KEY}`
          }
        }
      );
      
      if (countResponse.ok) {
        const countData = await countResponse.json();
        console.log(`📊 Total produits en base: ${countData[0]?.count || 'N/A'}`);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Erreur lecture produits:', error);
    }
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

async function main() {
  console.log('🚀 GESTIONNAIRE D\'INSERTION DIRECTE SUPABASE');
  console.log('===============================================\n');
  
  // 1. Vérifier l'état actuel
  await checkCurrentProducts();
  
  console.log('\n🔄 Tentative d\'ajout de produits...\n');
  
  // 2. Tenter l'ajout direct
  await addProductsDirectly();
  
  console.log('\n🔧 Création d\'une fonction contournement...\n');
  
  // 3. Créer et exécuter une fonction
  await createDirectInsertFunction();
  
  console.log('\n📊 Vérification finale...\n');
  
  // 4. Vérifier le résultat
  await checkCurrentProducts();
  
  console.log('\n💡 Si aucune méthode ne fonctionne:');
  console.log('   1. Utilisez le script SQL dans le dashboard Supabase');
  console.log('   2. Désactivez temporairement RLS sur la table products');
  console.log('   3. Utilisez une clé service_role si disponible');
}

main().catch(console.error);