-- =====================================================
-- FONCTIONNALITÉS E-COMMERCE SIMPLIFIÉES
-- Compatible avec la structure existante
-- =====================================================

-- 1. Créer la table user_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email varchar(255) UNIQUE,
    full_name varchar(255),
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ajouter quelques utilisateurs de test
INSERT INTO public.user_profiles (email, full_name)
VALUES 
    ('john.doe@example.com', 'John Doe'),
    ('jane.smith@example.com', 'Jane Smith'),
    ('mike.wilson@example.com', 'Mike Wilson')
ON CONFLICT (email) DO NOTHING;

-- 3. SYSTÈME DE REVIEWS/AVIS CLIENTS
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

-- 4. WISHLIST/FAVORIS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_user_product_wishlist UNIQUE(user_id, product_id)
);

-- 5. ANALYTICS ET MÉTRIQUES PRODUITS
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

-- 6. PROMOTIONS ET COUPONS
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

-- 7. PRODUITS RÉCEMMENT VUS (sans référence utilisateur pour simplifier)
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id varchar(255) NOT NULL, -- Au lieu de user_id
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_session_product_view UNIQUE(session_id, product_id)
);

-- =====================================================
-- INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON public.product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON public.product_analytics(date);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON public.recently_viewed(session_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer la note moyenne d'un produit
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

-- Fonction pour compter les reviews d'un produit
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

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Ajouter quelques promotions de test
INSERT INTO public.promotions (code, name, description, discount_type, discount_value, minimum_order, valid_from, valid_until)
VALUES 
    ('WELCOME10', 'Welcome 10%', 'Promotion de bienvenue - 10% de réduction', 'percentage', 10.00, 50.00, NOW(), NOW() + INTERVAL '30 days'),
    ('FREESHIP', 'Free Shipping', 'Livraison gratuite pour commandes 75€+', 'fixed_amount', 9.99, 75.00, NOW(), NOW() + INTERVAL '60 days'),
    ('SUMMER2025', 'Summer Sale', 'Soldes d''été - 25% de réduction', 'percentage', 25.00, 100.00, NOW(), NOW() + INTERVAL '45 days')
ON CONFLICT (code) DO NOTHING;

-- Ajouter quelques reviews de test (utilise les premiers produits et utilisateurs)
DO $$
DECLARE
    first_product_id uuid;
    second_product_id uuid;
    first_user_id uuid;
    second_user_id uuid;
BEGIN
    -- Récupérer les IDs des premiers produits et utilisateurs
    SELECT id INTO first_product_id FROM public.products LIMIT 1;
    SELECT id INTO second_product_id FROM public.products OFFSET 1 LIMIT 1;
    SELECT id INTO first_user_id FROM public.user_profiles LIMIT 1;
    SELECT id INTO second_user_id FROM public.user_profiles OFFSET 1 LIMIT 1;
    
    -- Insérer des reviews de test
    IF first_product_id IS NOT NULL AND first_user_id IS NOT NULL THEN
        INSERT INTO public.product_reviews (product_id, user_id, rating, title, content, verified_purchase)
        VALUES 
            (first_product_id, first_user_id, 5, 'Excellent produit !', 'Je recommande vivement ce produit, qualité au top.', true),
            (first_product_id, second_user_id, 4, 'Très bien', 'Bon rapport qualité-prix, livraison rapide.', true)
        ON CONFLICT (user_id, product_id) DO NOTHING;
    END IF;
    
    IF second_product_id IS NOT NULL AND first_user_id IS NOT NULL THEN
        INSERT INTO public.product_reviews (product_id, user_id, rating, title, content)
        VALUES 
            (second_product_id, first_user_id, 4, 'Satisfait', 'Produit conforme à la description.', false)
        ON CONFLICT (user_id, product_id) DO NOTHING;
    END IF;
END $$;

-- Ajouter quelques données analytics de test
DO $$
DECLARE
    product_record RECORD;
BEGIN
    FOR product_record IN SELECT id FROM public.products LIMIT 5
    LOOP
        INSERT INTO public.product_analytics (product_id, date, views_count, cart_additions, purchases, revenue)
        VALUES 
            (product_record.id, CURRENT_DATE - INTERVAL '1 day', 
             (RANDOM() * 100)::integer, (RANDOM() * 20)::integer, (RANDOM() * 5)::integer, (RANDOM() * 1000)::decimal(12,2)),
            (product_record.id, CURRENT_DATE, 
             (RANDOM() * 150)::integer, (RANDOM() * 25)::integer, (RANDOM() * 8)::integer, (RANDOM() * 1500)::decimal(12,2))
        ON CONFLICT (product_id, date) DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 FONCTIONNALITÉS E-COMMERCE SIMPLIFIÉES CRÉÉES !';
    RAISE NOTICE '===================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables créées:';
    RAISE NOTICE '   👥 user_profiles - Profils utilisateurs';
    RAISE NOTICE '   📝 product_reviews - Système d''avis clients';
    RAISE NOTICE '   ⭐ wishlists - Listes de favoris';
    RAISE NOTICE '   📊 product_analytics - Métriques et analytics';
    RAISE NOTICE '   🎫 promotions - Codes promo et réductions';
    RAISE NOTICE '   👁️ recently_viewed - Produits récemment vus';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Fonctions utilitaires:';
    RAISE NOTICE '   🌟 get_product_rating() - Note moyenne produit';
    RAISE NOTICE '   🔢 get_product_review_count() - Nombre d''avis';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Index de performance créés';
    RAISE NOTICE '🎫 3 promotions de test ajoutées';
    RAISE NOTICE '⭐ Reviews de test ajoutés';
    RAISE NOTICE '📈 Analytics de test générés';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Votre e-commerce a maintenant des fonctionnalités avancées !';
END $$;