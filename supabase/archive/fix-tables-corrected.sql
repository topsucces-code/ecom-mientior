-- =====================================================
-- CORRECTION SÉCURISÉE DES TABLES MANQUANTES (CORRIGÉE)
-- E-commerce Platform - Syntaxe JSONB corrigée
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- 1. TABLES PRINCIPALES (avec vérification d'existence)
-- =====================================================

-- Table des catégories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    slug text UNIQUE NOT NULL,
    image_url text,
    parent_id uuid REFERENCES public.categories(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des produits
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    price numeric NOT NULL CHECK (price >= 0),
    compare_at_price numeric CHECK (compare_at_price >= 0),
    sku text UNIQUE NOT NULL,
    inventory_quantity integer DEFAULT 0 CHECK (inventory_quantity >= 0),
    category_id uuid REFERENCES public.categories(id),
    brand text,
    weight numeric,
    dimensions text,
    images jsonb DEFAULT '[]',
    tags text[] DEFAULT '{}',
    status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    email text NOT NULL,
    first_name text,
    last_name text,
    phone text,
    avatar_url text,
    addresses jsonb DEFAULT '[]',
    role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'vendor', 'agent')),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. INSÉRER DES DONNÉES D'EXEMPLE BASIQUES
-- =====================================================

-- Insérer des catégories seulement si elles n'existent pas
INSERT INTO public.categories (name, description, slug, image_url)
SELECT 'Électronique', 'Smartphones, ordinateurs, gadgets', 'electronique', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'electronique');

INSERT INTO public.categories (name, description, slug, image_url)
SELECT 'Vêtements', 'Mode homme, femme, accessoires', 'vetements', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'vetements');

INSERT INTO public.categories (name, description, slug, image_url)
SELECT 'Maison & Jardin', 'Décoration, meubles, jardinage', 'maison-jardin', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'maison-jardin');

-- Insérer des produits de test
DO $$
DECLARE
    cat_electronique uuid;
    cat_vetements uuid;
    cat_maison uuid;
BEGIN
    -- Récupérer les IDs des catégories
    SELECT id INTO cat_electronique FROM public.categories WHERE slug = 'electronique';
    SELECT id INTO cat_vetements FROM public.categories WHERE slug = 'vetements';
    SELECT id INTO cat_maison FROM public.categories WHERE slug = 'maison-jardin';

    -- Produits Électronique
    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, images, tags, featured)
    SELECT 'iPhone 15 Pro', 'Smartphone Apple dernière génération avec puce A17 Pro', 1299.99, 1399.99, 'IPHONE-15-PRO', 25, cat_electronique, 'Apple', 
           '["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500"]'::jsonb, 
           ARRAY['smartphone', 'apple', 'pro'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'IPHONE-15-PRO');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, images, tags, featured)
    SELECT 'MacBook Air M3', 'Ordinateur portable ultra-léger avec puce Apple M3', 1399.99, 'MACBOOK-AIR-M3', 15, cat_electronique, 'Apple',
           '["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500"]'::jsonb,
           ARRAY['laptop', 'apple', 'm3'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'MACBOOK-AIR-M3');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, images, tags, featured)
    SELECT 'AirPods Pro 2', 'Écouteurs sans fil avec réduction de bruit active', 279.99, 'AIRPODS-PRO-2', 50, cat_electronique, 'Apple',
           '["https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500"]'::jsonb,
           ARRAY['écouteurs', 'sans-fil', 'apple'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'AIRPODS-PRO-2');

    -- Produits Vêtements
    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, images, tags)
    SELECT 'T-Shirt Premium', 'T-shirt en coton bio, coupe moderne', 29.99, 39.99, 'TSHIRT-PREMIUM', 100, cat_vetements, 'EcoWear',
           '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"]'::jsonb,
           ARRAY['t-shirt', 'coton', 'bio']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'TSHIRT-PREMIUM');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, images, tags)
    SELECT 'Jean Slim Femme', 'Jean taille haute en denim stretch', 79.99, 'JEAN-SLIM-FEMME', 75, cat_vetements, 'DenimCo',
           '["https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500"]'::jsonb,
           ARRAY['jean', 'femme', 'slim']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'JEAN-SLIM-FEMME');

    -- Produits Maison
    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, images, tags, featured)
    SELECT 'Canapé Scandinave', 'Canapé 3 places style scandinave, tissu gris', 899.99, 'CANAPE-SCAND-3P', 8, cat_maison, 'Nordic Home',
           '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500"]'::jsonb,
           ARRAY['canapé', 'scandinave', '3places'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'CANAPE-SCAND-3P');

    -- Produit simple sans image pour test
    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, featured)
    SELECT 'Smartphone Android', 'Smartphone Android milieu de gamme, bon rapport qualité-prix', 399.99, 'ANDROID-BASIC', 30, cat_electronique, 'TechBrand', true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'ANDROID-BASIC');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand)
    SELECT 'Chaussures de sport', 'Baskets confortables pour le running et fitness', 89.99, 'SHOES-SPORT', 60, cat_vetements, 'SportWear'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SHOES-SPORT');

END $$;

-- =====================================================
-- 3. CRÉER LES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les catégories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- Index pour les produits
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- =====================================================
-- 4. VÉRIFIER QUE LES TABLES PUBLIQUES SONT ACCESSIBLES
-- =====================================================

-- Les tables categories et products doivent être accessibles en lecture
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Supprimer et recréer les politiques pour éviter les conflits
DO $$
BEGIN
    -- Politiques pour categories
    DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
    CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (true);

    -- Politiques pour products  
    DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
    CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (status = 'active');

EXCEPTION WHEN others THEN
    -- Ignorer les erreurs si les politiques n'existent pas
    NULL;
END $$;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tables créées et données ajoutées avec succès !';
    RAISE NOTICE '📊 Vérifiez dans Supabase Table Editor :';
    RAISE NOTICE '   - categories : doit contenir 3 catégories';
    RAISE NOTICE '   - products : doit contenir 8 produits';
    RAISE NOTICE '🎯 Votre homepage devrait maintenant charger les produits !';
END $$;