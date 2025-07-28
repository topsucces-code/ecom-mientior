-- =====================================================
-- CRÉATION COMPLÈTE DES TABLES SUPABASE
-- E-commerce Platform - Toutes les tables nécessaires
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- 1. TABLES PRINCIPALES (CORE)
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

-- Table des commandes
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount numeric NOT NULL CHECK (total_amount >= 0),
    tax_amount numeric DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount numeric DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method text,
    payment_id text,
    shipping_address jsonb,
    billing_address jsonb,
    order_items jsonb NOT NULL DEFAULT '[]',
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table du panier
CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    product_id uuid REFERENCES public.products(id),
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Table des avis
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id),
    user_id uuid REFERENCES public.user_profiles(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title text NOT NULL,
    content text NOT NULL,
    images text[] DEFAULT '{}',
    is_verified_purchase boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    helpful_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des interactions utilisateur
CREATE TABLE IF NOT EXISTS public.user_interactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    product_id uuid REFERENCES public.products(id),
    interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'cart', 'purchase', 'wishlist', 'click', 'impression', 'search', 'filter')),
    interaction_data jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. TABLES ÉTENDUES (NOUVELLES FONCTIONNALITÉS)
-- =====================================================

-- Table des coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    type text NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
    value numeric NOT NULL CHECK (value >= 0),
    description text NOT NULL,
    minimum_order_amount numeric DEFAULT NULL,
    maximum_discount_amount numeric DEFAULT NULL,
    usage_limit integer DEFAULT NULL,
    usage_count integer DEFAULT 0,
    user_usage_limit integer DEFAULT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone NOT NULL,
    categories text[] DEFAULT NULL,
    products text[] DEFAULT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table d'utilisation des coupons
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id),
    order_id uuid REFERENCES public.orders(id),
    discount_amount numeric NOT NULL,
    used_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.user_profiles(id),
    payment_method_id uuid NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'USD',
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
    transaction_id text DEFAULT NULL,
    payment_intent_id text DEFAULT NULL,
    parent_payment_id uuid REFERENCES public.payments(id) DEFAULT NULL,
    provider_response jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    processed_at timestamp with time zone DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des méthodes de paiement
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    type text NOT NULL CHECK (type IN ('card', 'bank_account', 'digital_wallet')),
    provider text NOT NULL CHECK (provider IN ('stripe', 'paypal', 'bank')),
    card_last_four text DEFAULT NULL,
    card_brand text DEFAULT NULL,
    card_exp_month integer DEFAULT NULL,
    card_exp_year integer DEFAULT NULL,
    bank_name text DEFAULT NULL,
    account_last_four text DEFAULT NULL,
    digital_wallet_email text DEFAULT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    provider_payment_method_id text DEFAULT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    type text NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info', 'order', 'promotion')),
    title text NOT NULL,
    message text NOT NULL,
    actions jsonb DEFAULT NULL,
    category text NOT NULL CHECK (category IN ('system', 'order', 'promotion', 'account', 'security')),
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    read boolean DEFAULT false,
    auto_hide boolean DEFAULT true,
    duration integer DEFAULT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des paramètres de notifications
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) UNIQUE,
    enabled boolean DEFAULT true,
    sound boolean DEFAULT true,
    desktop boolean DEFAULT true,
    email boolean DEFAULT true,
    categories jsonb DEFAULT '{"system": true, "order": true, "promotion": true, "account": true, "security": true}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table de l'historique de recherche
CREATE TABLE IF NOT EXISTS public.search_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) DEFAULT NULL,
    query text NOT NULL,
    filters jsonb DEFAULT '{}',
    results_count integer NOT NULL DEFAULT 0,
    clicked_product_id uuid REFERENCES public.products(id) DEFAULT NULL,
    session_id text DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table d'analytics des produits
CREATE TABLE IF NOT EXISTS public.product_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    date date NOT NULL,
    views integer DEFAULT 0,
    clicks integer DEFAULT 0,
    cart_adds integer DEFAULT 0,
    purchases integer DEFAULT 0,
    revenue numeric DEFAULT 0,
    conversion_rate numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, date)
);

-- Table de la wishlist
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes text DEFAULT NULL,
    UNIQUE(user_id, product_id)
);

-- Table de comparaison de produits
CREATE TABLE IF NOT EXISTS public.product_comparisons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    product_ids uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 3. TABLES POUR LE SYSTÈME DE CHAT
-- =====================================================

