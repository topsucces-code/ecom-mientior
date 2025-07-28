const fs = require('fs');
const path = require('path');

// Simuler l'exécution de notre script SQL via l'API
const products = [
  // Electronics
  {
    name: "iPad Air 5e génération",
    description: "Tablette Apple avec puce M1, écran Liquid Retina 10.9\", parfaite pour le travail et les loisirs",
    price: 699.99,
    compare_at_price: 799.99,
    sku: "IPAD-AIR-M1",
    inventory_quantity: 30,
    category: "electronics",
    brand: "Apple",
    tags: ["tablette", "apple", "m1", "ipad"],
    featured: true
  },
  {
    name: "Clavier Mécanique RGB",
    description: "Clavier gaming mécanique avec rétroéclairage RGB, switches Cherry MX",
    price: 159.99,
    sku: "KEYBOARD-RGB-MX",
    inventory_quantity: 40,
    category: "electronics",
    brand: "GamerTech",
    tags: ["clavier", "gaming", "rgb", "mécanique"],
    featured: false
  },
  {
    name: "Écran 4K 27 pouces",
    description: "Moniteur 4K UHD 27\" avec HDR, parfait pour le gaming et le design",
    price: 449.99,
    compare_at_price: 549.99,
    sku: "MONITOR-4K-27",
    inventory_quantity: 20,
    category: "electronics",
    brand: "ViewMaster",
    tags: ["écran", "4k", "moniteur", "hdr"],
    featured: false
  },
  {
    name: "Webcam HD 1080p",
    description: "Webcam haute définition avec micro intégré, idéale pour le télétravail",
    price: 89.99,
    sku: "WEBCAM-HD-1080",
    inventory_quantity: 60,
    category: "electronics",
    brand: "StreamTech",
    tags: ["webcam", "hd", "télétravail", "streaming"],
    featured: true
  },
  {
    name: "Chargeur Sans Fil Rapide",
    description: "Station de charge sans fil 15W compatible iPhone et Android",
    price: 39.99,
    sku: "CHARGER-WIRELESS-15W",
    inventory_quantity: 80,
    category: "electronics",
    brand: "PowerMax",
    tags: ["chargeur", "sans-fil", "qi", "rapide"],
    featured: false
  },
  // Clothing
  {
    name: "Hoodie Unisexe Premium",
    description: "Sweat à capuche unisexe en coton bio, coupe décontractée, plusieurs coloris",
    price: 79.99,
    compare_at_price: 99.99,
    sku: "HOODIE-UNISEX-PREMIUM",
    inventory_quantity: 60,
    category: "clothing",
    brand: "UrbanStyle",
    tags: ["hoodie", "unisexe", "coton", "bio"],
    featured: false
  },
  {
    name: "Baskets Running Femme",
    description: "Chaussures de running légères avec amorti responsive, parfaites pour le sport",
    price: 129.99,
    sku: "SNEAKERS-RUN-WOMEN",
    inventory_quantity: 45,
    category: "clothing",
    brand: "SportFlow",
    tags: ["baskets", "running", "femme", "sport"],
    featured: true
  },
  {
    name: "Veste en Cuir Homme",
    description: "Veste en cuir véritable, style motard, coupe slim, finitions soignées",
    price: 299.99,
    sku: "JACKET-LEATHER-MEN",
    inventory_quantity: 25,
    category: "clothing",
    brand: "LeatherCraft",
    tags: ["veste", "cuir", "homme", "motard"],
    featured: false
  },
  {
    name: "Robe d'été Fleurie",
    description: "Robe légère en viscose avec motifs floraux, parfaite pour l'été",
    price: 59.99,
    compare_at_price: 79.99,
    sku: "DRESS-SUMMER-FLORAL",
    inventory_quantity: 35,
    category: "clothing",
    brand: "SummerVibes",
    tags: ["robe", "été", "fleurie", "viscose"],
    featured: false
  },
  {
    name: "Montre Connectée Sport",
    description: "Smartwatch avec GPS, capteur cardiaque, étanche, autonomie 7 jours",
    price: 199.99,
    sku: "SMARTWATCH-SPORT-GPS",
    inventory_quantity: 40,
    category: "electronics",
    brand: "FitTracker",
    tags: ["montre", "connectée", "sport", "gps"],
    featured: false
  },
  // Books
  {
    name: "Guide Photographie Numérique",
    description: "Manuel complet de photographie numérique, techniques avancées et astuces",
    price: 39.99,
    sku: "BOOK-PHOTO-DIGITAL-GUIDE",
    inventory_quantity: 40,
    category: "books",
    brand: "PhotoEditions",
    tags: ["livre", "photographie", "numérique", "guide"],
    featured: false
  },
  {
    name: "Roman Fantasy Épique",
    description: "Trilogie fantasy complète, monde imaginaire riche, aventure épique",
    price: 29.99,
    compare_at_price: 34.99,
    sku: "BOOK-FANTASY-TRILOGY",
    inventory_quantity: 60,
    category: "books",
    brand: "FantasyPress",
    tags: ["livre", "fantasy", "roman", "trilogie"],
    featured: false
  },
  // Additional products
  {
    name: "Enceinte Bluetooth Portable",
    description: "Haut-parleur Bluetooth étanche IPX7, son 360°, autonomie 12h",
    price: 79.99,
    sku: "SPEAKER-BT-PORTABLE-12H",
    inventory_quantity: 55,
    category: "electronics",
    brand: "SoundWave",
    tags: ["enceinte", "bluetooth", "portable", "étanche"],
    featured: true
  },
  {
    name: "Sac à Dos Urbain",
    description: "Sac à dos moderne avec compartiment laptop, port USB, résistant à l'eau",
    price: 59.99,
    compare_at_price: 79.99,
    sku: "BACKPACK-URBAN-LAPTOP",
    inventory_quantity: 35,
    category: "clothing",
    brand: "CityBag",
    tags: ["sac", "dos", "urbain", "laptop"],
    featured: false
  },
  {
    name: "Lunettes de Soleil Aviateur",
    description: "Lunettes de soleil style aviateur, verres polarisés, protection UV 100%",
    price: 119.99,
    sku: "SUNGLASSES-AVIATOR-UV",
    inventory_quantity: 45,
    category: "clothing",
    brand: "SunStyle",
    tags: ["lunettes", "soleil", "aviateur", "uv"],
    featured: true
  }
];

// Écrire dans un fichier JSON pour les données
const outputPath = path.join(__dirname, 'test-products-data.json');
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

console.log('🎯 Données des produits générées !');
console.log(`📁 Fichier: ${outputPath}`);
console.log(`📊 Nombre de produits: ${products.length}`);
console.log('');
console.log('📋 Résumé par catégorie:');
const categoryCounts = products.reduce((acc, product) => {
  acc[product.category] = (acc[product.category] || 0) + 1;
  return acc;
}, {});

Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`   - ${category}: ${count} produits`);
});

const featuredCount = products.filter(p => p.featured).length;
console.log(`   - Featured: ${featuredCount} produits`);

console.log('');
console.log('🚀 Pour insérer ces produits dans la base de données:');
console.log('1. Utilisez le dashboard Supabase SQL Editor');
console.log('2. Exécutez le script: supabase/add-more-products.sql');
console.log('3. Ou configurez SUPABASE_SERVICE_ROLE_KEY dans .env.local');