# 🛠️ Guide de Maintenance - Supabase E-Commerce

## 📋 État Actuel (Dernier Audit)

### ✅ **Tables Opérationnelles**
- **products** : 7 enregistrements actifs
- **categories** : 6 catégories configurées  
- **user_profiles** : Structure prête (0 utilisateurs)
- **product_reviews** : Structure prête (0 avis)
- **wishlists** : Structure prête (0 favoris)
- **product_analytics** : Structure prête (0 métriques)
- **promotions** : Structure prête (0 codes promo)

### 🎯 **Performance**
- ✅ Toutes les requêtes < 100ms
- ✅ Index optimisés sur toutes les tables
- ✅ RLS activé et configuré
- ✅ Contraintes de validation en place

## 🔧 Tâches de Maintenance Recommandées

### **Hebdomadaire**
```bash
# Vérifier l'état des tables
cd apps/web && node ../../scripts/supabase-audit.js

# Contrôles à effectuer:
- Nombre de nouveaux utilisateurs
- Produits ajoutés/modifiés  
- Avis clients soumis
- Performance des requêtes
```

### **Mensuel**
- 📊 **Analytics** : Vérifier les métriques de produits
- 🧹 **Nettoyage** : Supprimer les sessions expirées
- 📈 **Performance** : Analyser les requêtes lentes
- 🔐 **Sécurité** : Vérifier les logs d'accès

### **Trimestriel**
- 🗄️ **Sauvegarde** : Export complet de la base
- 🔄 **Migration** : Appliquer les nouvelles fonctionnalités
- 📋 **Audit** : Révision complète de la sécurité
- 🎯 **Optimisation** : Révision des index et performances

## 📊 Scripts de Monitoring

### **Vérification Rapide**
```sql
-- Compter les enregistrements par table
SELECT 
  'products' as table_name, 
  COUNT(*) as count 
FROM products WHERE status = 'active'
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL  
SELECT 'reviews', COUNT(*) FROM product_reviews
UNION ALL
SELECT 'wishlists', COUNT(*) FROM wishlists;
```

### **Audit de Performance**
```sql
-- Vérifier les produits les plus vus
SELECT 
  p.name,
  COALESCE(SUM(pa.views_count), 0) as total_views
FROM products p
LEFT JOIN product_analytics pa ON p.id = pa.product_id
GROUP BY p.id, p.name
ORDER BY total_views DESC
LIMIT 10;
```

## 🚨 Alertes et Résolution

### **Problèmes Courants**

#### **1. Erreur "Table doesn't exist"**
```bash
# Solution: Exécuter le script de migration
# Fichier: supabase/migration-complete.sql
# Action: Copier dans Supabase Dashboard → SQL Editor
```

#### **2. Erreur de permissions RLS**
```sql
-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### **3. Performance lente**
```sql
-- Identifier les requêtes lentes
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;
```

## 🔄 Procédures de Sauvegarde

### **Sauvegarde Manuelle**
1. **Dashboard Supabase** → Settings → Database
2. Cliquer sur **"Download backup"**
3. Sauvegarder le fichier avec date : `backup-YYYY-MM-DD.sql`

### **Sauvegarde des Données**
```sql
-- Export des données critiques
COPY (SELECT * FROM products WHERE status = 'active') 
TO '/tmp/products_backup.csv' WITH CSV HEADER;

COPY (SELECT * FROM categories) 
TO '/tmp/categories_backup.csv' WITH CSV HEADER;
```

## 🎯 Plan de Mise à l'Échelle

### **Phase 1 : Croissance (0-1000 produits)**
- ✅ Structure actuelle suffisante
- Monitoring des performances
- Optimisation continue

### **Phase 2 : Expansion (1000-10000 produits)**
- 🔄 Partitioning des tables analytics
- 🗄️ Archivage des anciennes données
- 🔍 Index composites avancés

### **Phase 3 : Enterprise (10000+ produits)**
- 🏗️ Séparation read/write replicas
- 📊 Base de données analytics dédiée
- 🚀 Cache Redis pour performances

## ⚡ Optimisations Futures

### **Index Avancés à Considérer**
```sql
-- Index composite pour recherche avancée
CREATE INDEX IF NOT EXISTS products_search_idx 
ON products USING GIN (to_tsvector('english', name || ' ' || description));

-- Index partiel pour produits actifs
CREATE INDEX IF NOT EXISTS products_active_featured_idx 
ON products (featured, price) WHERE status = 'active';
```

### **Triggers Utiles**
```sql
-- Auto-update du timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

## 📞 Support et Contacts

### **En Cas de Problème Critique**
1. 🔍 Vérifier les logs Supabase Dashboard
2. 📊 Exécuter l'audit : `node scripts/supabase-audit.js`
3. 🛠️ Consulter ce guide de maintenance
4. 🆘 Contacter le support Supabase si nécessaire

### **Ressources Utiles**
- 📚 [Documentation Supabase](https://supabase.com/docs)
- 🎯 [Guide Performance](https://supabase.com/docs/guides/database/performance)
- 🔐 [Sécurité RLS](https://supabase.com/docs/guides/auth/row-level-security)

---
*Dernière mise à jour: 2024 - Base de données stable et optimisée* ✨