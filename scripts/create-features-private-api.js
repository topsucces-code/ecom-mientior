const fetch = require('node-fetch');

const SUPABASE_URL = 'https://fhewhxjprkksjriohxpv.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_2mGi5SiBbznugeWK0U8mEA_RaaBlDln';

async function createUserProfiles() {
  console.log('👥 Création de la table user_profiles...');
  
  const users = [
    {
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
    },
    {
      email: 'jane.smith@example.com', 
      full_name: 'Jane Smith',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100'
    },
    {
      email: 'mike.wilson@example.com',
      full_name: 'Mike Wilson', 
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
    }
  ];

  let created = 0;
  for (const user of users) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(user)
      });
      
      if (response.ok) {
        console.log(`✅ Utilisateur créé: ${user.full_name}`);
        created++;
      } else {
        const error = await response.text();
        console.log(`⚠️  ${user.email}: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
  
  return created;
}

async function createPromotions() {
  console.log('\n🎫 Création des promotions...');
  
  const promotions = [
    {
      code: 'WELCOME10',
      name: 'Welcome 10%',
      description: 'Promotion de bienvenue - 10% de réduction',
      discount_type: 'percentage',
      discount_value: 10.00,
      minimum_order: 50.00,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      active: true
    },
    {
      code: 'FREESHIP',
      name: 'Free Shipping',
      description: 'Livraison gratuite pour commandes 75€+',
      discount_type: 'fixed_amount',
      discount_value: 9.99,
      minimum_order: 75.00,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      active: true
    },
    {
      code: 'SUMMER2025',
      name: 'Summer Sale',
      description: 'Soldes d\'été - 25% de réduction',
      discount_type: 'percentage',
      discount_value: 25.00,
      minimum_order: 100.00,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      active: true
    }
  ];

  let created = 0;
  for (const promo of promotions) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/promotions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(promo)
      });
      
      if (response.ok) {
        console.log(`✅ Promotion créée: ${promo.code} (${promo.discount_value}${promo.discount_type === 'percentage' ? '%' : '€'})`);
        created++;
      } else {
        const error = await response.text();
        console.log(`⚠️  ${promo.code}: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
  
  return created;
}

async function createReviews() {
  console.log('\n⭐ Création des avis clients...');
  
  // Récupérer quelques produits et utilisateurs
  const productsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name&limit=5`,
    {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    }
  );
  
  const usersResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/user_profiles?select=id,full_name&limit=3`,
    {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    }
  );
  
  if (!productsResponse.ok || !usersResponse.ok) {
    console.log('❌ Impossible de récupérer les produits ou utilisateurs');
    return 0;
  }
  
  const products = await productsResponse.json();
  const users = await usersResponse.json();
  
  if (products.length === 0 || users.length === 0) {
    console.log('❌ Aucun produit ou utilisateur trouvé');
    return 0;
  }
  
  const reviewsData = [
    {
      product_id: products[0]?.id,
      user_id: users[0]?.id,
      rating: 5,
      title: 'Excellent produit !',
      content: 'Je recommande vivement ce produit, qualité au top. Livraison rapide et service client réactif.',
      verified_purchase: true,
      helpful_count: 12
    },
    {
      product_id: products[0]?.id,
      user_id: users[1]?.id,
      rating: 4,
      title: 'Très satisfait',
      content: 'Bon rapport qualité-prix, conforme à la description. Quelques petites améliorations possibles.',
      verified_purchase: true,
      helpful_count: 8
    },
    {
      product_id: products[1]?.id,
      user_id: users[0]?.id,
      rating: 5,
      title: 'Parfait !',
      content: 'Exactement ce que je cherchais. Design moderne et fonctionnalités complètes.',
      verified_purchase: false,
      helpful_count: 5
    },
    {
      product_id: products[1]?.id,
      user_id: users[2]?.id,
      rating: 3,
      title: 'Correct',
      content: 'Produit correct sans plus. Fait le travail mais sans surprise.',
      verified_purchase: true,
      helpful_count: 3
    },
    {
      product_id: products[2]?.id,
      user_id: users[1]?.id,
      rating: 4,
      title: 'Bon choix',
      content: 'Bonne qualité, je recommande. Petit bémol sur l\'emballage.',
      verified_purchase: true,
      helpful_count: 7
    }
  ];

  let created = 0;
  for (const review of reviewsData) {
    if (!review.product_id || !review.user_id) continue;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/product_reviews`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(review)
      });
      
      if (response.ok) {
        console.log(`✅ Avis créé: ${review.rating}⭐ "${review.title}"`);
        created++;
      } else {
        const error = await response.text();
        console.log(`⚠️  Avis "${review.title}": ${error}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
  
  return created;
}

async function createAnalytics() {
  console.log('\n📊 Création des analytics produits...');
  
  const productsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name&limit=10`,
    {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    }
  );
  
  if (!productsResponse.ok) {
    console.log('❌ Impossible de récupérer les produits');
    return 0;
  }
  
  const products = await productsResponse.json();
  
  let created = 0;
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  for (const product of products) {
    // Analytics d'hier
    const yesterdayAnalytics = {
      product_id: product.id,
      date: yesterday.toISOString().split('T')[0],
      views_count: Math.floor(Math.random() * 100) + 20,
      cart_additions: Math.floor(Math.random() * 15) + 2,
      purchases: Math.floor(Math.random() * 5) + 1,
      revenue: (Math.random() * 500 + 50).toFixed(2)
    };
    
    // Analytics d'aujourd'hui
    const todayAnalytics = {
      product_id: product.id,
      date: today.toISOString().split('T')[0],
      views_count: Math.floor(Math.random() * 150) + 30,
      cart_additions: Math.floor(Math.random() * 20) + 3,
      purchases: Math.floor(Math.random() * 8) + 1,
      revenue: (Math.random() * 800 + 80).toFixed(2)
    };
    
    for (const analytics of [yesterdayAnalytics, todayAnalytics]) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_analytics`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SECRET_KEY,
            'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(analytics)
        });
        
        if (response.ok) {
          created++;
        } else {
          const error = await response.text();
          console.log(`⚠️  Analytics ${analytics.date}: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Erreur analytics: ${error.message}`);
      }
    }
  }
  
  console.log(`✅ ${created} entrées analytics créées pour ${products.length} produits`);
  return created;
}

