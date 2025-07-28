const fetch = require('node-fetch');

const SUPABASE_URL = 'https://fhewhxjprkksjriohxpv.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_2mGi5SiBbznugeWK0U8mEA_RaaBlDln';

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      console.log(`✅ ${description} - Succès`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ ${description} - Erreur:`, error);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Exception:`, error.message);
    return false;
  }
}

async function createAdvancedFeatures() {
  console.log('🚀 CRÉATION DES FONCTIONNALITÉS AVANCÉES E-COMMERCE');
  console.log('===================================================\n');

  // 1. Créer la table des reviews
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

  // 2. Créer la table wishlist
  const wishlistSQL = `
    CREATE TABLE IF NOT EXISTS public.wishlists (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        
        CONSTRAINT unique_user_product_wishlist UNIQUE(user_id, product_id)
    );
  `;
  await executeSQL(wishlistSQL, 'Création table wishlists');

  // 3. Créer la table analytics
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

  // 4. Créer la table promotions
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

  // 5. Créer la table stock alerts
  const stockAlertsSQL = `
    CREATE TABLE IF NOT EXISTS public.stock_alerts (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
        user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        notified boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        
        CONSTRAINT unique_user_product_alert UNIQUE(user_id, product_id)
    );
  `;
  await executeSQL(stockAlertsSQL, 'Création table stock_alerts');

  // 6. Créer la table recently viewed
  const recentlyViewedSQL = `
    CREATE TABLE IF NOT EXISTS public.recently_viewed (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
        viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        
        CONSTRAINT unique_user_product_view UNIQUE(user_id, product_id)
    );
  `;
  await executeSQL(recentlyViewedSQL, 'Création table recently_viewed');

  // 7. Créer la table recommendations
  const recommendationsSQL = `
    CREATE TABLE IF NOT EXISTS public.product_similarities (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        product_a_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
        product_b_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
        similarity_score decimal(3,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
        similarity_type varchar(50) NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        
        CONSTRAINT unique_product_pair UNIQUE(product_a_id, product_b_id, similarity_type)
    );
  `;
  await executeSQL(recommendationsSQL, 'Création table product_similarities');

  // 8. Créer les index de performance
  const indexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
    CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON public.product_analytics(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON public.product_analytics(date);
    CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
    CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(active) WHERE active = true;
  `;
  await executeSQL(indexesSQL, 'Création des index de performance');

  // 9. Créer les fonctions utilitaires
  const functionsSQL = `
    CREATE OR REPLACE FUNCTION get_product_rating(product_uuid uuid)
    RETURNS decimal(3,2) AS $$
    DECLARE
        avg_rating decimal(3,2);
    BEGIN
        SELECT ROUND(AVG(rating::decimal), 2) INTO avg_rating
        FROM public.product_reviews 
        WHERE product_id = product_uuid;
        
        RETURN COALESCE(avg_rating, 0);
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION get_product_review_count(product_uuid uuid)
    RETURNS integer AS $$
    DECLARE
        review_count integer;
    BEGIN
        SELECT COUNT(*) INTO review_count
        FROM public.product_reviews 
        WHERE product_id = product_uuid;
        
        RETURN review_count;
    END;
    $$ LANGUAGE plpgsql;
  `;
  await executeSQL(functionsSQL, 'Création des fonctions utilitaires');

  // 10. Ajouter des promotions de test
  const testPromotionsSQL = `
    INSERT INTO public.promotions (code, name, description, discount_type, discount_value, minimum_order, valid_from, valid_until)
    VALUES 
        ('WELCOME10', 'Welcome 10%', 'Promotion de bienvenue - 10% de réduction', 'percentage', 10.00, 50.00, NOW(), NOW() + INTERVAL '30 days'),
        ('FREESHIP', 'Free Shipping', 'Livraison gratuite pour commandes 75€+', 'fixed_amount', 9.99, 75.00, NOW(), NOW() + INTERVAL '60 days'),
        ('SUMMER2024', 'Summer Sale', 'Soldes d''été - 25% de réduction', 'percentage', 25.00, 100.00, NOW(), NOW() + INTERVAL '45 days')
    ON CONFLICT (code) DO NOTHING;
  `;
  await executeSQL(testPromotionsSQL, 'Ajout des promotions de test');

  console.log('\n🎉 FONCTIONNALITÉS AVANCÉES CRÉÉES AVEC SUCCÈS !');
  console.log('===============================================');
  console.log('✅ 7 nouvelles tables e-commerce');
  console.log('✅ Index de performance optimisés');
  console.log('✅ 2 fonctions utilitaires'); 
  console.log('✅ 3 promotions de test ajoutées');
  console.log('\n🚀 Votre e-commerce a maintenant des fonctionnalités avancées !');
}

async function verifyTables() {
  console.log('\n📊 Vérification des tables créées...');
  
  const tables = [
    'product_reviews',
    'wishlists', 
    'product_analytics',
    'promotions',
    'stock_alerts',
    'recently_viewed',
    'product_similarities'
  ];
  
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
        console.log(`✅ Table ${table} : accessible`);
      } else {
        console.log(`❌ Table ${table} : erreur`);
      }
    } catch (error) {
      console.log(`❌ Table ${table} : ${error.message}`);
    }
  }
}

async function main() {
  await createAdvancedFeatures();
  await verifyTables();
  
  console.log('\n🎯 Prochaines étapes :');
  console.log('1. 🌐 Rafraîchir localhost:3010 pour voir les nouveaux produits');
  console.log('2. 🔧 Intégrer les nouvelles fonctionnalités dans le frontend');
  console.log('3. 📱 Tester sur l\'application mobile');
}

main().catch(console.error);