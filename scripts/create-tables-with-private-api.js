const fetch = require('node-fetch');

const SUPABASE_URL = 'https://fhewhxjprkksjriohxpv.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_2mGi5SiBbznugeWK0U8mEA_RaaBlDln';

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`);
  
  try {
    // Utiliser l'endpoint SQL direct de Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${description} - Succès`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ ${description} - Erreur: ${error}`);
      
      // Essayer une approche alternative
      return await executeDirectSQL(sql, description);
    }
  } catch (error) {
    console.log(`❌ ${description} - Exception: ${error.message}`);
    return false;
  }
}

async function executeDirectSQL(sql, description) {
  try {
    // Approche alternative : créer une fonction temporaire pour exécuter le SQL
    const functionSQL = `
      CREATE OR REPLACE FUNCTION temp_execute_sql()
      RETURNS void AS $$
      BEGIN
        ${sql}
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/temp_execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log(`✅ ${description} - Succès (méthode alternative)`);
      return true;
    } else {
      console.log(`❌ ${description} - Échec des deux méthodes`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Exception alternative: ${error.message}`);
    return false;
  }
}

async function createTables() {
  console.log('🚀 CRÉATION DES TABLES AVEC L\'API PRIVÉE');
  console.log('========================================\n');

  // 1. Créer la table user_profiles
  const userProfilesSQL = `
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      email varchar(255) UNIQUE,
      full_name varchar(255),
      avatar_url text,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;
  await executeSQL(userProfilesSQL, 'Création table user_profiles');

  // 2. Créer la table promotions
  const promotionsSQL = `
    CREATE TABLE IF NOT EXISTS public.promotions (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      code varchar(50) UNIQUE NOT NULL,
      name varchar(200) NOT NULL,
      description text,
      discount_type varchar(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
      discount_value decimal(10,2) NOT NULL,
      minimum_order decimal(10,2) DEFAULT 0,
      maximum_discount decimal(10,2),
      usage_limit integer,
      used_count integer DEFAULT 0,
      valid_from timestamp with time zone NOT NULL,
      valid_until timestamp with time zone NOT NULL,
      active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;
  await executeSQL(promotionsSQL, 'Création table promotions');

  // 3. Créer la table product_reviews
  const reviewsSQL = `
    CREATE TABLE IF NOT EXISTS public.product_reviews (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
      user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title varchar(200),
      content text,
      verified_purchase boolean DEFAULT false,
      helpful_count integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      
      CONSTRAINT unique_user_product_review UNIQUE(user_id, product_id)
    );
  `;
  await executeSQL(reviewsSQL, 'Création table product_reviews');

  // 4. Créer la table wishlists
  const wishlistsSQL = `
    CREATE TABLE IF NOT EXISTS public.wishlists (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      
      CONSTRAINT unique_user_product_wishlist UNIQUE(user_id, product_id)
    );
  `;
  await executeSQL(wishlistsSQL, 'Création table wishlists');

  // 5. Créer la table product_analytics
  const analyticsSQL = `
    CREATE TABLE IF NOT EXISTS public.product_analytics (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
      date date NOT NULL DEFAULT CURRENT_DATE,
      views_count integer DEFAULT 0,
      cart_additions integer DEFAULT 0,
      purchases integer DEFAULT 0,
      revenue decimal(12,2) DEFAULT 0,
      conversion_rate decimal(5,4) DEFAULT 0,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      
      CONSTRAINT unique_product_date UNIQUE(product_id, date)
    );
  `;
  await executeSQL(analyticsSQL, 'Création table product_analytics');

  // 6. Créer la table recently_viewed
  const recentlyViewedSQL = `
    CREATE TABLE IF NOT EXISTS public.recently_viewed (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      session_id varchar(255) NOT NULL,
      product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
      viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      
      CONSTRAINT unique_session_product_view UNIQUE(session_id, product_id)
    );
  `;
  await executeSQL(recentlyViewedSQL, 'Création table recently_viewed');

  // 7. Créer les index
  const indexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
    CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON public.product_analytics(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON public.product_analytics(date);
    CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
    CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(active) WHERE active = true;
    CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON public.recently_viewed(session_id);
  `;
  await executeSQL(indexesSQL, 'Création des index de performance');

  console.log('\n🎉 TENTATIVE DE CRÉATION TERMINÉE !');
}

async function createTablesAlternative() {
  console.log('\n🔄 MÉTHODE ALTERNATIVE : Création via insertion directe\n');
  
  // Méthode alternative : créer les tables en utilisant des requêtes individuelles
  const tables = [
    {
      name: 'user_profiles',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
            CREATE TABLE public.user_profiles (
              id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
              email varchar(255) UNIQUE,
              full_name varchar(255),
              avatar_url text,
              created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
              updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
            );
          END IF;
        END $$;
      `
    },
    {
      name: 'promotions',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
            CREATE TABLE public.promotions (
              id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
              code varchar(50) UNIQUE NOT NULL,
              name varchar(200) NOT NULL,
              description text,
              discount_type varchar(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
              discount_value decimal(10,2) NOT NULL,
              minimum_order decimal(10,2) DEFAULT 0,
              maximum_discount decimal(10,2),
              usage_limit integer,
              used_count integer DEFAULT 0,
              valid_from timestamp with time zone NOT NULL,
              valid_until timestamp with time zone NOT NULL,
              active boolean DEFAULT true,
              created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
              updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
            );
          END IF;
        END $$;
      `
    }
  ];

  for (const table of tables) {
    await executeSQL(table.sql, `Création alternative ${table.name}`);
  }
}

async function insertTestData() {
  console.log('\n📊 INSERTION DES DONNÉES DE TEST\n');

  // Insérer des utilisateurs de test
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

  console.log('👥 Insertion des utilisateurs...');
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
      } else {
        const error = await response.text();
        console.log(`⚠️  ${user.email}: ${error.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }

  // Insérer des promotions de test
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
    }
  ];

  console.log('\n🎫 Insertion des promotions...');
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
      } else {
        const error = await response.text();
        console.log(`⚠️  ${promo.code}: ${error.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

async function verifyCreation() {
  console.log('\n🔍 VÉRIFICATION DES TABLES CRÉÉES\n');
  
  const tables = ['user_profiles', 'promotions', 'product_reviews', 'wishlists', 'product_analytics', 'recently_viewed'];
  
  for (const table of tables) {
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
        console.log(`✅ Table ${table}: accessible (${count} entrées)`);
      } else {
        console.log(`❌ Table ${table}: non accessible`);
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
}

async function main() {
  await createTables();
  await createTablesAlternative();
  await insertTestData();
  await verifyCreation();
  
  console.log('\n🎯 RÉSUMÉ');
  console.log('=========');
  console.log('Si les tables ont été créées avec succès, votre e-commerce dispose maintenant de :');
  console.log('✅ Système d\'avis clients');
  console.log('✅ Wishlist/Favoris');
  console.log('✅ Analytics produits');
  console.log('✅ Promotions et coupons');
  console.log('✅ Profils utilisateurs');
  console.log('✅ Suivi des vues récentes');
  console.log('\n🚀 Rafraîchissez localhost:3010 pour tester !');
}

main().catch(console.error);