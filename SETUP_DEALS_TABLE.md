# 🎯 Setup Deals of the Day Table

## 📋 Instructions pour créer la table des deals

### ✅ **Étape 1: Ouvrir Supabase Dashboard**
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet (fhewhxjprkksjriohxpv)
3. Cliquer sur **SQL Editor** dans le menu de gauche

### ✅ **Étape 2: Exécuter le script**
1. Copier **TOUT** le contenu du fichier `supabase/deals-table.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur **"Run"** pour exécuter

### ✅ **Étape 3: Vérifier le succès**
Vous devriez voir ces messages de succès :
```
Deals of the Day table created successfully! 🎉
Features included:
✅ Deals table with proper constraints
✅ Automatic discount calculation
✅ Row Level Security policies
✅ Performance indexes
✅ Sample data inserted
✅ Helper functions created
✅ Active deals view created
```

## 🗂️ **Ce qui sera créé:**

### **Table principale**
- `deals_of_the_day` - Table des deals avec prix réduits

### **Fonctionnalités automatiques**
- ✅ **Calcul automatique** des pourcentages de réduction
- ✅ **Contraintes** pour garantir des données valides
- ✅ **Index** pour des performances optimales
- ✅ **RLS** (Row Level Security) pour la sécurité
- ✅ **Triggers** pour les timestamps automatiques

### **Données d'exemple**
- ✅ **5 deals** basés sur les produits featured
- ✅ **8 deals** supplémentaires avec remises variées (25-50%)
- ✅ **Dates réalistes** (actifs maintenant, se terminent dans 24h-7j)

### **Fonctions helper**
- `get_todays_best_deal()` - Récupère le meilleur deal du jour
- `is_product_on_deal(product_id)` - Vérifie si un produit est en deal

### **Vue utile**
- `active_deals_with_products` - Vue avec infos complètes des deals actifs

## 🔧 **Structure de la table**

```sql
deals_of_the_day (
    id UUID PRIMARY KEY,
    product_id UUID → products(id),
    original_price DECIMAL(10,2),
    deal_price DECIMAL(10,2),
    discount_percentage INTEGER (calculé automatiquement),
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    quantity_available INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

## 🎉 **Résultat attendu**

Après exécution réussie :
- ✅ Table `deals_of_the_day` créée
- ✅ ~13 deals d'exemple insérés
- ✅ Toutes les fonctionnalités actives
- ✅ Homepage affiche les vrais deals Supabase

## 🚨 **En cas d'erreur**

Si vous voyez des erreurs :
1. **Vérifiez** que la table `products` existe
2. **Assurez-vous** d'avoir les permissions admin
3. **Contactez-moi** avec le message d'erreur exact

---

**🎯 Fichier à utiliser :** `supabase/deals-table.sql`  
**⏱️ Temps d'exécution :** ~30 secondes  
**📊 Deals créés :** ~13 deals d'exemple  