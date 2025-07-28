-- =====================================================
-- AJOUT MASSIF DE PRODUITS - 19 NOUVEAUX PRODUITS
-- Contournement des politiques RLS via SQL direct
-- =====================================================

DO $$
DECLARE
    cat_electronics uuid := '550e8400-e29b-41d4-a716-446655440001';
    cat_clothing uuid := '550e8400-e29b-41d4-a716-446655440002';
    cat_books uuid := '550e8400-e29b-41d4-a716-446655440003';
    cat_electronique uuid := '179f2a0d-285b-4668-90f0-0687ea19e963';
    cat_vetements uuid := '1ebddf49-8f9e-4f80-a85e-ecc39cf0dc4b';
    cat_maison uuid := '9714ecd1-69d4-4e7d-a88d-1d257b900acd';
BEGIN
    -- =====================================================
    -- ÉLECTRONIQUE (5 produits)
    -- =====================================================
    
    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'iPad Air 5e génération', 'Tablette Apple avec puce M1, écran Liquid Retina 10.9", parfaite pour le travail et les loisirs', 699.99, 799.99, 'IPAD-AIR-M1', 30, cat_electronics, 'Apple',
           ARRAY['tablette', 'apple', 'm1', 'ipad'], true, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'IPAD-AIR-M1');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Clavier Mécanique RGB', 'Clavier gaming mécanique avec rétroéclairage RGB, switches Cherry MX', 159.99, 'KEYBOARD-RGB-MX', 40, cat_electronics, 'GamerTech',
           ARRAY['clavier', 'gaming', 'rgb', 'mécanique'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'KEYBOARD-RGB-MX');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Écran 4K 27 pouces', 'Moniteur 4K UHD 27" avec HDR, parfait pour le gaming et le design', 449.99, 549.99, 'MONITOR-4K-27', 20, cat_electronics, 'ViewMaster',
           ARRAY['écran', '4k', 'moniteur', 'hdr'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'MONITOR-4K-27');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Webcam HD 1080p', 'Webcam haute définition avec micro intégré, idéale pour le télétravail', 89.99, 'WEBCAM-HD-1080', 60, cat_electronics, 'StreamTech',
           ARRAY['webcam', 'hd', 'télétravail', 'streaming'], true, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'WEBCAM-HD-1080');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Chargeur Sans Fil Rapide', 'Station de charge sans fil 15W compatible iPhone et Android', 39.99, 'CHARGER-WIRELESS-15W', 80, cat_electronics, 'PowerMax',
           ARRAY['chargeur', 'sans-fil', 'qi', 'rapide'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'CHARGER-WIRELESS-15W');

    -- =====================================================
    -- VÊTEMENTS (4 produits)
    -- =====================================================

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Hoodie Unisexe Premium', 'Sweat à capuche unisexe en coton bio, coupe décontractée, plusieurs coloris', 79.99, 99.99, 'HOODIE-UNISEX-PREMIUM', 60, cat_clothing, 'UrbanStyle',
           ARRAY['hoodie', 'unisexe', 'coton', 'bio'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'HOODIE-UNISEX-PREMIUM');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Baskets Running Femme', 'Chaussures de running légères avec amorti responsive, parfaites pour le sport', 129.99, 'SNEAKERS-RUN-WOMEN', 45, cat_clothing, 'SportFlow',
           ARRAY['baskets', 'running', 'femme', 'sport'], true, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SNEAKERS-RUN-WOMEN');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Veste en Cuir Homme', 'Veste en cuir véritable, style motard, coupe slim, finitions soignées', 299.99, 'JACKET-LEATHER-MEN', 25, cat_clothing, 'LeatherCraft',
           ARRAY['veste', 'cuir', 'homme', 'motard'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'JACKET-LEATHER-MEN');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Robe d''été Fleurie', 'Robe légère en viscose avec motifs floraux, parfaite pour l''été', 59.99, 79.99, 'DRESS-SUMMER-FLORAL', 35, cat_clothing, 'SummerVibes',
           ARRAY['robe', 'été', 'fleurie', 'viscose'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'DRESS-SUMMER-FLORAL');

    -- =====================================================
    -- LIVRES (2 produits)
    -- =====================================================

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Guide Photographie Numérique', 'Manuel complet de photographie numérique, techniques avancées et astuces', 39.99, 'BOOK-PHOTO-DIGITAL-GUIDE', 40, cat_books, 'PhotoEditions',
           ARRAY['livre', 'photographie', 'numérique', 'guide'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'BOOK-PHOTO-DIGITAL-GUIDE');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Roman Fantasy Épique', 'Trilogie fantasy complète, monde imaginaire riche, aventure épique', 29.99, 34.99, 'BOOK-FANTASY-TRILOGY', 60, cat_books, 'FantasyPress',
           ARRAY['livre', 'fantasy', 'roman', 'trilogie'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'BOOK-FANTASY-TRILOGY');

    -- =====================================================
    -- ÉLECTRONIQUE FRANÇAISE (2 produits)
    -- =====================================================

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Smartphone Android Premium', 'Smartphone Android haut de gamme avec appareil photo 108MP, 5G, écran AMOLED', 599.99, 'ANDROID-PREMIUM-5G', 35, cat_electronique, 'TechFrance',
           ARRAY['smartphone', 'android', '5g', 'premium'], true, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'ANDROID-PREMIUM-5G');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Enceinte Bluetooth Portable', 'Haut-parleur Bluetooth étanche IPX7, son 360°, autonomie 12h', 79.99, 'SPEAKER-BT-PORTABLE-12H', 55, cat_electronique, 'SoundWave',
           ARRAY['enceinte', 'bluetooth', 'portable', 'étanche'], true, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SPEAKER-BT-PORTABLE-12H');

    -- =====================================================
    -- VÊTEMENTS FRANÇAIS (2 produits)
    -- =====================================================

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Sac à Dos Urbain', 'Sac à dos moderne avec compartiment laptop, port USB, résistant à l''eau', 59.99, 79.99, 'BACKPACK-URBAN-LAPTOP', 35, cat_vetements, 'CityBag',
           ARRAY['sac', 'dos', 'urbain', 'laptop'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'BACKPACK-URBAN-LAPTOP');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Lunettes de Soleil Aviateur', 'Lunettes de soleil style aviateur, verres polarisés, protection UV 100%', 119.99, 'SUNGLASSES-AVIATOR-UV', 45, cat_vetements, 'SunStyle',
           ARRAY['lunettes', 'soleil', 'aviateur', 'uv'], true, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SUNGLASSES-AVIATOR-UV');

    -- =====================================================
    -- MAISON & JARDIN (4 produits)
    -- =====================================================

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Lampe de Bureau LED', 'Lampe de bureau moderne avec variateur, port USB, design épuré', 89.99, 'LAMP-DESK-LED-USB', 50, cat_maison, 'LightHome',
           ARRAY['lampe', 'bureau', 'led', 'usb'], true, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'LAMP-DESK-LED-USB');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Coussin Décoratif Set', 'Set de 4 coussins décoratifs en velours, coloris assortis, 45x45cm', 49.99, 69.99, 'CUSHION-SET-VELVET-4', 30, cat_maison, 'CozyHome',
           ARRAY['coussin', 'décoratif', 'velours', 'set'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'CUSHION-SET-VELVET-4');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Plante Artificielle Monstera', 'Monstera deliciosa artificielle 120cm, très réaliste, pot inclus', 79.99, 'PLANT-ARTIFICIAL-MONSTERA', 25, cat_maison, 'GreenDecor',
           ARRAY['plante', 'artificielle', 'monstera', 'décoration'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'PLANT-ARTIFICIAL-MONSTERA');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured, status)
    SELECT 'Kit Café Barista', 'Kit complet pour faire un café comme un barista : moussoir, doseur, tamper', 89.99, 'COFFEE-KIT-BARISTA', 25, cat_maison, 'CoffeePro',
           ARRAY['café', 'barista', 'kit', 'moussoir'], false, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'COFFEE-KIT-BARISTA');

