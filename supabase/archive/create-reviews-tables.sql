-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for product_reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
CREATE POLICY "Users can update their own reviews" ON public.product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON public.product_reviews(user_id);

-- Insert sample user profiles (using mock UUIDs)
INSERT INTO public.user_profiles (id, email, full_name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'customer1@example.com', 'Verified Buyer'),
  ('00000000-0000-0000-0000-000000000002', 'customer2@example.com', 'Happy Customer')
ON CONFLICT (id) DO NOTHING;

-- Insert sample reviews (you'll need to replace product IDs with actual ones)
-- Note: These will need actual product IDs from your products table
INSERT INTO public.product_reviews (product_id, user_id, rating, title, content, verified_purchase) 
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000001',
  4,
  'Great product!',
  'Really happy with this purchase. Quality is excellent.',
  true
FROM public.products p
WHERE p.status = 'active'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.product_reviews (product_id, user_id, rating, title, content, verified_purchase) 
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000002',
  5,
  'Excellent quality',
  'Exceeded my expectations. Would definitely recommend.',
  true
FROM public.products p
WHERE p.status = 'active'
OFFSET 1
LIMIT 1
ON CONFLICT DO NOTHING;