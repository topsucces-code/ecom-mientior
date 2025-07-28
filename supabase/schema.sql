-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'agent', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE business_type AS ENUM ('individual', 'business', 'corporation');
CREATE TYPE chat_status AS ENUM ('open', 'assigned', 'resolved', 'closed');
CREATE TYPE chat_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE chat_category AS ENUM ('general', 'order_support', 'technical', 'billing', 'product_inquiry');
CREATE TYPE agent_status AS ENUM ('online', 'away', 'busy', 'offline');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
CREATE TYPE sender_type AS ENUM ('customer', 'agent', 'bot');
CREATE TYPE commission_type AS ENUM ('percentage', 'fixed', 'tiered');
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid', 'disputed');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role user_role DEFAULT 'customer',
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    address JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table
CREATE TABLE vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type business_type DEFAULT 'individual',
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    contact_info JSONB DEFAULT '{}',
    business_address JSONB,
    verification_status verification_status DEFAULT 'pending',
    status vendor_status DEFAULT 'pending',
    commission_rate DECIMAL(5,4) DEFAULT 0.1500,
    total_sales DECIMAL(12,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    sku TEXT UNIQUE NOT NULL,
    images JSONB DEFAULT '[]',
    specifications JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('active', 'inactive', 'out_of_stock')) DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT,
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    tracking_number TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB NOT NULL, -- Store product details at time of order
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product reviews table
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    images JSONB DEFAULT '[]',
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('published', 'pending', 'hidden')) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, customer_id) -- One review per customer per product
);

-- Cart table for persistent shopping carts
CREATE TABLE cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- Wishlist table
CREATE TABLE wishlist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- Inventory tracking
CREATE TABLE inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    unit_cost DECIMAL(10,2),
    location TEXT,
    last_restocked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, vendor_id)
);

-- Inventory movements for tracking stock changes
CREATE TABLE inventory_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type TEXT CHECK (movement_type IN ('in', 'out', 'adjustment', 'reserved', 'released')) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type TEXT, -- 'order', 'purchase', 'adjustment', etc.
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Purchase orders for inventory management
CREATE TABLE purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')) DEFAULT 'draft',
    total_amount DECIMAL(10,2),
    supplier_info JSONB,
    expected_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Purchase order items
CREATE TABLE purchase_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission tracking
CREATE TABLE commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    commission_type commission_type DEFAULT 'percentage',
    status commission_status DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat system tables
CREATE TABLE chat_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT,
    status agent_status DEFAULT 'offline',
    is_active BOOLEAN DEFAULT TRUE,
    specialties TEXT[] DEFAULT '{"general"}',
    max_concurrent_chats INTEGER DEFAULT 5,
    current_chat_count INTEGER DEFAULT 0,
    average_response_time DECIMAL(8,2) DEFAULT 0,
    customer_rating DECIMAL(3,2) DEFAULT 5.0,
    total_chats_handled INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES chat_agents(id) ON DELETE SET NULL,
    status chat_status DEFAULT 'open',
    priority chat_priority DEFAULT 'medium',
    category chat_category NOT NULL,
    subject TEXT,
    tags TEXT[] DEFAULT '{}',
    customer_info JSONB NOT NULL,
    agent_info JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender_type sender_type NOT NULL,
    message TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    read_by TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat templates for quick responses
CREATE TABLE chat_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category chat_category NOT NULL,
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto responses for chat
CREATE TABLE chat_auto_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trigger_keywords TEXT[] NOT NULL,
    response_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    category chat_category NOT NULL,
    priority INTEGER DEFAULT 1,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat feedback
CREATE TABLE chat_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES chat_agents(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table for product organization
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions for recommendations
CREATE TABLE user_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    interaction_type TEXT CHECK (interaction_type IN ('view', 'cart', 'purchase', 'wishlist', 'click', 'impression', 'search', 'filter')),
    interaction_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);