END $$;

-- =====================================================
-- COMPTAGE FINAL
-- =====================================================

DO $$
DECLARE
    total_count integer;
    electronics_count integer;
    clothing_count integer;
    books_count integer;
    electronique_fr_count integer;
    vetements_fr_count integer;
    maison_count integer;
BEGIN
    -- Compter les totaux
    SELECT COUNT(*) INTO total_count FROM public.products WHERE status = 'active';
    SELECT COUNT(*) INTO electronics_count FROM public.products WHERE category_id = '550e8400-e29b-41d4-a716-446655440001';
    SELECT COUNT(*) INTO clothing_count FROM public.products WHERE category_id = '550e8400-e29b-41d4-a716-446655440002';
    SELECT COUNT(*) INTO books_count FROM public.products WHERE category_id = '550e8400-e29b-41d4-a716-446655440003';
    SELECT COUNT(*) INTO electronique_fr_count FROM public.products WHERE category_id = '179f2a0d-285b-4668-90f0-0687ea19e963';
    SELECT COUNT(*) INTO vetements_fr_count FROM public.products WHERE category_id = '1ebddf49-8f9e-4f80-a85e-ecc39cf0dc4b';
    SELECT COUNT(*) INTO maison_count FROM public.products WHERE category_id = '9714ecd1-69d4-4e7d-a88d-1d257b900acd';

    RAISE NOTICE '';
    RAISE NOTICE '🎉 AJOUT MASSIF TERMINÉ !';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total produits actifs: %', total_count;
    RAISE NOTICE '';
    RAISE NOTICE '📊 Répartition par catégorie:';
    RAISE NOTICE '   Electronics (EN): % produits', electronics_count;
    RAISE NOTICE '   Clothing (EN): % produits', clothing_count;
    RAISE NOTICE '   Books (EN): % produits', books_count;
    RAISE NOTICE '   Électronique (FR): % produits', electronique_fr_count;
    RAISE NOTICE '   Vêtements (FR): % produits', vetements_fr_count;
    RAISE NOTICE '   Maison & Jardin (FR): % produits', maison_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Votre site e-commerce a maintenant un catalogue complet !';
    RAISE NOTICE '🏠 Rafraîchissez localhost:3010 pour voir les nouveaux produits';

END $$;