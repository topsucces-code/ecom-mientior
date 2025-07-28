# 🚀 Guide de Configuration Supabase

Ce guide vous accompagne dans la configuration complète de Supabase pour votre plateforme e-commerce.

## 📋 Prérequis

- Compte Supabase (gratuit sur [supabase.com](https://supabase.com))
- Node.js 18+ installé
- Accès au terminal/ligne de commande

## 🔧 Étape 1: Création du Projet Supabase

### 1.1 Créer un nouveau projet
1. Connectez-vous à [supabase.com](https://supabase.com)
2. Cliquez sur "New Project"
3. Choisissez votre organisation
4. Nom du projet: `ecommerce-platform`
5. Base de données password: générez un mot de passe fort
6. Région: choisissez la plus proche de vos utilisateurs
7. Plan: gratuit pour débuter

### 1.2 Récupérer les clés d'API
Une fois le projet créé:
1. Allez dans **Settings** > **API**
2. Copiez l'URL du projet
3. Copiez la clé `anon public`
4. Copiez la clé `service_role` (pour les opérations admin)

## 🔐 Étape 2: Configuration des Variables d'Environnement

### 2.1 Créer le fichier .env.local
```bash
# À la racine du projet
cp .env.example .env.local
```

### 2.2 Remplir les variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=http://localhost:3010
```

⚠️ **Important**: Gardez ces clés secrètes et ne les commitez jamais dans git.

## 🗄️ Étape 3: Configuration de la Base de Données

### 3.1 Exécuter le script de setup complet
1. Ouvrez Supabase Dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez le contenu de `supabase/setup-complete.sql`
5. Cliquez sur **RUN** pour exécuter

Ce script va:
- ✅ Créer toutes les tables nécessaires
- ✅ Configurer les index pour les performances
- ✅ Activer Row Level Security (RLS)
- ✅ Créer les politiques de sécurité
- ✅ Installer les fonctions métier
- ✅ Insérer des données d'exemple

### 3.2 Vérification de l'installation
```bash
# Installer les dépendances si pas encore fait
npm install

# Tester la connexion
node scripts/test-supabase-connection.js
```

## 🔒 Étape 4: Configuration de l'Authentification

### 4.1 Activer les providers OAuth (optionnel)
Dans Supabase Dashboard:
1. **Authentication** > **Providers**
2. Activez Google, Facebook, Apple selon vos besoins
3. Configurez les clés d'API des providers

### 4.2 Configuration des URL de redirection
1. **Authentication** > **URL Configuration**
2. Site URL: `http://localhost:3010`
3. Redirect URLs: 
   - `http://localhost:3010/auth/callback`
   - `http://localhost:3010/auth/reset-password`

## 📊 Étape 5: Vérification et Tests

### 5.1 Test de connexion automatisé
```bash
# Test complet de la configuration
node scripts/test-supabase-connection.js
```

### 5.2 Test via l'API Next.js
```bash
# Démarrer le serveur de développement
npm run dev

# Tester l'intégration via l'API
curl http://localhost:3010/api/test-integration
```

### 5.3 Test dans l'interface
1. Ouvrez http://localhost:3010
2. Naviguez dans l'application
3. Testez les fonctionnalités:
   - Création de compte
   - Connexion/déconnexion
   - Ajout au panier
   - Recherche de produits

## 🛠️ Étape 6: Configuration Avancée

### 6.1 Configuration du Storage (pour les images)
1. **Storage** > **Create bucket**
2. Nom: `product-images`
3. Public: `true`
4. **Create bucket**: `avatars` (pour les avatars utilisateurs)

### 6.2 Configuration des Webhooks (optionnel)
Pour les notifications en temps réel:
1. **Database** > **Webhooks**
2. Créez des webhooks pour les tables importantes
3. URL: `http://your-domain.com/api/webhooks/supabase`

### 6.3 Configuration du Real-time
1. **Database** > **Replication**
2. Activez la réplication pour:
   - `notifications`
   - `chat_messages`
   - `orders` (pour le suivi en temps réel)

## 🚀 Étape 7: Déploiement en Production

### 7.1 Variables d'environnement de production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
```

### 7.2 Configuration des URL de production
Dans Supabase Dashboard (projet de production):
1. **Authentication** > **URL Configuration**
2. Site URL: `https://your-domain.com`
3. Redirect URLs: `https://your-domain.com/auth/callback`

### 7.3 Sécurité en production
- ✅ Vérifiez que RLS est activé sur toutes les tables
- ✅ Testez les politiques de sécurité
- ✅ Configurez les sauvegardes automatiques
- ✅ Surveillez les performances

## 📚 Fonctionnalités Disponibles

### 🛒 E-commerce Core
- ✅ Gestion des produits et catégories
- ✅ Panier et commandes
- ✅ Avis et commentaires
- ✅ Gestion des utilisateurs

### 🔥 Fonctionnalités Avancées
- ✅ Système de coupons et promotions
- ✅ Traitement des paiements multi-providers
- ✅ Notifications en temps réel
- ✅ Recherche avancée avec analytics
- ✅ Recommandations personnalisées
- ✅ Gestion de stock avec alertes
- ✅ Système de chat client/support
- ✅ Analytics et métriques business

### 📊 Analytics et Métriques
- ✅ Suivi des ventes et revenus
- ✅ Analytics de recherche
- ✅ Métriques d'inventaire
- ✅ Comportement utilisateur

## 🆘 Résolution de Problèmes

### Erreur: "relation does not exist"
➡️ Le script SQL n'a pas été exécuté correctement
- Vérifiez dans **Database** > **Tables** que toutes les tables existent
- Ré-exécutez `supabase/setup-complete.sql`

### Erreur: "Row Level Security policy"
➡️ Problème de permissions RLS
- Vérifiez que vous êtes authentifié
- Consultez les politiques dans **Authentication** > **Policies**

### Erreur: "Function does not exist"
➡️ Les fonctions n'ont pas été créées
- Ré-exécutez la partie "Database Functions" du script SQL
- Vérifiez dans **Database** > **Functions**

### Performance lente
➡️ Optimisation nécessaire
- Vérifiez les index dans **Database** > **Indexes**
- Activez la mise en cache avec **Extensions** > **pg_stat_statements**

## 📞 Support

### Documentation Officielle
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js avec Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

### Logs et Debugging
- **Logs**: Dashboard > **Logs**
- **Database**: Dashboard > **Database** > **Logs**
- **Auth**: Dashboard > **Authentication** > **Logs**

### Community
- [Discord Supabase](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

🎉 **Félicitations !** Votre plateforme e-commerce avec Supabase est maintenant configurée et prête à l'emploi.

Pour toute question, consultez la documentation ou créez une issue dans le repository du projet.