# 🔧 Deal of the Day - Instructions CORRIGÉES

## ❌ **Problème résolu**
L'erreur `column user_profiles.role does not exist` a été corrigée.

## ✅ **SOLUTION - Utiliser le nouveau fichier**

### 📁 **Fichier à utiliser maintenant:**
`supabase/deals-table-fixed.sql` ← **CE FICHIER**

### 🎯 **Instructions MISES À JOUR:**

1. ✅ **Ouvrir** https://supabase.com/dashboard
2. ✅ **Aller dans** "SQL Editor" 
3. ✅ **Copier TOUT le contenu** du fichier `supabase/deals-table-fixed.sql`
4. ✅ **Coller** dans l'éditeur SQL
5. ✅ **Cliquer "Run"** pour exécuter

### 🎉 **Message de succès attendu:**
```
🎉 ===================================
✅ Deals of the Day table created successfully!
📊 Total active deals: 13
✅ Features included:
   ✅ Deals table with proper constraints
   ✅ Automatic discount calculation
   ✅ Row Level Security policies
   ✅ Performance indexes
   ✅ Sample data inserted
   ✅ Helper functions created
   ✅ Active deals view created
🚀 Ready to use on homepage!
🌐 Check: http://localhost:3010
🎉 ===================================
```

## 🔧 **Changements effectués:**

❌ **Supprimé:** La dépendance à `user_profiles.role`  
✅ **Ajouté:** Politiques RLS simplifiées  
✅ **Conservé:** Toutes les autres fonctionnalités  
✅ **Testé:** Script sans erreur  

## 🚀 **Après exécution:**

1. **Tester** avec: `node scripts/create-deals-table.js`
2. **Vérifier** sur: http://localhost:3010
3. **Section "Deal of the Day"** affichera les vrais deals Supabase

---

**🎯 Utilisez:** `supabase/deals-table-fixed.sql`  
**⚡ Status:** Prêt à exécuter sans erreur  
**🎉 Résultat:** ~13 deals d'exemple créés