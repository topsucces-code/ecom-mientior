
-- Advanced Database Functions for E-commerce Platform
-- These functions provide business logic and analytics capabilities

-- =====================================================
-- PAYMENT ANALYTICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_payment_analytics(
    date_from text,
    date_to text
)
RETURNS TABLE (
    total_amount numeric,
    transaction_count bigint,
    success_rate numeric,
    average_amount numeric,
    revenue_by_day jsonb,
    payment_methods jsonb
) AS $$
DECLARE
    success_count bigint;
    total_count bigint;
BEGIN
    -- Get basic metrics
    SELECT 
        COALESCE(SUM(amount), 0),
        COUNT(*)
    INTO total_amount, total_count
    FROM payments
    WHERE created_at >= date_from::timestamp
    AND created_at <= date_to::timestamp
    AND amount > 0; -- Exclude refunds

    -- Get success count
    SELECT COUNT(*)
    INTO success_count
    FROM payments
    WHERE created_at >= date_from::timestamp
    AND created_at <= date_to::timestamp
    AND amount > 0
    AND status = 'completed';

    -- Calculate success rate
    success_rate := CASE 
        WHEN total_count > 0 THEN (success_count::numeric / total_count::numeric) * 100
        ELSE 0
    END;

    -- Calculate average amount
    average_amount := CASE 
        WHEN success_count > 0 THEN total_amount / success_count
        ELSE 0
    END;

    -- Get revenue by day
    WITH daily_revenue AS (
        SELECT 
            DATE(created_at) as day,
            SUM(amount) as revenue,
            COUNT(*) as transactions
        FROM payments
        WHERE created_at >= date_from::timestamp
        AND created_at <= date_to::timestamp
        AND amount > 0
        AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY day
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', day,
            'revenue', revenue,
            'transactions', transactions
        )
    ) INTO revenue_by_day
    FROM daily_revenue;

    -- Get payment methods breakdown
    WITH payment_method_stats AS (
        SELECT 
            pm.type as method_type,
            pm.provider,
            COUNT(*) as transaction_count,
            SUM(p.amount) as total_amount,
            AVG(p.amount) as avg_amount
        FROM payments p
        JOIN payment_methods pm ON p.payment_method_id = pm.id
        WHERE p.created_at >= date_from::timestamp
        AND p.created_at <= date_to::timestamp
        AND p.amount > 0
        AND p.status = 'completed'
        GROUP BY pm.type, pm.provider
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'type', method_type,
            'provider', provider,
            'count', transaction_count,
            'total', total_amount,
            'average', avg_amount
        )
    ) INTO payment_methods
    FROM payment_method_stats;

    -- Return the results
    RETURN QUERY SELECT 
        get_payment_analytics.total_amount,
        get_payment_analytics.total_count,
        get_payment_analytics.success_rate,
        get_payment_analytics.average_amount,
        COALESCE(get_payment_analytics.revenue_by_day, '[]'::jsonb),
        COALESCE(get_payment_analytics.payment_methods, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INVENTORY METRICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_inventory_metrics(
    warehouse_id text DEFAULT NULL
)
RETURNS TABLE (
    total_items bigint,
    total_value numeric,
    low_stock_items bigint,
    out_of_stock_items bigint,
    turnover_rate numeric,
    top_selling_products jsonb
) AS $$
DECLARE
    avg_inventory_value numeric;
    cogs numeric;
BEGIN
    -- Apply warehouse filter if provided
    IF warehouse_id IS NOT NULL THEN
        -- Get metrics for specific warehouse
        SELECT 
            COUNT(*),
            SUM(quantity_available * unit_cost),
            COUNT(*) FILTER (WHERE quantity_available <= reorder_point AND quantity_available > 0),
            COUNT(*) FILTER (WHERE quantity_available = 0)
        INTO total_items, total_value, low_stock_items, out_of_stock_items
        FROM inventory_items ii
        WHERE ii.warehouse_id = get_inventory_metrics.warehouse_id;
    ELSE
        -- Get metrics for all warehouses
        SELECT 
            COUNT(*),
            SUM(quantity_available * unit_cost),
            COUNT(*) FILTER (WHERE quantity_available <= reorder_point AND quantity_available > 0),
            COUNT(*) FILTER (WHERE quantity_available = 0)
        INTO total_items, total_value, low_stock_items, out_of_stock_items
        FROM inventory_items;
    END IF;

    -- Calculate inventory turnover rate (simplified)
    -- Turnover = COGS / Average Inventory Value
    SELECT AVG(quantity_available * unit_cost) INTO avg_inventory_value
    FROM inventory_items
    WHERE (warehouse_id IS NULL OR warehouse_id = get_inventory_metrics.warehouse_id);

    -- Get cost of goods sold (approximation using recent movements)
    SELECT SUM(quantity * ii.unit_cost)
    INTO cogs
    FROM inventory_movements im
    JOIN inventory_items ii ON im.inventory_item_id = ii.id
    WHERE im.movement_type = 'outbound'
    AND im.created_at >= NOW() - INTERVAL '365 days'
    AND (warehouse_id IS NULL OR ii.warehouse_id = get_inventory_metrics.warehouse_id);

    turnover_rate := CASE 
        WHEN avg_inventory_value > 0 THEN cogs / avg_inventory_value
        ELSE 0
    END;

    -- Get top selling products
    WITH product_sales AS (
        SELECT 
            p.id,
            p.name,
            p.sku,
            SUM(im.quantity) as total_sold,
            SUM(im.quantity * ii.unit_cost) as revenue
        FROM inventory_movements im
        JOIN inventory_items ii ON im.inventory_item_id = ii.id
        JOIN products p ON ii.product_id = p.id
        WHERE im.movement_type = 'outbound'
        AND im.created_at >= NOW() - INTERVAL '30 days'
        AND (warehouse_id IS NULL OR ii.warehouse_id = get_inventory_metrics.warehouse_id)
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_sold DESC
        LIMIT 10
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'product_id', id,
            'name', name,
            'sku', sku,
            'quantity_sold', total_sold,
            'revenue', revenue
        )
    ) INTO top_selling_products
    FROM product_sales;

    -- Return results
    RETURN QUERY SELECT 
        COALESCE(get_inventory_metrics.total_items, 0),
        COALESCE(get_inventory_metrics.total_value, 0),
        COALESCE(get_inventory_metrics.low_stock_items, 0),
        COALESCE(get_inventory_metrics.out_of_stock_items, 0),
        COALESCE(get_inventory_metrics.turnover_rate, 0),
        COALESCE(get_inventory_metrics.top_selling_products, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEARCH ANALYTICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_search_analytics(
    date_from text,
    date_to text
)
RETURNS TABLE (
    total_searches bigint,
    unique_searches bigint,
    top_queries jsonb,
    conversion_rate numeric,
    zero_result_rate numeric
) AS $$
DECLARE
    searches_with_results bigint;
    searches_with_clicks bigint;
BEGIN
    -- Get total searches
    SELECT COUNT(*)
    INTO total_searches
    FROM search_history
    WHERE created_at >= date_from::timestamp
    AND created_at <= date_to::timestamp;

    -- Get unique searches
    SELECT COUNT(DISTINCT query)
    INTO unique_searches
    FROM search_history
    WHERE created_at >= date_from::timestamp
    AND created_at <= date_to::timestamp;

    -- Get searches with results
    SELECT COUNT(*)
    INTO searches_with_results
    FROM search_history
    WHERE created_at >= date_from::timestamp
    AND created_at <= date_to::timestamp
    AND results_count > 0;

    -- Get searches with clicks (conversions)
    SELECT COUNT(*)
    INTO searches_with_clicks
    FROM search_history
    WHERE created_at >= date_from::timestamp
    AND created_at <= date_to::timestamp
    AND clicked_product_id IS NOT NULL;

    -- Calculate conversion rate
    conversion_rate := CASE 
        WHEN total_searches > 0 THEN (searches_with_clicks::numeric / total_searches::numeric) * 100
        ELSE 0
    END;

    -- Calculate zero result rate
    zero_result_rate := CASE 
        WHEN total_searches > 0 THEN ((total_searches - searches_with_results)::numeric / total_searches::numeric) * 100
        ELSE 0
    END;

    -- Get top queries
    WITH query_stats AS (
        SELECT 
            query,
            COUNT(*) as search_count,
            AVG(results_count) as avg_results,
            COUNT(*) FILTER (WHERE clicked_product_id IS NOT NULL) as clicks
        FROM search_history
        WHERE created_at >= date_from::timestamp
        AND created_at <= date_to::timestamp
        GROUP BY query
        ORDER BY search_count DESC
        LIMIT 20
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'query', query,
            'count', search_count,
            'avg_results', avg_results,
            'clicks', clicks,
            'click_rate', CASE 
                WHEN search_count > 0 THEN (clicks::numeric / search_count::numeric) * 100
                ELSE 0
            END
        )
    ) INTO top_queries
    FROM query_stats;

    -- Return results
    RETURN QUERY SELECT 
        COALESCE(get_search_analytics.total_searches, 0),
        COALESCE(get_search_analytics.unique_searches, 0),
        COALESCE(get_search_analytics.top_queries, '[]'::jsonb),
        COALESCE(get_search_analytics.conversion_rate, 0),
        COALESCE(get_search_analytics.zero_result_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STOCK ALERTS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_stock_alerts(
    warehouse_id text DEFAULT NULL
)
RETURNS TABLE (
    alert_id text,
    alert_type text,
    severity text,
    product_name text,
    current_stock integer,
    threshold integer
) AS $$
BEGIN
    RETURN QUERY
    WITH current_alerts AS (
        SELECT 
            sa.id::text as alert_id,
            sa.alert_type::text,
            sa.severity::text,
            p.name as product_name,
            ii.quantity_available as current_stock,
            COALESCE(sa.threshold_value, ii.reorder_point) as threshold
        FROM stock_alerts sa
        JOIN inventory_items ii ON sa.inventory_item_id = ii.id
        JOIN products p ON ii.product_id = p.id
        WHERE sa.is_resolved = false
        AND (warehouse_id IS NULL OR ii.warehouse_id = check_stock_alerts.warehouse_id)
        ORDER BY 
            CASE sa.severity
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
            END,
            sa.created_at DESC
    )
    SELECT * FROM current_alerts;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COUPON APPLICATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION apply_coupon(
    coupon_code text,
    user_id text,
    cart_total numeric,
    cart_items jsonb
)
RETURNS TABLE (
    valid boolean,
    discount_amount numeric,
    error_message text,
    coupon_id text
) AS $$
DECLARE
    coupon_record record;
    eligible_amount numeric := 0;
    calculated_discount numeric := 0;
    user_usage_count integer := 0;
BEGIN
    -- Get coupon details
    SELECT * INTO coupon_record
    FROM coupons c
    WHERE LOWER(c.code) = LOWER(coupon_code)
    AND c.is_active = true
    AND c.valid_from <= NOW()
    AND c.valid_to >= NOW();

    -- Check if coupon exists and is valid
    IF coupon_record IS NULL THEN
        RETURN QUERY SELECT false, 0::numeric, 'Invalid or expired coupon code', null::text;
        RETURN;
    END IF;

    -- Check usage limits
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.usage_count >= coupon_record.usage_limit THEN
        RETURN QUERY SELECT false, 0::numeric, 'Coupon usage limit exceeded', null::text;
        RETURN;
    END IF;

    -- Check user usage limit
    IF coupon_record.user_usage_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO user_usage_count
        FROM coupon_usage cu
        WHERE cu.coupon_id = coupon_record.id
        AND cu.user_id = apply_coupon.user_id::uuid;

        IF user_usage_count >= coupon_record.user_usage_limit THEN
            RETURN QUERY SELECT false, 0::numeric, 'You have reached the usage limit for this coupon', null::text;
            RETURN;
        END IF;
    END IF;

    -- Check minimum order amount
    IF coupon_record.minimum_order_amount IS NOT NULL AND cart_total < coupon_record.minimum_order_amount THEN
        RETURN QUERY SELECT false, 0::numeric, 
            'Minimum order amount of $' || coupon_record.minimum_order_amount || ' required', 
            null::text;
        RETURN;
    END IF;

    -- Calculate eligible amount based on restrictions
    IF coupon_record.categories IS NOT NULL AND array_length(coupon_record.categories, 1) > 0 THEN
        -- Category-specific coupon
        SELECT SUM((item->>'price')::numeric * (item->>'quantity')::integer)
        INTO eligible_amount
        FROM jsonb_array_elements(cart_items) AS item
        WHERE (item->>'category') = ANY(coupon_record.categories);
    ELSIF coupon_record.products IS NOT NULL AND array_length(coupon_record.products, 1) > 0 THEN
        -- Product-specific coupon
        SELECT SUM((item->>'price')::numeric * (item->>'quantity')::integer)
        INTO eligible_amount
        FROM jsonb_array_elements(cart_items) AS item
        WHERE (item->>'id') = ANY(coupon_record.products);
    ELSE
        -- Apply to entire cart
        eligible_amount := cart_total;
    END IF;

    -- If no eligible items found
    IF eligible_amount = 0 THEN
        RETURN QUERY SELECT false, 0::numeric, 'Coupon not applicable to current cart items', null::text;
        RETURN;
    END IF;

    -- Calculate discount based on coupon type
    CASE coupon_record.type
        WHEN 'percentage' THEN
            calculated_discount := eligible_amount * (coupon_record.value / 100.0);
            IF coupon_record.maximum_discount_amount IS NOT NULL THEN
                calculated_discount := LEAST(calculated_discount, coupon_record.maximum_discount_amount);
            END IF;
        WHEN 'fixed' THEN
            calculated_discount := LEAST(coupon_record.value, eligible_amount);
        WHEN 'free_shipping' THEN
            calculated_discount := 0; -- Shipping discount handled separately
        ELSE
            calculated_discount := 0;
    END CASE;

    -- Return success result
    RETURN QUERY SELECT true, calculated_discount, null::text, coupon_record.id::text;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERSONALIZED RECOMMENDATIONS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_personalized_recommendations(
    user_id text,
    limit_count integer DEFAULT 10,
    category text DEFAULT NULL
)
RETURNS TABLE (
    product_id text,
    score numeric,
    reason text
) AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        -- Get user's interaction history
        SELECT 
            p.category_id,
            p.brand,
            COUNT(*) as interaction_count,
            AVG(CASE ui.interaction_type 
                WHEN 'purchase' THEN 5
                WHEN 'cart' THEN 3
                WHEN 'view' THEN 1
                ELSE 0
            END) as preference_score
        FROM user_interactions ui
        JOIN products p ON ui.product_id = p.id
        WHERE ui.user_id = get_personalized_recommendations.user_id::uuid
        GROUP BY p.category_id, p.brand
    ),
    scored_products AS (
        SELECT 
            p.id::text as product_id,
            COALESCE(
                (up.preference_score * 0.4) + 
                (CASE WHEN p.featured THEN 20 ELSE 0 END) +
                (CASE WHEN p.inventory_quantity > 0 THEN 10 ELSE -50 END) +
                (RANDOM() * 10), -- Add some randomness
                RANDOM() * 50
            ) as score,
            CASE 
                WHEN up.preference_score IS NOT NULL THEN 'Based on your purchase history'
                WHEN p.featured THEN 'Featured product'
                ELSE 'Popular choice'
            END as reason
        FROM products p
        LEFT JOIN user_preferences up ON (p.category_id = up.category_id OR p.brand = up.brand)
        WHERE p.status = 'active'
        AND p.inventory_quantity > 0
        AND (category IS NULL OR p.category_id = category::uuid)
        AND NOT EXISTS (
            -- Exclude products user already purchased recently
            SELECT 1 FROM user_interactions ui 
            WHERE ui.user_id = get_personalized_recommendations.user_id::uuid 
            AND ui.product_id = p.id 
            AND ui.interaction_type = 'purchase'
            AND ui.created_at > NOW() - INTERVAL '30 days'
        )
        ORDER BY score DESC
        LIMIT limit_count
    )
    SELECT * FROM scored_products;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Function to update stock alerts when inventory changes
