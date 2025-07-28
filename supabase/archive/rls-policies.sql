-- Row Level Security (RLS) Policies for E-commerce Platform
-- This file contains all the security policies to ensure data access control

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- New tables RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (status = 'active');

-- Only authenticated users can create/update products (admin check would be added)
CREATE POLICY "Authenticated users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

-- Anyone can view categories
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

-- Only authenticated users can manage categories
CREATE POLICY "Authenticated users can manage categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ORDERS POLICIES
-- =====================================================

-- Users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- CART ITEMS POLICIES
-- =====================================================

-- Users can only manage their own cart items
CREATE POLICY "Users can manage own cart items" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

-- Users can manage their own reviews
CREATE POLICY "Users can manage own reviews" ON reviews
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- USER INTERACTIONS POLICIES
-- =====================================================

-- Users can only see their own interactions
CREATE POLICY "Users can manage own interactions" ON user_interactions
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- COUPONS POLICIES
-- =====================================================

-- Anyone can view active coupons (for validation)
CREATE POLICY "Anyone can view active coupons" ON coupons
    FOR SELECT USING (is_active = true);

-- Only authenticated users can manage coupons (admin feature)
CREATE POLICY "Authenticated users can manage coupons" ON coupons
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- COUPON USAGE POLICIES
-- =====================================================

-- Users can view their own coupon usage
CREATE POLICY "Users can view own coupon usage" ON coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create coupon usage records
CREATE POLICY "Users can create own coupon usage" ON coupon_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own payment records
CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payments (for status updates)
CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PAYMENT METHODS POLICIES
-- =====================================================

-- Users can manage their own payment methods
CREATE POLICY "Users can manage own payment methods" ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- NOTIFICATION SETTINGS POLICIES
-- =====================================================

-- Users can manage their own notification settings
CREATE POLICY "Users can manage own notification settings" ON notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SEARCH HISTORY POLICIES
-- =====================================================

-- Users can view their own search history
CREATE POLICY "Users can view own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

-- Anyone can create search history (for anonymous users too)
CREATE POLICY "Anyone can create search history" ON search_history
    FOR INSERT WITH CHECK (true);

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history" ON search_history
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PRODUCT ANALYTICS POLICIES
-- =====================================================

-- Only authenticated users can view analytics
CREATE POLICY "Authenticated users can view analytics" ON product_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

-- System can update analytics
CREATE POLICY "System can manage analytics" ON product_analytics
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- WISHLIST POLICIES
-- =====================================================

-- Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist" ON wishlist_items
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- PRODUCT COMPARISONS POLICIES
-- =====================================================

-- Users can manage their own comparisons
CREATE POLICY "Users can manage own comparisons" ON product_comparisons
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- CHAT SYSTEM POLICIES
-- =====================================================

-- Chat agents can view their own data
CREATE POLICY "Agents can view own data" ON chat_agents
    FOR SELECT USING (auth.uid() = user_id);

-- Agents can update their own data
CREATE POLICY "Agents can update own data" ON chat_agents
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can view conversations they're part of
CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() = agent_id
    );

-- Users can create conversations as customers
CREATE POLICY "Users can create conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Users and agents can update conversations they're part of
CREATE POLICY "Participants can update conversations" ON chat_conversations
    FOR UPDATE USING (
        auth.uid() = customer_id OR 
        auth.uid() = agent_id
    );

-- Users can view messages in their conversations
CREATE POLICY "Users can view conversation messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id 
            AND (customer_id = auth.uid() OR agent_id = auth.uid())
        )
    );

-- Users can create messages in their conversations
CREATE POLICY "Users can create messages" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id 
            AND (customer_id = auth.uid() OR agent_id = auth.uid())
        ) AND auth.uid() = sender_id
    );

-- =====================================================
-- VENDOR PAYOUTS POLICIES
-- =====================================================

-- Vendors can view their own payouts
CREATE POLICY "Vendors can view own payouts" ON vendor_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = vendor_id
        )
    );

-- =====================================================
-- USER SESSIONS POLICIES
-- =====================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Anyone can create sessions (for tracking)
CREATE POLICY "Anyone can create sessions" ON user_sessions
    FOR INSERT WITH CHECK (true);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INVENTORY MANAGEMENT POLICIES
-- =====================================================

-- Only authenticated users can view inventory (admin/staff feature)
CREATE POLICY "Authenticated users can view inventory" ON inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage inventory" ON inventory_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view movements" ON inventory_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create movements" ON inventory_movements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view alerts" ON stock_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage alerts" ON stock_alerts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage purchase orders" ON purchase_orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage adjustments" ON inventory_adjustments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view warehouses" ON warehouses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage warehouses" ON warehouses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage suppliers" ON suppliers
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS FOR ROLE-BASED ACCESS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id 
        AND (metadata->>'role' = 'admin' OR metadata->>'role' = 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is vendor
CREATE OR REPLACE FUNCTION is_vendor(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id 
        AND (metadata->>'role' = 'vendor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is customer service agent
CREATE OR REPLACE FUNCTION is_agent(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM chat_agents 
        WHERE user_id = user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;