-- =====================================================
-- NOUVELLES FONCTIONNALITÉS E-COMMERCE AVANCÉES
-- Tables et fonctions pour un e-commerce complet
-- =====================================================

-- =====================================================
-- 1. SYSTÈME DE REVIEWS/AVIS CLIENTS
-- =====================================================

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

-- =====================================================
-- 2. WISHLIST/FAVORIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_user_product_wishlist UNIQUE(user_id, product_id)
);

-- =====================================================
-- 3. ANALYTICS ET MÉTRIQUES PRODUITS
-- =====================================================

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

-- =====================================================
-- 4. PROMOTIONS ET COUPONS
-- =====================================================

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

-- =====================================================
-- 5. STOCK ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    notified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_user_product_alert UNIQUE(user_id, product_id)
);

-- =====================================================
-- 6. PRODUITS RÉCEMMENT VUS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_user_product_view UNIQUE(user_id, product_id)
);

-- =====================================================
-- 7. RECOMMENDATIONS ENGINE DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_similarities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_a_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    product_b_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    similarity_score decimal(3,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    similarity_type varchar(50) NOT NULL, -- 'category', 'tags', 'purchase_behavior', etc.
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_product_pair UNIQUE(product_a_id, product_b_id, similarity_type)
);

-- =====================================================
-- INDEX POUR PERFORMANCE
-- =====================================================

-- Reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);

-- Wishlist
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON public.product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON public.product_analytics(date);

-- Promotions
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(valid_from, valid_until);

-- Stock Alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_user_id ON public.stock_alerts(user_id);

-- Recently Viewed
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at);

-- Similarities
CREATE INDEX IF NOT EXISTS idx_product_similarities_product_a ON public.product_similarities(product_a_id);
CREATE INDEX IF NOT EXISTS idx_product_similarities_score ON public.product_similarities(similarity_score);

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

-- Fonction pour mettre à jour les analytics produit
CREATE OR REPLACE FUNCTION update_product_analytics(
    product_uuid uuid,
    action_type varchar(20) -- 'view', 'cart', 'purchase'
)
RETURNS void AS $$
DECLARE
    today_date date := CURRENT_DATE;
BEGIN
    -- Insérer ou mettre à jour les analytics du jour
    INSERT INTO public.product_analytics (product_id, date, views_count, cart_additions, purchases)
    VALUES (
        product_uuid, 
        today_date,
        CASE WHEN action_type = 'view' THEN 1 ELSE 0 END,
        CASE WHEN action_type = 'cart' THEN 1 ELSE 0 END,
        CASE WHEN action_type = 'purchase' THEN 1 ELSE 0 END
    )
    ON CONFLICT (product_id, date) DO UPDATE SET
        views_count = product_analytics.views_count + 
            CASE WHEN action_type = 'view' THEN 1 ELSE 0 END,
        cart_additions = product_analytics.cart_additions + 
            CASE WHEN action_type = 'cart' THEN 1 ELSE 0 END,
        purchases = product_analytics.purchases + 
            CASE WHEN action_type = 'purchase' THEN 1 ELSE 0 END,
        updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS POUR AUTOMATISATION
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables avec updated_at
CREATE TRIGGER update_product_reviews_updated_at 
    BEFORE UPDATE ON public.product_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_analytics_updated_at 
    BEFORE UPDATE ON public.product_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON public.promotions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLITIQUES RLS (À ACTIVER SI NÉCESSAIRE)
-- =====================================================

-- Reviews: tout le monde peut lire, seuls les utilisateurs connectés peuvent écrire
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Wishlist: seul le propriétaire peut voir/modifier
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Recently viewed: seul le propriétaire peut voir/modifier  
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recently viewed" ON public.recently_viewed
    FOR ALL USING (auth.uid() = user_id);

-- Stock alerts: seul le propriétaire peut voir/modifier
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stock alerts" ON public.stock_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Analytics: lecture seule pour tous
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product analytics" ON public.product_analytics
    FOR SELECT USING (true);

-- Promotions: lecture pour tous
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions" ON public.promotions
    FOR SELECT USING (active = true);

-- =====================================================
-- DONNÉES DE TEST POUR LES NOUVELLES FONCTIONNALITÉS
-- =====================================================

-- Ajouter quelques promotions de test
INSERT INTO public.promotions (code, name, description, discount_type, discount_value, minimum_order, valid_from, valid_until)
VALUES 
    ('WELCOME10', 'Welcome 10%', 'Promotion de bienvenue - 10% de réduction', 'percentage', 10.00, 50.00, NOW(), NOW() + INTERVAL '30 days'),
    ('FREESHIP', 'Free Shipping', 'Livraison gratuite pour commandes 75€+', 'fixed_amount', 9.99, 75.00, NOW(), NOW() + INTERVAL '60 days'),
    ('SUMMER2024', 'Summer Sale', 'Soldes d''été - 25% de réduction', 'percentage', 25.00, 100.00, NOW(), NOW() + INTERVAL '45 days')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 NOUVELLES FONCTIONNALITÉS E-COMMERCE CRÉÉES !';
    RAISE NOTICE '=========================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables créées:';
    RAISE NOTICE '   📝 product_reviews - Système d''avis clients';
    RAISE NOTICE '   ⭐ wishlists - Listes de favoris';
    RAISE NOTICE '   📊 product_analytics - Métriques et analytics';
    RAISE NOTICE '   🎫 promotions - Codes promo et réductions';
    RAISE NOTICE '   🔔 stock_alerts - Alertes de stock';
    RAISE NOTICE '   👁️ recently_viewed - Produits récemment vus';
    RAISE NOTICE '   🤖 product_similarities - Recommandations';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Fonctions utilitaires:';
    RAISE NOTICE '   🌟 get_product_rating() - Note moyenne produit';
    RAISE NOTICE '   🔢 get_product_review_count() - Nombre d''avis';
    RAISE NOTICE '   📈 update_product_analytics() - Mise à jour métriques';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Politiques RLS configurées pour la sécurité';
    RAISE NOTICE '📊 Index de performance créés';
    RAISE NOTICE '🎫 3 promotions de test ajoutées';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Votre e-commerce a maintenant des fonctionnalités avancées !';

END $$;