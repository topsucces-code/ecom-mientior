-- =====================================================
-- INSERTION DE DONNÉES D'EXEMPLE
-- E-commerce Platform - Données de test complètes
-- =====================================================

-- =====================================================
-- 1. CATÉGORIES
-- =====================================================

INSERT INTO public.categories (name, description, slug, image_url) VALUES
('Électronique', 'Smartphones, ordinateurs, gadgets électroniques', 'electronique', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
('Vêtements', 'Mode homme, femme, accessoires', 'vetements', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'),
('Maison & Jardin', 'Décoration, meubles, jardinage', 'maison-jardin', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'),
('Sport & Loisirs', 'Équipements sportifs, jeux, loisirs', 'sport-loisirs', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'),
('Livres & Médias', 'Livres, films, musique, jeux vidéo', 'livres-medias', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'),
('Beauté & Santé', 'Cosmétiques, soins, bien-être', 'beaute-sante', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'),
('Automobile', 'Pièces auto, accessoires, outils', 'automobile', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'),
('Enfants & Bébés', 'Jouets, vêtements enfants, puériculture', 'enfants-bebes', 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400');

-- =====================================================
-- 2. PRODUITS DÉTAILLÉS
-- =====================================================

-- Récupérer les IDs des catégories
DO $$
DECLARE
    cat_electronique uuid;
    cat_vetements uuid;
    cat_maison uuid;
    cat_sport uuid;
    cat_livres uuid;
    cat_beaute uuid;
BEGIN
    SELECT id INTO cat_electronique FROM public.categories WHERE slug = 'electronique';
    SELECT id INTO cat_vetements FROM public.categories WHERE slug = 'vetements';
    SELECT id INTO cat_maison FROM public.categories WHERE slug = 'maison-jardin';
    SELECT id INTO cat_sport FROM public.categories WHERE slug = 'sport-loisirs';
    SELECT id INTO cat_livres FROM public.categories WHERE slug = 'livres-medias';
    SELECT id INTO cat_beaute FROM public.categories WHERE slug = 'beaute-sante';

    -- Électronique
    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, weight, images, tags, featured) VALUES
    ('iPhone 15 Pro Max', 'Le dernier smartphone Apple avec puce A17 Pro, appareil photo professionnel 48MP et écran Super Retina XDR 6.7"', 1299.99, 1399.99, 'IPHONE-15-PRO-MAX-256', 45, cat_electronique, 'Apple', 221, '["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500", "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=500"]', ARRAY['smartphone', 'apple', 'ios', 'pro'], true),
    ('MacBook Air M3', 'Ordinateur portable ultra-fin avec puce Apple M3, 13.6" Liquid Retina, jusqu\'à 18h d\'autonomie', 1399.99, 1499.99, 'MACBOOK-AIR-M3-256', 28, cat_electronique, 'Apple', 1240, '["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"]', ARRAY['laptop', 'apple', 'macos', 'm3'], true),
    ('Samsung Galaxy S24 Ultra', 'Smartphone Android premium avec S Pen intégré, zoom 100x et intelligence artificielle Galaxy AI', 1199.99, NULL, 'SAMSUNG-S24-ULTRA-512', 32, cat_electronique, 'Samsung', 232, '["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500"]', ARRAY['smartphone', 'samsung', 'android', 's-pen'], false),
    ('AirPods Pro 2', 'Écouteurs sans fil avec réduction de bruit adaptative, audio spatial et boîtier de charge MagSafe', 279.99, 299.99, 'AIRPODS-PRO-2-USB-C', 67, cat_electronique, 'Apple', 50.8, '["https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500"]', ARRAY['écouteurs', 'sans-fil', 'apple', 'noise-cancelling'], true),
    ('Gaming PC RTX 4080', 'PC Gaming haut de gamme avec RTX 4080, Intel i7-13700K, 32GB RAM, SSD 1TB NVMe', 2299.99, 2499.99, 'GAMING-PC-RTX4080-32GB', 12, cat_electronique, 'Custom Build', 8500, '["https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500"]', ARRAY['gaming', 'pc', 'rtx', 'intel'], false),

    -- Vêtements
    ('T-Shirt Bio Unisexe', 'T-shirt en coton biologique 100%, coupe décontractée, disponible en plusieurs couleurs', 29.99, 39.99, 'TSHIRT-BIO-UNISEX-M', 125, cat_vetements, 'EcoWear', 180, '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"]', ARRAY['t-shirt', 'bio', 'coton', 'unisexe'], false),
    ('Jean Slim Femme', 'Jean slim taille haute en denim stretch, coupe moderne et confortable', 79.99, 99.99, 'JEAN-SLIM-FEMME-28', 89, cat_vetements, 'DenimCo', 520, '["https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500"]', ARRAY['jean', 'femme', 'slim', 'denim'], true),
    ('Sneakers Running', 'Chaussures de running avec technologie de amortissement, semelle respirante', 129.99, 149.99, 'SNEAKERS-RUN-42', 76, cat_vetements, 'SportTech', 340, '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500"]', ARRAY['chaussures', 'running', 'sport', 'respirant'], false),

    -- Maison & Jardin
    ('Canapé Scandinave 3 places', 'Canapé moderne 3 places, tissu gris chiné, style scandinave, très confortable', 899.99, 1099.99, 'CANAPE-SCAND-3P-GRIS', 15, cat_maison, 'Nordic Home', 45000, '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500"]', ARRAY['canapé', 'scandinave', 'salon', '3places'], true),
    ('Plante Monstera Deliciosa', 'Grande plante d\'intérieur Monstera, pot décoratif inclus, facile d\'entretien', 49.99, 59.99, 'MONSTERA-DELICIOSA-L', 34, cat_maison, 'Green Paradise', 2500, '["https://images.unsplash.com/photo-1463154545680-d59320fd685d?w=500"]', ARRAY['plante', 'intérieur', 'monstera', 'décoration'], false),

    -- Sport & Loisirs
    ('Vélo Électrique Urbain', 'Vélo électrique pour la ville, autonomie 80km, écran LCD, batterie amovible', 1599.99, 1799.99, 'VELO-ELEC-URBAIN-M', 8, cat_sport, 'EcoBike', 24000, '["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500"]', ARRAY['vélo', 'électrique', 'urbain', 'écologique'], false),
    ('Tapis de Yoga Premium', 'Tapis de yoga antidérapant, épaisseur 6mm, matériaux écologiques', 79.99, 89.99, 'TAPIS-YOGA-PREMIUM-6MM', 45, cat_sport, 'YogaLife', 950, '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"]', ARRAY['yoga', 'tapis', 'sport', 'antidérapant'], false),

    -- Livres & Médias
    ('Livre "Développement Durable"', 'Guide complet sur les pratiques écologiques au quotidien, 350 pages', 24.99, 29.99, 'LIVRE-DEV-DURABLE-2024', 67, cat_livres, 'Éditions Vertes', 420, '["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500"]', ARRAY['livre', 'écologie', 'développement durable'], false),

    -- Beauté & Santé
    ('Crème Hydratante Bio', 'Crème visage hydratante aux ingrédients biologiques, tous types de peau', 39.99, 49.99, 'CREME-HYDRA-BIO-50ML', 78, cat_beaute, 'BioCosm', 120, '["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500"]', ARRAY['crème', 'bio', 'hydratante', 'visage'], false);
END $$;

-- =====================================================
-- 3. COUPONS DE RÉDUCTION
-- =====================================================

INSERT INTO public.coupons (code, type, value, description, minimum_order_amount, maximum_discount_amount, usage_limit, user_usage_limit, valid_from, valid_to, is_active) VALUES
('BIENVENUE10', 'percentage', 10, 'Réduction de 10% pour les nouveaux clients', 50.00, 100.00, 1000, 1, NOW(), NOW() + INTERVAL '3 months', true),
('LIVRAISON', 'free_shipping', 0, 'Livraison gratuite sans minimum', 0, NULL, 5000, 3, NOW(), NOW() + INTERVAL '1 month', true),
('SOLDES50', 'fixed', 50, 'Réduction fixe de 50€ sur votre commande', 200.00, NULL, 500, 1, NOW(), NOW() + INTERVAL '2 weeks', true),
('ELECTRONIQUE20', 'percentage', 20, 'Réduction spéciale électronique', 100.00, 300.00, 200, 1, NOW(), NOW() + INTERVAL '1 month', true),
('FIDELITE15', 'percentage', 15, 'Réduction fidélité pour clients VIP', 80.00, 150.00, 100, 2, NOW(), NOW() + INTERVAL '6 months', true);

-- =====================================================
-- 4. ENTREPÔTS ET FOURNISSEURS
-- =====================================================

INSERT INTO public.warehouses (name, code, address, contact, capacity_info, operating_hours) VALUES
('Entrepôt Central Paris', 'WH-PAR-01', '{"street": "123 Rue de la Logistique", "city": "Paris", "zipcode": "75001", "country": "France"}', '{"phone": "+33123456789", "email": "paris@warehouse.com"}', '{"total_capacity": 10000, "used_capacity": 6500}', '{"monday": "08:00-18:00", "friday": "08:00-18:00", "saturday": "09:00-12:00"}'),
('Dépôt Lyon', 'WH-LYO-01', '{"street": "456 Avenue du Commerce", "city": "Lyon", "zipcode": "69000", "country": "France"}', '{"phone": "+33987654321", "email": "lyon@warehouse.com"}', '{"total_capacity": 5000, "used_capacity": 2800}', '{"monday": "07:30-17:30", "friday": "07:30-17:30"}'),
('Centre Marseille', 'WH-MAR-01', '{"street": "789 Boulevard du Port", "city": "Marseille", "zipcode": "13000", "country": "France"}', '{"phone": "+33456789123", "email": "marseille@warehouse.com"}', '{"total_capacity": 3000, "used_capacity": 1200}', '{"monday": "08:00-17:00", "friday": "08:00-17:00"}');

INSERT INTO public.suppliers (name, code, contact, address, payment_terms, lead_time_days, minimum_order_amount, rating) VALUES
('Tech Distributor EU', 'SUP-TECH-01', '{"phone": "+33112233445", "email": "orders@techdist.eu", "contact_person": "Marie Dubois"}', '{"street": "10 Rue de la Tech", "city": "Paris", "zipcode": "75002", "country": "France"}', 'Net 30', 7, 1000.00, 4.5),
('Fashion Wholesale', 'SUP-FASH-01', '{"phone": "+33998877665", "email": "sales@fashionwhole.com", "contact_person": "Pierre Martin"}', '{"street": "25 Avenue de la Mode", "city": "Lyon", "zipcode": "69001", "country": "France"}', 'Net 15', 14, 500.00, 4.2),
('Home & Garden Supply', 'SUP-HOME-01', '{"phone": "+33556677889", "email": "info@homegarden.fr", "contact_person": "Sophie Laurent"}', '{"street": "88 Rue des Jardins", "city": "Nantes", "zipcode": "44000", "country": "France"}', 'Net 45', 21, 800.00, 4.8);

-- =====================================================
-- 5. AGENTS DE CHAT
-- =====================================================

-- Note: Ces agents seront créés après qu'on ait des user_profiles
-- On les créera dans un script séparé une fois l'authentification configurée

-- =====================================================
-- 6. NOTIFICATIONS SYSTÈME
-- =====================================================

-- Insérer quelques notifications système génériques
INSERT INTO public.notifications (user_id, type, title, message, category, priority, read) VALUES
(NULL, 'info', 'Bienvenue sur notre plateforme !', 'Découvrez nos dernières offres et promotions exclusives.', 'promotion', 'medium', false),
(NULL, 'success', 'Nouvelle collection disponible', 'La collection Automne/Hiver est maintenant en ligne avec -20% sur tous les articles.', 'promotion', 'high', false);

-- =====================================================
-- 7. ANALYTICS DE PRODUITS (DONNÉES HISTORIQUES)
-- =====================================================

-- Insérer des données d'analytics pour les 30 derniers jours
DO $$
DECLARE
    product_record RECORD;
    day_offset INTEGER;
    current_date DATE;
BEGIN
    -- Pour chaque produit, créer des données d'analytics
    FOR product_record IN SELECT id FROM public.products LOOP
        -- Pour les 30 derniers jours
        FOR day_offset IN 0..29 LOOP
            current_date := CURRENT_DATE - day_offset;
            
            INSERT INTO public.product_analytics (
                product_id, 
                date, 
                views, 
                clicks, 
                cart_adds, 
                purchases, 
                revenue,
                conversion_rate
            ) VALUES (
                product_record.id,
                current_date,
                FLOOR(RANDOM() * 100 + 10)::INTEGER, -- 10-110 vues
                FLOOR(RANDOM() * 30 + 5)::INTEGER,   -- 5-35 clics
                FLOOR(RANDOM() * 10 + 1)::INTEGER,   -- 1-11 ajouts panier
                FLOOR(RANDOM() * 3)::INTEGER,        -- 0-3 achats
                ROUND((RANDOM() * 500 + 50)::NUMERIC, 2), -- 50-550€ revenus
                ROUND((RANDOM() * 5 + 1)::NUMERIC, 2)     -- 1-6% conversion
            );
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📊 Données d\'exemple insérées avec succès !';
    RAISE NOTICE '🏷️ Catégories: 8 catégories principales créées';
    RAISE NOTICE '📱 Produits: 15+ produits détaillés avec images et descriptions';
    RAISE NOTICE '🎟️ Coupons: 5 coupons de réduction actifs';
    RAISE NOTICE '🏪 Entrepôts: 3 entrepôts configurés (Paris, Lyon, Marseille)';
    RAISE NOTICE '🤝 Fournisseurs: 3 fournisseurs partenaires';
    RAISE NOTICE '📈 Analytics: 30 jours de données historiques générées';
    RAISE NOTICE '🔔 Notifications: Messages système créés';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Votre base de données contient maintenant des données réalistes !';
    RAISE NOTICE '🎯 Prêt pour les tests et le développement';
END $$;