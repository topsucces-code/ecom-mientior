-- Insert Categories
INSERT INTO public.categories (id, name, description, slug, image_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and gadgets', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Clothing', 'Fashion and clothing items', 'clothing', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Books', 'Books and literature', 'books', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400');

-- Insert Products
INSERT INTO public.products (id, name, description, price, compare_at_price, sku, inventory_quantity, category_id, brand, weight, dimensions, images, tags, status, featured) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010', 
    'Wireless Headphones', 
    'High-quality wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.',
    299.99, 
    399.99, 
    
    'WH-001', 
    50, 
    '550e8400-e29b-41d4-a716-446655440001', 
    'TechBrand', 
    0.5, 
    '20x15x8 cm',
    '{"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400"}',
    '{"wireless", "bluetooth", "noise-canceling", "premium"}',
    'active',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011', 
    'Smartphone Pro', 
    'Latest smartphone with advanced camera system, long battery life, and lightning-fast performance.',
    899.99, 
    null, 
    'SP-002', 
    25, 
    '550e8400-e29b-41d4-a716-446655440001', 
    'PhoneBrand', 
    0.2, 
    '15x7x1 cm',
    '{"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400"}',
    '{"smartphone", "5G", "camera", "android"}',
    'active',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440012', 
    'Premium Cotton T-Shirt', 
    'Comfortable 100% organic cotton t-shirt available in multiple colors. Soft, breathable, and ethically made.',
    24.99, 
    34.99, 
    'TS-003', 
    100, 
    '550e8400-e29b-41d4-a716-446655440002', 
    'FashionBrand', 
    0.2, 
    'Size M',
    '{"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", "https://images.unsplash.com/photo-1583743814966-8936f37f4966?w=400"}',
    '{"cotton", "casual", "comfortable", "organic"}',
    'active',
    false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440013', 
    'Modern Web Development Guide', 
    'Complete guide to modern web development covering React, Next.js, TypeScript, and best practices.',
    49.99, 
    null, 
    'BK-004', 
    75, 
    '550e8400-e29b-41d4-a716-446655440003', 
    'TechBooks Publishing', 
    0.8, 
    '23x15x3 cm',
    '{"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"}',
    '{"programming", "web development", "javascript", "react"}',
    'active',
    false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440014', 
    'Gaming Laptop Pro', 
    'High-performance gaming laptop with RTX graphics, fast SSD, and advanced cooling system.',
    1299.99, 
    1499.99, 
    'LP-005', 
    15, 
    '550e8400-e29b-41d4-a716-446655440001', 
    'CompBrand', 
    2.1, 
    '35x25x2 cm',
    '{"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"}',
    '{"laptop", "gaming", "RTX", "performance"}',
    'active',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440015', 
    'Classic Blue Jeans', 
    'Timeless blue jeans with modern fit and premium denim. Durable and stylish for everyday wear.',
    79.99, 
    null, 
    'JN-006', 
    60, 
    '550e8400-e29b-41d4-a716-446655440002', 
    'DenimCo', 
    0.6, 
    '32W x 34L',
    '{"https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=400"}',
    '{"jeans", "denim", "casual", "classic"}',
    'active',
    false
  );

-- Update timestamps to have some variation
UPDATE public.categories SET created_at = created_at - INTERVAL '30 days' WHERE slug = 'electronics';
UPDATE public.categories SET created_at = created_at - INTERVAL '25 days' WHERE slug = 'clothing';
UPDATE public.categories SET created_at = created_at - INTERVAL '20 days' WHERE slug = 'books';