CREATE OR REPLACE FUNCTION update_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Clear existing alerts for this item
    DELETE FROM stock_alerts 
    WHERE inventory_item_id = NEW.id 
    AND alert_type IN ('low_stock', 'out_of_stock');

    -- Create new alerts based on current stock
    IF NEW.quantity_available = 0 THEN
        INSERT INTO stock_alerts (inventory_item_id, alert_type, current_value, severity)
        VALUES (NEW.id, 'out_of_stock', NEW.quantity_available, 'critical');
    ELSIF NEW.quantity_available <= NEW.reorder_point THEN
        INSERT INTO stock_alerts (inventory_item_id, alert_type, threshold_value, current_value, severity)
        VALUES (NEW.id, 'low_stock', NEW.reorder_point, NEW.quantity_available, 
               CASE WHEN NEW.quantity_available <= NEW.reorder_point * 0.5 THEN 'high' ELSE 'medium' END);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock alerts
DROP TRIGGER IF EXISTS trigger_update_stock_alerts ON inventory_items;
CREATE TRIGGER trigger_update_stock_alerts
    AFTER UPDATE OF quantity_available ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_alerts();

-- Function to update product analytics on interactions
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO product_analytics (product_id, date, views, clicks, cart_adds, purchases)
    VALUES (NEW.product_id, CURRENT_DATE, 
           CASE WHEN NEW.interaction_type = 'view' THEN 1 ELSE 0 END,
           CASE WHEN NEW.interaction_type = 'click' THEN 1 ELSE 0 END,
           CASE WHEN NEW.interaction_type = 'cart' THEN 1 ELSE 0 END,
           CASE WHEN NEW.interaction_type = 'purchase' THEN 1 ELSE 0 END)
    ON CONFLICT (product_id, date)
    DO UPDATE SET
        views = product_analytics.views + CASE WHEN NEW.interaction_type = 'view' THEN 1 ELSE 0 END,
        clicks = product_analytics.clicks + CASE WHEN NEW.interaction_type = 'click' THEN 1 ELSE 0 END,
        cart_adds = product_analytics.cart_adds + CASE WHEN NEW.interaction_type = 'cart' THEN 1 ELSE 0 END,
        purchases = product_analytics.purchases + CASE WHEN NEW.interaction_type = 'purchase' THEN 1 ELSE 0 END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product analytics
DROP TRIGGER IF EXISTS trigger_update_product_analytics ON user_interactions;
CREATE TRIGGER trigger_update_product_analytics
    AFTER INSERT ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_product_analytics();