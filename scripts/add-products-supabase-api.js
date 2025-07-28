const fetch = require('node-fetch');

const SUPABASE_URL = 'https://fhewhxjprkksjriohxpv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoZXdoeGpwcmtrc2pyaW9oeHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NDU1NTAsImV4cCI6MjA2ODAyMTU1MH0.xDvbP68uatOw2g5udhP-zAPj06F861mV-Mi8FEvYPyA';

// IDs des catégories (récupérés de l'analyse)
const CATEGORIES = {
  electronics: '550e8400-e29b-41d4-a716-446655440001',
  clothing: '550e8400-e29b-41d4-a716-446655440002',
  books: '550e8400-e29b-41d4-a716-446655440003',
  electronique: '179f2a0d-285b-4668-90f0-0687ea19e963',
  vetements: '1ebddf49-8f9e-4f80-a85e-ecc39cf0dc4b',
  maison: '9714ecd1-69d4-4e7d-a88d-1d257b900acd'
};

// Nouveaux produits à ajouter
const newProducts = [
  // Electronics
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
    name: 'Clavier Mécanique RGB',
    description: 'Clavier gaming mécanique avec rétroéclairage RGB, switches Cherry MX',
    price: 159.99,
    sku: 'KEYBOARD-RGB-MX',
    inventory_quantity: 40,
    category_id: CATEGORIES.electronics,
    brand: 'GamerTech',
    tags: ['clavier', 'gaming', 'rgb', 'mécanique'],
    featured: false,
    status: 'active'
  },
  {
    name: 'Écran 4K 27 pouces',
    description: 'Moniteur 4K UHD 27" avec HDR, parfait pour le gaming et le design',
    price: 449.99,
    compare_at_price: 549.99,
    sku: 'MONITOR-4K-27',
    inventory_quantity: 20,
    category_id: CATEGORIES.electronics,
    brand: 'ViewMaster',
    tags: ['écran', '4k', 'moniteur', 'hdr'],
    featured: false,
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
    name: 'Chargeur Sans Fil Rapide',
    description: 'Station de charge sans fil 15W compatible iPhone et Android',
    price: 39.99,
    sku: 'CHARGER-WIRELESS-15W',
    inventory_quantity: 80,
    category_id: CATEGORIES.electronics,
    brand: 'PowerMax',
    tags: ['chargeur', 'sans-fil', 'qi', 'rapide'],
    featured: false,
    status: 'active'
  },
  // Clothing
  {
    name: 'Hoodie Unisexe Premium',
    description: 'Sweat à capuche unisexe en coton bio, coupe décontractée, plusieurs coloris',
    price: 79.99,
    compare_at_price: 99.99,
    sku: 'HOODIE-UNISEX-PREMIUM',
    inventory_quantity: 60,
    category_id: CATEGORIES.clothing,
    brand: 'UrbanStyle',
    tags: ['hoodie', 'unisexe', 'coton', 'bio'],
    featured: false,
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
    name: 'Veste en Cuir Homme',
    description: 'Veste en cuir véritable, style motard, coupe slim, finitions soignées',
    price: 299.99,
    sku: 'JACKET-LEATHER-MEN',
    inventory_quantity: 25,
    category_id: CATEGORIES.clothing,
    brand: 'LeatherCraft',
    tags: ['veste', 'cuir', 'homme', 'motard'],
    featured: false,
    status: 'active'
  },
  {
    name: 'Robe d\'été Fleurie',
    description: 'Robe légère en viscose avec motifs floraux, parfaite pour l\'été',
    price: 59.99,
    compare_at_price: 79.99,
    sku: 'DRESS-SUMMER-FLORAL',
    inventory_quantity: 35,
    category_id: CATEGORIES.clothing,
    brand: 'SummerVibes',
    tags: ['robe', 'été', 'fleurie', 'viscose'],
    featured: false,
    status: 'active'
  },
  // Books
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
    name: 'Roman Fantasy Épique',
    description: 'Trilogie fantasy complète, monde imaginaire riche, aventure épique',
    price: 29.99,
    compare_at_price: 34.99,
    sku: 'BOOK-FANTASY-TRILOGY',
    inventory_quantity: 60,
    category_id: CATEGORIES.books,
    brand: 'FantasyPress',
    tags: ['livre', 'fantasy', 'roman', 'trilogie'],
    featured: false,
    status: 'active'
  },
  // Produits Français - Électronique
  {
    name: 'Smartphone Android Premium',
    description: 'Smartphone Android haut de gamme avec appareil photo 108MP, 5G, écran AMOLED',
    price: 599.99,
    sku: 'ANDROID-PREMIUM-5G',
    inventory_quantity: 35,
    category_id: CATEGORIES.electronique,
    brand: 'TechFrance',
    tags: ['smartphone', 'android', '5g', 'premium'],
    featured: true,
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
  },
  // Vêtements français
  {
    name: 'Sac à Dos Urbain',
    description: 'Sac à dos moderne avec compartiment laptop, port USB, résistant à l\'eau',
    price: 59.99,
    compare_at_price: 79.99,
    sku: 'BACKPACK-URBAN-LAPTOP',
    inventory_quantity: 35,
    category_id: CATEGORIES.vetements,
    brand: 'CityBag',
    tags: ['sac', 'dos', 'urbain', 'laptop'],
    featured: false,
    status: 'active'
  },
  {
    name: 'Lunettes de Soleil Aviateur',
    description: 'Lunettes de soleil style aviateur, verres polarisés, protection UV 100%',
    price: 119.99,
    sku: 'SUNGLASSES-AVIATOR-UV',
    inventory_quantity: 45,
    category_id: CATEGORIES.vetements,
    brand: 'SunStyle',
    tags: ['lunettes', 'soleil', 'aviateur', 'uv'],
    featured: true,
    status: 'active'
  },
  // Maison & Jardin
  {
    name: 'Lampe de Bureau LED',
    description: 'Lampe de bureau moderne avec variateur, port USB, design épuré',
    price: 89.99,
    sku: 'LAMP-DESK-LED-USB',
    inventory_quantity: 50,
    category_id: CATEGORIES.maison,
    brand: 'LightHome',
    tags: ['lampe', 'bureau', 'led', 'usb'],
    featured: true,
    status: 'active'
  },
  {
    name: 'Coussin Décoratif Set',
    description: 'Set de 4 coussins décoratifs en velours, coloris assortis, 45x45cm',
    price: 49.99,
    compare_at_price: 69.99,
    sku: 'CUSHION-SET-VELVET-4',
    inventory_quantity: 30,
    category_id: CATEGORIES.maison,
    brand: 'CozyHome',
    tags: ['coussin', 'décoratif', 'velours', 'set'],
    featured: false,
    status: 'active'
  },
  {
    name: 'Plante Artificielle Monstera',
    description: 'Monstera deliciosa artificielle 120cm, très réaliste, pot inclus',
    price: 79.99,
    sku: 'PLANT-ARTIFICIAL-MONSTERA',
    inventory_quantity: 25,
    category_id: CATEGORIES.maison,
    brand: 'GreenDecor',
    tags: ['plante', 'artificielle', 'monstera', 'décoration'],
    featured: false,
    status: 'active'
  },
  {
    name: 'Kit Café Barista',
    description: 'Kit complet pour faire un café comme un barista : moussoir, doseur, tamper',
    price: 89.99,
    sku: 'COFFEE-KIT-BARISTA',
    inventory_quantity: 25,
    category_id: CATEGORIES.maison,
    brand: 'CoffeePro',
    tags: ['café', 'barista', 'kit', 'moussoir'],
    featured: false,
    status: 'active'
  }
];

async function addProducts() {
  console.log('🚀 Début de l\'ajout massif de produits...');
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const product of newProducts) {
    try {
      // Vérifier si le produit existe déjà
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/products?sku=eq.${product.sku}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      
      const existing = await checkResponse.json();
      
      if (existing.length > 0) {
        console.log(`⚠️  Produit ${product.sku} existe déjà - ignoré`);
        skippedCount++;
        continue;
      }
      
      // Ajouter le produit
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
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
        console.error(`❌ Erreur pour ${product.sku}:`, error);
      }
      
      // Pause pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Erreur pour ${product.sku}:`, error.message);
    }
  }
  
  console.log(`\n📊 Résultats:`);
  console.log(`   ✅ Produits ajoutés: ${addedCount}`);
  console.log(`   ⚠️  Produits ignorés: ${skippedCount}`);
  console.log(`   📦 Total traités: ${addedCount + skippedCount}`);
}

addProducts().catch(console.error);