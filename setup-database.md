# Configuration de la Base de Données

## Étapes pour initialiser Supabase

1. **Connectez-vous à Supabase Console**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet

2. **Exécutez le schéma**
   - Allez dans "SQL Editor"
   - Copiez et exécutez tout le contenu de `supabase/schema.sql`

3. **Insérez les données de test**
   - Copiez et exécutez tout le contenu de `supabase/seed-data.sql`

4. **Vérifiez les tables**
   - Allez dans "Table Editor"
   - Vérifiez que les tables suivantes sont créées :
     - categories (3 entrées)
     - products (6 entrées)
     - user_profiles (vide)
     - orders (vide)
     - cart_items (vide)

## Commandes SQL importantes

```sql
-- Vérifier les données
SELECT * FROM categories;
SELECT * FROM products;

-- Compter les entrées
SELECT COUNT(*) FROM categories; -- Devrait retourner 3
SELECT COUNT(*) FROM products;   -- Devrait retourner 6
```

Une fois terminé, votre application web pourra afficher les vrais produits depuis Supabase !