-- RLS Policies for vendors
CREATE POLICY "Anyone can view active vendors" ON vendors FOR SELECT USING (status = 'active');
CREATE POLICY "Vendors can manage own data" ON vendors FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all vendors" ON vendors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Vendors can manage own products" ON products FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all products" ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for orders
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Vendors can view orders with their products" ON orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items oi 
        JOIN vendors v ON oi.vendor_id = v.id 
        WHERE oi.order_id = orders.id AND v.user_id = auth.uid()
    )
);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for cart
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (customer_id = auth.uid());

-- RLS Policies for wishlist
CREATE POLICY "Users can manage own wishlist" ON wishlist_items FOR ALL USING (customer_id = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Anyone can view published reviews" ON reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (customer_id = auth.uid());

-- RLS Policies for chat
CREATE POLICY "Agents can view all conversations" ON chat_conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);
CREATE POLICY "Customers can view own conversations" ON chat_conversations FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers can create conversations" ON chat_conversations FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Agents can view all messages" ON chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);
CREATE POLICY "Customers can view own conversation messages" ON chat_messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE customer_id = auth.uid())
);
CREATE POLICY "Users can create messages in their conversations" ON chat_messages FOR INSERT WITH CHECK (
    conversation_id IN (
        SELECT id FROM chat_conversations 
        WHERE customer_id = auth.uid() OR agent_id IN (
            SELECT id FROM chat_agents WHERE user_id = auth.uid()
        )
    )
);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_agents_updated_at BEFORE UPDATE ON chat_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_templates_updated_at BEFORE UPDATE ON chat_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_auto_responses_updated_at BEFORE UPDATE ON chat_auto_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create user profile when new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX idx_wishlist_items_customer_id ON wishlist_items(customer_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_commissions_vendor_id ON commissions(vendor_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_chat_conversations_customer_id ON chat_conversations(customer_id);
CREATE INDEX idx_chat_conversations_agent_id ON chat_conversations(agent_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_agents_user_id ON chat_agents(user_id);
CREATE INDEX idx_chat_agents_status ON chat_agents(status);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_product_id ON user_interactions(product_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);

-- Insert some initial data
INSERT INTO categories (name, description, slug) VALUES
('Electronics', 'Electronic devices and gadgets', 'electronics'),
('Clothing', 'Fashion and apparel', 'clothing'),
('Home & Garden', 'Home improvement and gardening', 'home-garden'),
('Books', 'Books and literature', 'books'),
('Sports', 'Sports and outdoor equipment', 'sports'),
('Health & Beauty', 'Health and beauty products', 'health-beauty');

INSERT INTO chat_templates (title, content, category, tags, is_public) VALUES
('Welcome Greeting', 'Hello! Welcome to our support. How can I help you today?', 'general', '{"greeting", "welcome"}', true),
('Order Status', 'I can help you track your order. Please provide your order number and I''ll check the status for you.', 'order_support', '{"order", "tracking", "status"}', true),
('Technical Support', 'I understand you''re experiencing technical difficulties. Let me help you resolve this step by step.', 'technical', '{"technical", "troubleshooting"}', true),
('Billing Question', 'I''ll be happy to help you with your billing question. Let me look into your account details.', 'billing', '{"billing", "payment", "invoice"}', true),
('Product Information', 'I can provide you with detailed information about our products. What specific product are you interested in?', 'product_inquiry', '{"product", "information", "details"}', true);

INSERT INTO chat_auto_responses (trigger_keywords, response_message, category, priority) VALUES
('{"hello", "hi", "hey"}', 'Hello! Welcome to our support. How can I help you today?', 'general', 1),
('{"order", "tracking", "shipment"}', 'I can help you track your order. Please provide your order number.', 'order_support', 2),
('{"problem", "issue", "error", "bug"}', 'I''m sorry to hear you''re experiencing an issue. Let me help you resolve this.', 'technical', 3),
('{"refund", "return", "exchange"}', 'I can help you with returns and refunds. Let me check your order details.', 'order_support', 2),
('{"payment", "billing", "charge"}', 'I''ll help you with your billing question. Let me review your account.', 'billing', 2);