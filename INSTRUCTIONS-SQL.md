# Instructions pour ajouter les produits de test

## Étapes à suivre

1. **Ouvrez votre dashboard Supabase :**
   - Allez sur https://supabase.com/dashboard
   - Connectez-vous à votre compte
   - Sélectionnez votre projet e-commerce

2. **Accédez au SQL Editor :**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Créez une nouvelle requête

3. **Exécutez le script :**
   - Ouvrez le fichier `supabase/add-more-products.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" pour exécuter

## Ce que le script va ajouter

Le script `add-more-products.sql` va ajouter environ 20 nouveaux produits diversifiés :

### Électronique
- iPad Air 5e génération (699,99€)
- Clavier Mécanique RGB (159,99€)
- Écran 4K 27 pouces (449,99€)
- Webcam HD 1080p (89,99€)
- Chargeur Sans Fil Rapide (39,99€)
- Montre Connectée Sport (199,99€)
- Enceinte Bluetooth Portable (79,99€)

### Vêtements & Accessoires
- Hoodie Unisexe Premium (79,99€)
- Baskets Running Femme (129,99€)
- Veste en Cuir Homme (299,99€)
- Robe d'été Fleurie (59,99€)
- Sac à Dos Urbain (59,99€)
- Lunettes de Soleil Aviateur (119,99€)

### Maison & Décoration
- Lampe de Bureau LED (89,99€)
- Coussin Décoratif Set (49,99€)
- Plante Artificielle Monstera (79,99€)
- Tapis Berbère Moderne (159,99€)
- Kit Café Barista (89,99€)

### Livres
- Guide Photographie Numérique (39,99€)
- Roman Fantasy Épique (29,99€)

## Après l'exécution

Une fois le script exécuté avec succès :
- Votre catalogue contiendra environ 25+ produits
- Les produits seront répartis dans différentes catégories
- Certains produits seront marqués comme "featured"
- Des images d'exemple seront ajoutées à certains produits existants
- Vous verrez un message de confirmation dans les logs Supabase

## Vérification

Pour vérifier que tout fonctionne :
1. Rafraîchissez votre page web (localhost:3040)
2. La homepage devrait afficher plus de produits
3. Testez la navigation dans les différentes catégories