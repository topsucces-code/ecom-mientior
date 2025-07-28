-- =====================================================
-- AJOUTER PLUS DE PRODUITS DE TEST
-- E-commerce Platform - Catalogue étendu
-- =====================================================

DO $$
DECLARE
    cat_electronique uuid;
    cat_vetements uuid;
    cat_maison uuid;
    cat_electronics uuid;
    cat_clothing uuid;
    cat_books uuid;
BEGIN
    -- Récupérer les IDs des catégories (français et anglais)
    SELECT id INTO cat_electronique FROM public.categories WHERE slug = 'electronique';
    SELECT id INTO cat_vetements FROM public.categories WHERE slug = 'vetements';
    SELECT id INTO cat_maison FROM public.categories WHERE slug = 'maison-jardin';
    SELECT id INTO cat_electronics FROM public.categories WHERE slug = 'electronics';
    SELECT id INTO cat_clothing FROM public.categories WHERE slug = 'clothing';
    SELECT id INTO cat_books FROM public.categories WHERE slug = 'books';

    -- =====================================================
    -- ÉLECTRONIQUE - Plus de produits
    -- =====================================================
    
    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'iPad Air 5e génération', 'Tablette Apple avec puce M1, écran Liquid Retina 10.9", parfaite pour le travail et les loisirs', 699.99, 799.99, 'IPAD-AIR-M1', 30, cat_electronics, 'Apple',
           ARRAY['tablette', 'apple', 'm1', 'ipad'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'IPAD-AIR-M1');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Clavier Mécanique RGB', 'Clavier gaming mécanique avec rétroéclairage RGB, switches Cherry MX', 159.99, 'KEYBOARD-RGB-MX', 40, cat_electronics, 'GamerTech',
           ARRAY['clavier', 'gaming', 'rgb', 'mécanique']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'KEYBOARD-RGB-MX');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Écran 4K 27 pouces', 'Moniteur 4K UHD 27" avec HDR, parfait pour le gaming et le design', 449.99, 549.99, 'MONITOR-4K-27', 20, cat_electronics, 'ViewMaster',
           ARRAY['écran', '4k', 'moniteur', 'hdr']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'MONITOR-4K-27');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'Webcam HD 1080p', 'Webcam haute définition avec micro intégré, idéale pour le télétravail', 89.99, 'WEBCAM-HD-1080', 60, cat_electronics, 'StreamTech',
           ARRAY['webcam', 'hd', 'télétravail', 'streaming'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'WEBCAM-HD-1080');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Chargeur Sans Fil Rapide', 'Station de charge sans fil 15W compatible iPhone et Android', 39.99, 'CHARGER-WIRELESS-15W', 80, cat_electronics, 'PowerMax',
           ARRAY['chargeur', 'sans-fil', 'qi', 'rapide']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'CHARGER-WIRELESS-15W');

    -- =====================================================
    -- VÊTEMENTS - Mode diversifiée
    -- =====================================================

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Hoodie Unisexe Premium', 'Sweat à capuche unisexe en coton bio, coupe décontractée, plusieurs coloris', 79.99, 99.99, 'HOODIE-UNISEX-PREMIUM', 60, cat_clothing, 'UrbanStyle',
           ARRAY['hoodie', 'unisexe', 'coton', 'bio']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'HOODIE-UNISEX-PREMIUM');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'Baskets Running Femme', 'Chaussures de running légères avec amorti responsive, parfaites pour le sport', 129.99, 'SNEAKERS-RUN-WOMEN', 45, cat_clothing, 'SportFlow',
           ARRAY['baskets', 'running', 'femme', 'sport'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SNEAKERS-RUN-WOMEN');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Veste en Cuir Homme', 'Veste en cuir véritable, style motard, coupe slim, finitions soignées', 299.99, 'JACKET-LEATHER-MEN', 25, cat_clothing, 'LeatherCraft',
           ARRAY['veste', 'cuir', 'homme', 'motard']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'JACKET-LEATHER-MEN');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Robe d''été Fleurie', 'Robe légère en viscose avec motifs floraux, parfaite pour l''été', 59.99, 79.99, 'DRESS-SUMMER-FLORAL', 35, cat_clothing, 'SummerVibes',
           ARRAY['robe', 'été', 'fleurie', 'viscose']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'DRESS-SUMMER-FLORAL');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Montre Connectée Sport', 'Smartwatch avec GPS, capteur cardiaque, étanche, autonomie 7 jours', 199.99, 'SMARTWATCH-SPORT-GPS', 40, cat_electronics, 'FitTracker',
           ARRAY['montre', 'connectée', 'sport', 'gps']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SMARTWATCH-SPORT-GPS');

    -- =====================================================
    -- MAISON & DÉCORATION
    -- =====================================================

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'Lampe de Bureau LED', 'Lampe de bureau moderne avec variateur, port USB, design épuré', 89.99, 'LAMP-DESK-LED-USB', 50, cat_maison, 'LightHome',
           ARRAY['lampe', 'bureau', 'led', 'usb'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'LAMP-DESK-LED-USB');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Coussin Décoratif Set', 'Set de 4 coussins décoratifs en velours, coloris assortis, 45x45cm', 49.99, 69.99, 'CUSHION-SET-VELVET-4', 30, cat_maison, 'CozyHome',
           ARRAY['coussin', 'décoratif', 'velours', 'set']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'CUSHION-SET-VELVET-4');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Plante Artificielle Monstera', 'Monstera deliciosa artificielle 120cm, très réaliste, pot inclus', 79.99, 'PLANT-ARTIFICIAL-MONSTERA', 25, cat_maison, 'GreenDecor',
           ARRAY['plante', 'artificielle', 'monstera', 'décoration']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'PLANT-ARTIFICIAL-MONSTERA');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Tapis Berbère Moderne', 'Tapis style berbère 160x230cm, motifs géométriques, fibres naturelles', 159.99, 'RUG-BERBER-MODERN-160', 15, cat_maison, 'RugCraft',
           ARRAY['tapis', 'berbère', 'géométrique', 'naturel']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'RUG-BERBER-MODERN-160');

    -- =====================================================
    -- LIVRES & CULTURE
    -- =====================================================

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Guide Photographie Numérique', 'Manuel complet de photographie numérique, techniques avancées et astuces', 39.99, 'BOOK-PHOTO-DIGITAL-GUIDE', 40, cat_books, 'PhotoEditions',
           ARRAY['livre', 'photographie', 'numérique', 'guide']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'BOOK-PHOTO-DIGITAL-GUIDE');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Roman Fantasy Épique', 'Trilogie fantasy complète, monde imaginaire riche, aventure épique', 29.99, 34.99, 'BOOK-FANTASY-TRILOGY', 60, cat_books, 'FantasyPress',
           ARRAY['livre', 'fantasy', 'roman', 'trilogie']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'BOOK-FANTASY-TRILOGY');

    -- =====================================================
    -- PRODUITS SUPPLÉMENTAIRES DIVERS
    -- =====================================================

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'Enceinte Bluetooth Portable', 'Haut-parleur Bluetooth étanche IPX7, son 360°, autonomie 12h', 79.99, 'SPEAKER-BT-PORTABLE-12H', 55, cat_electronics, 'SoundWave',
           ARRAY['enceinte', 'bluetooth', 'portable', 'étanche'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SPEAKER-BT-PORTABLE-12H');

    INSERT INTO public.products (name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Sac à Dos Urbain', 'Sac à dos moderne avec compartiment laptop, port USB, résistant à l''eau', 59.99, 79.99, 'BACKPACK-URBAN-LAPTOP', 35, cat_clothing, 'CityBag',
           ARRAY['sac', 'dos', 'urbain', 'laptop']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'BACKPACK-URBAN-LAPTOP');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags)
    SELECT 'Kit Café Barista', 'Kit complet pour faire un café comme un barista : moussoir, doseur, tamper', 89.99, 'COFFEE-KIT-BARISTA', 25, cat_maison, 'CoffeePro',
           ARRAY['café', 'barista', 'kit', 'moussoir']
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'COFFEE-KIT-BARISTA');

    INSERT INTO public.products (name, description, price, sku, inventory_quantity, category_id, brand, tags, featured)
    SELECT 'Lunettes de Soleil Aviateur', 'Lunettes de soleil style aviateur, verres polarisés, protection UV 100%', 119.99, 'SUNGLASSES-AVIATOR-UV', 45, cat_clothing, 'SunStyle',
           ARRAY['lunettes', 'soleil', 'aviateur', 'uv'], true
    WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SUNGLASSES-AVIATOR-UV');

END $$;

-- =====================================================
-- METTRE À JOUR QUELQUES PRODUITS AVEC DES IMAGES
-- =====================================================

-- Ajouter des images aux produits existants (format text[])
UPDATE public.products 
SET images = ARRAY['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500', 'https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=500']
WHERE sku = 'IPHONE-15-PRO' AND (images IS NULL OR array_length(images, 1) IS NULL);

UPDATE public.products 
SET images = ARRAY['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500']
WHERE sku = 'MACBOOK-AIR-M3' AND (images IS NULL OR array_length(images, 1) IS NULL);

UPDATE public.products 
SET images = ARRAY['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500']
WHERE sku = 'AIRPODS-PRO-2' AND (images IS NULL OR array_length(images, 1) IS NULL);

UPDATE public.products 
SET images = ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500']
WHERE sku = 'CANAPE-SCAND-3P' AND (images IS NULL OR array_length(images, 1) IS NULL);