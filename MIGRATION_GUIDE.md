
# Guide de Migration Supabase - E-commerce Platform

## Statut Actuel
- Tables existantes: 11/16
- Progression: 69%

## Tables Manquantes
- profiles
- vendors
- order_items
- inventory
- commissions

## Colonnes Manquantes
- products: id, vendor_id, name, description, price, category, subcategory, sku, images, specifications, tags, status, featured, rating, review_count, created_at, updated_at
- orders: id, customer_id, status, total_amount, tax_amount, shipping_amount, discount_amount, payment_status, payment_method, shipping_address, billing_address, tracking_number, notes, metadata, created_at, updated_at

## Instructions de Migration

### 1. Ouvrir Supabase Dashboard
1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Aller dans "SQL Editor"

### 2. Exécuter le Script de Migration
1. Copier le contenu de `supabase/migration-complete-schema.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur "Run"

### 3. Exécuter les Fonctions Avancées
1. Copier le contenu de `supabase/database-functions.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur "Run"

### 4. Vérifier la Migration
Exécuter le script de test:
```bash
node scripts/test-supabase-integration.js
```

### 5. Configurer les Variables d'Environnement
Vérifier que vos fichiers .env.local contiennent:
```
NEXT_PUBLIC_SUPABASE_URL=https://fhewhxjprkksjriohxpv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G
```

## Prochaines Étapes Après Migration
1. Tester l'authentification
2. Tester la création de produits
3. Tester le panier et les commandes
4. Configurer les paiements (Stripe/PayPal)
5. Optimiser les performances

---
Généré automatiquement le 28/07/2025
