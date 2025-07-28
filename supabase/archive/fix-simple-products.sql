-- =====================================================
-- SCRIPT SIMPLE POUR AJOUTER DES PRODUITS DE TEST
-- Compatible avec la structure existante
-- =====================================================

-- =====================================================
-- 1. D'ABORD, VÉRIFIER LA STRUCTURE EXISTANTE
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

-- =====================================================
-- 2. AJOUTER DES PRODUITS SIMPLES (SANS IMAGES D'ABORD)
-- =====================================================

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

    -- Produits simples sans images pour commencer
    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'iPhone 15 Pro', 'Smartphone Apple dernière génération avec puce A17 Pro', 1299.99, 1399.99, 'IPHONE-15-PRO', 25, cat_electronique, 'Apple', 
           ARRAY['smartphone', 'apple', 'pro'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'IPHONE-15-PRO');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'MacBook Air M3', 'Ordinateur portable ultra-léger avec puce Apple M3', 1399.99, 'MACBOOK-AIR-M3', 15, cat_electronique, 'Apple',
           ARRAY['laptop', 'apple', 'm3'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'MACBOOK-AIR-M3');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'AirPods Pro 2', 'Écouteurs sans fil avec réduction de bruit active', 279.99, 'AIRPODS-PRO-2', 50, cat_electronique, 'Apple',
           ARRAY['écouteurs', 'sans-fil', 'apple'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'AIRPODS-PRO-2');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'T-Shirt Premium', 'T-shirt en coton bio, coupe moderne', 29.99, 39.99, 'TSHIRT-PREMIUM', 100, cat_vetements, 'EcoWear',
           ARRAY['t-shirt', 'coton', 'bio']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'TSHIRT-PREMIUM');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Jean Slim Femme', 'Jean taille haute en denim stretch', 79.99, 'JEAN-SLIM-FEMME', 75, cat_vetements, 'DenimCo',
           ARRAY['jean', 'femme', 'slim']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'JEAN-SLIM-FEMME');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'Canapé Scandinave', 'Canapé 3 places style scandinave, tissu gris', 899.99, 'CANAPE-SCAND-3P', 8, cat_maison, 'Nordic Home',
           ARRAY['canapé', 'scandinave', '3places'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'CANAPE-SCAND-3P');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, featured)
    SELECT 'Smartphone Android', 'Smartphone Android milieu de gamme', 399.99, 'ANDROID-BASIC', 30, cat_electronique, 'TechBrand', true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'ANDROID-BASIC');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand)
    SELECT 'Chaussures de sport', 'Baskets confortables pour le sport', 89.99, 'SHOES-SPORT', 60, cat_vetements, 'SportWear'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SHOES-SPORT');

END $$;

-- =====================================================
-- 3. ACTIVER L'ACCÈS PUBLIC EN LECTURE
-- =====================================================

-- Les tables categories et products doivent être accessibles en lecture
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
-- 4. CRÉER LES INDEX SI NÉCESSAIRE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Produits ajoutés avec succès !';
    RAISE NOTICE '📊 Vérifiez dans Supabase Table Editor :';
    RAISE NOTICE '   - categories : doit contenir 3 catégories';
    RAISE NOTICE '   - products : doit contenir des produits de test';
    RAISE NOTICE '🎯 Votre homepage devrait maintenant charger les produits !';
    RAISE NOTICE '';
    RAISE NOTICE 'Si vous voulez ajouter des images, utilisez ensuite :';
    RAISE NOTICE 'UPDATE products SET images = ARRAY[''url1'', ''url2''] WHERE sku = ''IPHONE-15-PRO'';';
END $$;