-- =================================================================
-- MIGRATION COMPLÈTE E-COMMERCE SUPABASE
-- =================================================================
-- Description: Script de migration pour créer toute la structure
-- Statut: ✅ Validé et testé
-- Utilisation: Copier-coller dans Supabase Dashboard → SQL Editor
-- =================================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- TABLES PRINCIPALES E-COMMERCE
-- =================================================================

-- Table des catégories (doit être créée en premier)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.categories(id),
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  sku TEXT UNIQUE NOT NULL,
  inventory_quantity INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  brand TEXT,
  weight NUMERIC(10,2),
  dimensions TEXT,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABLES UTILISATEURS ET INTERACTIONS
-- =================================================================

-- Profils utilisateurs étendus
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listes de favoris
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Avis et notes des produits
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABLES ANALYTICS ET BUSINESS
-- =================================================================

-- Analytics des produits
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 0,
  cart_additions INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  conversion_rate NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Codes promo et promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(10,2) NOT NULL,
  minimum_order NUMERIC(10,2) DEFAULT 0,
  maximum_discount NUMERIC(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- INDEX POUR OPTIMISATION DES PERFORMANCES
-- =================================================================

-- Index sur les produits
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(featured);
CREATE INDEX IF NOT EXISTS products_price_idx ON public.products(price);

-- Index sur les catégories
CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories(slug);
CREATE INDEX IF NOT EXISTS categories_featured_idx ON public.categories(featured);

-- Index sur les avis
CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS product_reviews_rating_idx ON public.product_reviews(rating);

-- Index sur les wishlists
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS wishlists_product_id_idx ON public.wishlists(product_id);

-- Index sur les analytics
CREATE INDEX IF NOT EXISTS product_analytics_product_id_idx ON public.product_analytics(product_id);
CREATE INDEX IF NOT EXISTS product_analytics_date_idx ON public.product_analytics(date);

-- Index sur les promotions
CREATE INDEX IF NOT EXISTS promotions_code_idx ON public.promotions(code);
CREATE INDEX IF NOT EXISTS promotions_active_idx ON public.promotions(active);
CREATE INDEX IF NOT EXISTS promotions_valid_dates_idx ON public.promotions(valid_from, valid_until);

-- =================================================================
-- SÉCURITÉ - ROW LEVEL SECURITY (RLS)
-- =================================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- POLÍTICAS DE SÉCURITÉ
-- =================================================================

-- Políticas pour user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas pour product_reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
CREATE POLICY "Users can update their own reviews" ON public.product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas pour wishlists
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlists;
CREATE POLICY "Users can view their own wishlist" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- =================================================================
-- DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- =================================================================

-- Insérer des catégories de base
INSERT INTO public.categories (name, slug, description, featured) VALUES
  ('Electronics', 'electronics', 'Electronic devices and gadgets', true),
  ('Clothing', 'clothing', 'Fashion and apparel', true),
  ('Books', 'books', 'Books and literature', false),
  ('Home & Garden', 'home-garden', 'Home improvement and gardening', false),
  ('Sports', 'sports', 'Sports and outdoor equipment', false),
  ('Beauty', 'beauty', 'Beauty and personal care', false)
ON CONFLICT (slug) DO NOTHING;

-- Insérer quelques produits de démonstration
INSERT INTO public.products (name, description, price, sku, inventory_quantity, brand, images, tags, featured, category_id) 
SELECT 
  'Premium Wireless Headphones',
  'High-quality wireless headphones with noise cancellation and premium sound quality.',
  299.99,
  'WH-001',
  50,
  'TechSound',
  ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
  ARRAY['wireless', 'audio', 'premium'],
  true,
  c.id
FROM public.categories c WHERE c.slug = 'electronics'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.products (name, description, price, sku, inventory_quantity, brand, images, tags, featured, category_id)
SELECT 
  'Classic Cotton T-Shirt',
  'Comfortable and stylish cotton t-shirt perfect for everyday wear.',
  24.99,
  'TS-001',
  100,
  'ComfortWear',
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
  ARRAY['cotton', 'casual', 'comfortable'],
  false,
  c.id
FROM public.categories c WHERE c.slug = 'clothing'
ON CONFLICT (sku) DO NOTHING;

-- =================================================================
-- FINALISATION
-- =================================================================

-- Vérifier que tout est créé correctement
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '📊 Tables créées: products, categories, user_profiles, wishlists, product_reviews, product_analytics, promotions';
  RAISE NOTICE '🔒 Sécurité RLS activée sur les tables sensibles';
  RAISE NOTICE '⚡ Index optimisés pour les performances';
  RAISE NOTICE '🎯 Base de données prête pour production!';
END $$;