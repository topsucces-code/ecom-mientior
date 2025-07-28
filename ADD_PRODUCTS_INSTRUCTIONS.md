# 🛍️ Adding More Products to Your E-commerce Database

## Overview
Your SQL script `add-more-products.sql` contains comprehensive product data that will add 20+ new products across different categories. Here are your options to execute it:

## 🎯 Option 1: Direct SQL Execution (Recommended)

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://fhewhxjprkksjriohxpv.supabase.co
   - Login to your Supabase account

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" to create a new SQL query

3. **Copy the SQL Script**
   - Open the file: `C:\Users\Elisee\Documents\Ecom mientior\supabase\add-more-products.sql`
   - Copy the entire content (Ctrl+A, Ctrl+C)

4. **Execute the Script**
   - Paste the content into the SQL Editor
   - Click "Run" to execute the script
   - Wait for completion confirmation

5. **Verify Results**
   - You should see success messages
   - Check the Tables tab to see your new products

## 🔧 Option 2: Using Service Role Key (Alternative)

If you have your Supabase Service Role Key:

1. **Add Service Role Key to .env.local**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   
   > Find this key in: Supabase Dashboard > Settings > API > Service Role Key

2. **Run the Admin Script**
   ```bash
   cd "C:\Users\Elisee\Documents\Ecom mientior"
   node scripts/add-products-admin.js
   ```

## 📊 What Will Be Added

### Electronics (7 products)
- **iPad Air 5e génération** - €699.99 (Featured)
- **Clavier Mécanique RGB** - €159.99
- **Écran 4K 27 pouces** - €449.99
- **Webcam HD 1080p** - €89.99 (Featured)
- **Chargeur Sans Fil Rapide** - €39.99
- **Montre Connectée Sport** - €199.99
- **Enceinte Bluetooth Portable** - €79.99 (Featured)

### Clothing & Accessories (6 products)
- **Hoodie Unisexe Premium** - €79.99
- **Baskets Running Femme** - €129.99 (Featured)
- **Veste en Cuir Homme** - €299.99
- **Robe d'été Fleurie** - €59.99
- **Sac à Dos Urbain** - €59.99
- **Lunettes de Soleil Aviateur** - €119.99 (Featured)

### Home & Garden (5 products)
- **Lampe de Bureau LED** - €89.99 (Featured)
- **Coussin Décoratif Set** - €49.99
- **Plante Artificielle Monstera** - €79.99
- **Tapis Berbère Moderne** - €159.99
- **Kit Café Barista** - €89.99

### Books (2 products)
- **Guide Photographie Numérique** - €39.99
- **Roman Fantasy Épique** - €29.99

### Additional Features
- **Product Images**: Adds sample images to existing products
- **Proper Categorization**: Links products to correct categories
- **Inventory Management**: Sets realistic stock levels
- **Featured Products**: Marks key products for homepage display
- **Brand Information**: Includes brand names and tags
- **Compare Prices**: Some products have discount pricing

## ✅ After Execution

Your e-commerce platform will have:

1. **Rich Product Catalog**: 26+ total products (6 existing + 20 new)
2. **Diverse Categories**: Well-stocked electronics, clothing, home, and books
3. **Homepage Content**: Featured products for attractive homepage
4. **Search & Filtering**: Products with proper tags and categories
5. **E-commerce Ready**: Pricing, inventory, and product details

## 🚀 Next Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Visit Your Platform**
   - Homepage: http://localhost:3010
   - Products: http://localhost:3010/products
   - Categories: Click category filters

3. **Test Features**
   - Browse products by category
   - Search functionality
   - Add to cart
   - Product detail pages

## 🔍 Verification

To verify the products were added successfully:

1. **Check Database**
   - Go to Supabase Dashboard > Table Editor
   - View the `products` table
   - Should show 26+ total products

2. **Test Website**
   - Homepage should show featured products
   - Product grid should have diverse items
   - Categories should have multiple products

## 🆘 Troubleshooting

### If SQL execution fails:
- Ensure you're logged into the correct Supabase project
- Check for any error messages in the SQL Editor
- Verify your database has the required tables and categories

### If products don't appear:
- Clear browser cache and refresh
- Check the products API: http://localhost:3010/api/products
- Verify category IDs match in the database

### For RLS errors with the script:
- Use Option 1 (Direct SQL) instead of Option 2
- The SQL script is designed to run with admin privileges

## 📁 File Locations

- **SQL Script**: `C:\Users\Elisee\Documents\Ecom mientior\supabase\add-more-products.sql`
- **Admin Script**: `C:\Users\Elisee\Documents\Ecom mientior\scripts\add-products-admin.js`
- **Environment**: `C:\Users\Elisee\Documents\Ecom mientior\.env.local`

---

**Recommendation**: Use Option 1 (Direct SQL Execution) as it's the most reliable method and matches how the original script was designed to be executed.