-- Table des agents de chat
CREATE TABLE IF NOT EXISTS public.chat_agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    name text NOT NULL,
    email text NOT NULL,
    avatar text DEFAULT NULL,
    status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    is_active boolean DEFAULT true,
    specialties text[] DEFAULT '{}',
    max_concurrent_chats integer DEFAULT 5,
    current_chat_count integer DEFAULT 0,
    average_response_time numeric DEFAULT 0,
    customer_rating numeric DEFAULT 0,
    total_chats_handled integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des conversations de chat
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.user_profiles(id),
    agent_id uuid REFERENCES public.chat_agents(id) DEFAULT NULL,
    status text DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category text NOT NULL CHECK (category IN ('general', 'order_support', 'technical', 'billing', 'product_inquiry')),
    subject text DEFAULT NULL,
    tags text[] DEFAULT '{}',
    customer_info jsonb DEFAULT '{}',
    agent_info jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.user_profiles(id),
    sender_type text NOT NULL CHECK (sender_type IN ('customer', 'agent', 'bot')),
    message text NOT NULL,
    message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    metadata jsonb DEFAULT '{}',
    read_by uuid[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 4. TABLES POUR LA GESTION D'INVENTAIRE
-- =====================================================

-- Table des entrepôts
CREATE TABLE IF NOT EXISTS public.warehouses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    address jsonb NOT NULL,
    contact jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    capacity_info jsonb DEFAULT '{}',
    operating_hours jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    contact jsonb DEFAULT '{}',
    address jsonb NOT NULL,
    payment_terms text DEFAULT NULL,
    lead_time_days integer DEFAULT NULL,
    minimum_order_amount numeric DEFAULT NULL,
    is_active boolean DEFAULT true,
    rating numeric DEFAULT NULL CHECK (rating >= 1 AND rating <= 5),
    notes text DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des articles d'inventaire
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id),
    warehouse_id uuid REFERENCES public.warehouses(id) DEFAULT NULL,
    sku text NOT NULL,
    quantity_available integer DEFAULT 0,
    quantity_reserved integer DEFAULT 0,
    quantity_allocated integer DEFAULT 0,
    quantity_incoming integer DEFAULT 0,
    reorder_point integer DEFAULT 10,
    max_stock_level integer DEFAULT NULL,
    unit_cost numeric NOT NULL,
    location text DEFAULT NULL,
    batch_number text DEFAULT NULL,
    expiration_date timestamp with time zone DEFAULT NULL,
    supplier_id uuid REFERENCES public.suppliers(id) DEFAULT NULL,
    last_restocked_at timestamp with time zone DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des mouvements d'inventaire
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id uuid REFERENCES public.inventory_items(id),
    movement_type text NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'adjustment', 'transfer', 'reserved', 'unreserved')),
    quantity integer NOT NULL,
    reference_id uuid DEFAULT NULL,
    reference_type text DEFAULT NULL CHECK (reference_type IN ('order', 'transfer', 'adjustment', 'purchase_order', 'return')),
    reason text DEFAULT NULL,
    notes text DEFAULT NULL,
    created_by uuid REFERENCES public.user_profiles(id) DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des alertes de stock
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id uuid REFERENCES public.inventory_items(id),
    alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'expiring_soon', 'expired')),
    threshold_value numeric DEFAULT NULL,
    current_value numeric NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_resolved boolean DEFAULT false,
    resolved_at timestamp with time zone DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 5. TABLES POUR LE SYSTÈME DE VENDEURS
-- =====================================================

-- Table des versements aux vendeurs
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id uuid REFERENCES public.user_profiles(id),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    platform_fee numeric NOT NULL DEFAULT 0,
    currency text DEFAULT 'USD',
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payout_method text DEFAULT NULL,
    transaction_id text DEFAULT NULL,
    notes text DEFAULT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) DEFAULT NULL,
    session_id text NOT NULL,
    ip_address inet DEFAULT NULL,
    user_agent text DEFAULT NULL,
    referrer text DEFAULT NULL,
    landing_page text DEFAULT NULL,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at timestamp with time zone DEFAULT NULL,
    page_views integer DEFAULT 0,
    events jsonb DEFAULT '[]'
);

-- =====================================================
-- 6. CRÉATION DES INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour les catégories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- Index pour les produits
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || description));

-- Index pour les commandes
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Index pour le panier
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON public.cart_items(product_id);

-- Index pour les avis
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Index pour les interactions
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product ON public.user_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.user_interactions(created_at);

-- Index pour les coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON public.coupons(valid_from, valid_to);

-- Index pour les paiements
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_search_user ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_query ON public.search_history(query);

-- =====================================================
-- 7. TRIGGERS POUR LES TIMESTAMPS
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Toutes les tables ont été créées avec succès!';
    RAISE NOTICE '📊 Tables créées: categories, products, user_profiles, orders, cart_items, reviews, user_interactions';
    RAISE NOTICE '🔥 Tables étendues: coupons, payments, notifications, search_history, analytics, wishlist, chat';
    RAISE NOTICE '📦 Tables inventaire: warehouses, suppliers, inventory_items, movements, alerts';
    RAISE NOTICE '⚡ Index créés pour optimiser les performances';
    RAISE NOTICE '🔄 Triggers configurés pour les timestamps automatiques';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Votre base de données e-commerce est prête!';
    RAISE NOTICE 'Prochaine étape: Configurer les politiques RLS pour la sécurité';
END $$;