async function createWishlists() {
  console.log('\n❤️ Création des wishlists...');
  
  // Récupérer utilisateurs et produits
  const [usersResponse, productsResponse] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,full_name&limit=3`, {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name&featured=eq.true&limit=5`, {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    })
  ]);
  
  if (!usersResponse.ok || !productsResponse.ok) {
    console.log('❌ Impossible de récupérer les données');
    return 0;
  }
  
  const users = await usersResponse.json();
  const products = await productsResponse.json();
  
  let created = 0;
  
  // Créer quelques wishlists aléatoirement
  for (const user of users) {
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items par utilisateur
    const shuffledProducts = products.sort(() => 0.5 - Math.random()).slice(0, numItems);
    
    for (const product of shuffledProducts) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wishlists`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SECRET_KEY,
            'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id: user.id,
            product_id: product.id
          })
        });
        
        if (response.ok) {
          console.log(`✅ ${user.full_name} a ajouté "${product.name}" à sa wishlist`);
          created++;
        } else {
          const error = await response.text();
          console.log(`⚠️  Wishlist: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Erreur wishlist: ${error.message}`);
      }
    }
  }
  
  return created;
}

async function verifyTables() {
  console.log('\n🔍 Vérification des données créées...');
  
  const tables = {
    'user_profiles': 'Utilisateurs',
    'promotions': 'Promotions', 
    'product_reviews': 'Avis clients',
    'product_analytics': 'Analytics',
    'wishlists': 'Wishlists'
  };
  
  for (const [table, name] of Object.entries(tables)) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=count`,
        {
          headers: {
            'apikey': SUPABASE_SECRET_KEY,
            'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const count = data[0]?.count || 0;
        console.log(`📊 ${name}: ${count} entrées`);
      } else {
        console.log(`❌ ${name}: erreur de lecture`);
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 CRÉATION DES FONCTIONNALITÉS E-COMMERCE AVEC API PRIVÉE');
  console.log('=========================================================\n');
  
  try {
    const userCount = await createUserProfiles();
    const promoCount = await createPromotions();
    const reviewCount = await createReviews();
    const analyticsCount = await createAnalytics();
    const wishlistCount = await createWishlists();
    
    console.log('\n🎉 CRÉATION TERMINÉE !');
    console.log('====================');
    console.log(`👥 Utilisateurs: ${userCount} créés`);
    console.log(`🎫 Promotions: ${promoCount} créées`);
    console.log(`⭐ Avis: ${reviewCount} créés`);
    console.log(`📊 Analytics: ${analyticsCount} entrées`);
    console.log(`❤️ Wishlists: ${wishlistCount} items`);
    
    await verifyTables();
    
    console.log('\n🚀 Votre e-commerce a maintenant des fonctionnalités complètes !');
    console.log('🌐 Rafraîchissez localhost:3010 pour voir les nouveautés');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

main().catch(console.error);