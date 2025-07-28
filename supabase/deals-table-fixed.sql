-- ===================================================================
-- DEALS OF THE DAY TABLE CREATION - VERSION CORRIGÉE
-- Cette version ne dépend pas de la colonne role dans user_profiles
-- ===================================================================

-- Create deals_of_the_day table
CREATE TABLE IF NOT EXISTS deals_of_the_day (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    original_price DECIMAL(10, 2) NOT NULL,
    deal_price DECIMAL(10, 2) NOT NULL,
    discount_percentage INTEGER NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    quantity_available INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT deal_price_less_than_original CHECK (deal_price < original_price),
    CONSTRAINT positive_prices CHECK (original_price > 0 AND deal_price > 0),
    CONSTRAINT valid_discount CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    CONSTRAINT valid_dates CHECK (ends_at > starts_at),
    CONSTRAINT quantity_sold_not_negative CHECK (quantity_sold >= 0),
    CONSTRAINT quantity_available_positive CHECK (quantity_available IS NULL OR quantity_available > 0),
    CONSTRAINT quantity_sold_not_exceed_available CHECK (quantity_available IS NULL OR quantity_sold <= quantity_available)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_product_id ON deals_of_the_day(product_id);
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals_of_the_day(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_dates ON deals_of_the_day(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_deals_discount ON deals_of_the_day(discount_percentage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals_of_the_day(created_at);

-- Create composite index for active deals within date range
CREATE INDEX IF NOT EXISTS idx_deals_active_current ON deals_of_the_day(is_active, starts_at, ends_at) 
WHERE is_active = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at_trigger
    BEFORE UPDATE ON deals_of_the_day
    FOR EACH ROW
    EXECUTE FUNCTION update_deals_updated_at();

-- Create function to automatically calculate discount percentage
CREATE OR REPLACE FUNCTION calculate_discount_percentage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.discount_percentage = ROUND(((NEW.original_price - NEW.deal_price) / NEW.original_price * 100)::numeric, 0)::integer;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_discount_percentage_trigger
    BEFORE INSERT OR UPDATE OF original_price, deal_price ON deals_of_the_day
    FOR EACH ROW
    EXECUTE FUNCTION calculate_discount_percentage();

-- Row Level Security (RLS)
ALTER TABLE deals_of_the_day ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to active deals
CREATE POLICY "Public can read active deals" ON deals_of_the_day
    FOR SELECT USING (is_active = true AND starts_at <= NOW() AND ends_at >= NOW());

-- Policy for authenticated users to read all deals
CREATE POLICY "Authenticated users can read all deals" ON deals_of_the_day
    FOR SELECT USING (auth.role() = 'authenticated');

-- Simplified policy for admin management (tous les utilisateurs authentifiés peuvent gérer)
CREATE POLICY "Authenticated users can manage deals" ON deals_of_the_day
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample deals based on existing products
DO $$
DECLARE
    product_record RECORD;
    deal_count INT := 0;
BEGIN
    -- Insert deals for featured products (30% discount)
    FOR product_record IN 
        SELECT id, price FROM products 
        WHERE featured = true AND status = 'active' 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        INSERT INTO deals_of_the_day (
            product_id, 
            original_price, 
            deal_price, 
            starts_at, 
            ends_at, 
            quantity_available
        ) VALUES (
            product_record.id,
            product_record.price,
            ROUND((product_record.price * 0.7)::numeric, 2), -- 30% discount
            NOW(),
            NOW() + INTERVAL '7 days',
            10
        ) ON CONFLICT DO NOTHING;
        
        deal_count := deal_count + 1;
    END LOOP;

    -- Insert more varied deals with different discount ranges
    FOR product_record IN 
        SELECT id, price FROM products 
        WHERE status = 'active' AND inventory_quantity > 0
        ORDER BY RANDOM()
        LIMIT 8
    LOOP
        INSERT INTO deals_of_the_day (
            product_id, 
            original_price, 
            deal_price, 
            starts_at, 
            ends_at, 
            quantity_available
        ) VALUES (
            product_record.id,
            product_record.price,
            CASE 
                WHEN RANDOM() < 0.3 THEN ROUND((product_record.price * 0.5)::numeric, 2) -- 50% discount
                WHEN RANDOM() < 0.6 THEN ROUND((product_record.price * 0.6)::numeric, 2) -- 40% discount
                ELSE ROUND((product_record.price * 0.75)::numeric, 2) -- 25% discount
            END,
            NOW() - INTERVAL '1 hour',
            NOW() + INTERVAL '24 hours',
            CASE 
                WHEN RANDOM() < 0.5 THEN 5
                ELSE 15
            END
        ) ON CONFLICT DO NOTHING;
        
        deal_count := deal_count + 1;
    END LOOP;

    RAISE NOTICE 'Inserted % sample deals', deal_count;
END $$;

-- Create a view for easy querying of active deals with product info
CREATE OR REPLACE VIEW active_deals_with_products AS
SELECT 
    d.*,
    p.name as product_name,
    p.description as product_description,
    p.images as product_images,
    p.brand as product_brand,
    p.category_id,
    p.inventory_quantity,
    c.name as category_name
FROM deals_of_the_day d
JOIN products p ON d.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE d.is_active = true 
  AND d.starts_at <= NOW() 
  AND d.ends_at >= NOW()
ORDER BY d.discount_percentage DESC, d.created_at DESC;

-- Create function to get today's best deal
CREATE OR REPLACE FUNCTION get_todays_best_deal()
RETURNS TABLE (
    deal_id UUID,
    product_id UUID,
    product_name TEXT,
    original_price DECIMAL(10,2),
    deal_price DECIMAL(10,2),
    discount_percentage INTEGER,
    time_left INTERVAL,
    product_images TEXT[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as deal_id,
        d.product_id,
        p.name as product_name,
        d.original_price,
        d.deal_price,
        d.discount_percentage,
        d.ends_at - NOW() as time_left,
        p.images as product_images
    FROM deals_of_the_day d
    JOIN products p ON d.product_id = p.id
    WHERE d.is_active = true 
      AND d.starts_at <= NOW() 
      AND d.ends_at >= NOW()
    ORDER BY d.discount_percentage DESC, d.created_at DESC
    LIMIT 1;
END;
$$;

-- Create function to check if a product is currently on deal
CREATE OR REPLACE FUNCTION is_product_on_deal(p_product_id UUID)
RETURNS TABLE (
    is_on_deal BOOLEAN,
    deal_price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    discount_percentage INTEGER,
    ends_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN d.id IS NOT NULL THEN true ELSE false END as is_on_deal,
        d.deal_price,
        d.original_price,
        d.discount_percentage,
        d.ends_at
    FROM products p
    LEFT JOIN deals_of_the_day d ON p.id = d.product_id 
        AND d.is_active = true 
        AND d.starts_at <= NOW() 
        AND d.ends_at >= NOW()
    WHERE p.id = p_product_id
    LIMIT 1;
END;
$$;

-- Success message
DO $$
DECLARE
    deal_count INT;
BEGIN
    SELECT COUNT(*) INTO deal_count FROM deals_of_the_day WHERE is_active = true;
    
    RAISE NOTICE '🎉 ===================================';
    RAISE NOTICE '✅ Deals of the Day table created successfully!';
    RAISE NOTICE '📊 Total active deals: %', deal_count;
    RAISE NOTICE '✅ Features included:';
    RAISE NOTICE '   ✅ Deals table with proper constraints';
    RAISE NOTICE '   ✅ Automatic discount calculation';
    RAISE NOTICE '   ✅ Row Level Security policies';
    RAISE NOTICE '   ✅ Performance indexes';
    RAISE NOTICE '   ✅ Sample data inserted';
    RAISE NOTICE '   ✅ Helper functions created';
    RAISE NOTICE '   ✅ Active deals view created';
    RAISE NOTICE '🚀 Ready to use on homepage!';
    RAISE NOTICE '🌐 Check: http://localhost:3010';
    RAISE NOTICE '🎉 ===================================';
END $$;