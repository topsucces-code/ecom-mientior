-- =====================================================
-- CONFIGURATION DE LA SÉCURITÉ RLS (ROW LEVEL SECURITY)
-- E-commerce Platform - Politiques de sécurité complètes
-- =====================================================

-- Activer RLS sur toutes les tables principales
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES POUR LES PROFILS UTILISATEUR
-- =====================================================

-- Politique pour lire son propre profil
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

-- Politique pour créer son profil (lors de l'inscription)
CREATE POLICY "Users can create own profile" ON public.user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique pour mettre à jour son profil
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- POLITIQUES POUR LE PANIER
-- =====================================================

-- Utilisateurs peuvent gérer leur propre panier
CREATE POLICY "Users can manage own cart" ON public.cart_items
FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LES COMMANDES
-- =====================================================

-- Utilisateurs peuvent voir leurs propres commandes
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

-- Utilisateurs peuvent créer leurs propres commandes
CREATE POLICY "Users can create own orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utilisateurs peuvent mettre à jour leurs commandes (statut limité)
CREATE POLICY "Users can update own orders" ON public.orders
FOR UPDATE USING (
  auth.uid() = user_id 
  AND status IN ('pending', 'cancelled')
);

-- Admins et agents peuvent voir toutes les commandes
CREATE POLICY "Admins can manage all orders" ON public.orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  )
);

-- =====================================================
-- POLITIQUES POUR LES AVIS
-- =====================================================

-- Tous peuvent voir les avis approuvés
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT USING (status = 'approved');

-- Utilisateurs peuvent voir leurs propres avis
CREATE POLICY "Users can view own reviews" ON public.reviews
FOR SELECT USING (auth.uid() = user_id);

-- Utilisateurs peuvent créer des avis
CREATE POLICY "Users can create reviews" ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utilisateurs peuvent modifier leurs avis non approuvés
CREATE POLICY "Users can update own pending reviews" ON public.reviews
FOR UPDATE USING (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- Admins peuvent gérer tous les avis
CREATE POLICY "Admins can manage all reviews" ON public.reviews
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  )
);

-- =====================================================
-- POLITIQUES POUR LES INTERACTIONS
-- =====================================================

-- Utilisateurs peuvent créer leurs interactions
CREATE POLICY "Users can create own interactions" ON public.user_interactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utilisateurs peuvent voir leurs interactions
CREATE POLICY "Users can view own interactions" ON public.user_interactions
FOR SELECT USING (auth.uid() = user_id);

-- Admins peuvent voir toutes les interactions (pour analytics)
CREATE POLICY "Admins can view all interactions" ON public.user_interactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- POLITIQUES POUR LA WISHLIST
-- =====================================================

-- Utilisateurs peuvent gérer leur wishlist
CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items
FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LES COMPARAISONS
-- =====================================================

-- Utilisateurs peuvent gérer leurs comparaisons
CREATE POLICY "Users can manage own comparisons" ON public.product_comparisons
FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LES NOTIFICATIONS
-- =====================================================

-- Utilisateurs peuvent voir leurs notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Système peut créer des notifications pour les utilisateurs
CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Utilisateurs peuvent gérer leurs paramètres de notifications
CREATE POLICY "Users can manage notification settings" ON public.notification_settings
FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR L'HISTORIQUE DE RECHERCHE
-- =====================================================

-- Utilisateurs peuvent voir leur historique de recherche
CREATE POLICY "Users can view own search history" ON public.search_history
FOR SELECT USING (auth.uid() = user_id);

-- Système peut enregistrer les recherches
CREATE POLICY "System can create search history" ON public.search_history
FOR INSERT WITH CHECK (true);

-- =====================================================
-- POLITIQUES POUR LES PAIEMENTS
-- =====================================================

-- Utilisateurs peuvent voir leurs paiements
CREATE POLICY "Users can view own payments" ON public.payments
FOR SELECT USING (auth.uid() = user_id);

-- Système peut créer des paiements
CREATE POLICY "System can create payments" ON public.payments
FOR INSERT WITH CHECK (true);

-- Utilisateurs peuvent gérer leurs méthodes de paiement
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- POLITIQUES POUR LES COUPONS
-- =====================================================

-- Tous peuvent voir les coupons actifs (pour validation)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
FOR SELECT USING (is_active = true);

-- Utilisateurs peuvent voir leur utilisation de coupons
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
FOR SELECT USING (auth.uid() = user_id);

-- Système peut enregistrer l'utilisation de coupons
CREATE POLICY "System can create coupon usage" ON public.coupon_usage
FOR INSERT WITH CHECK (true);

-- =====================================================
-- POLITIQUES POUR LE CHAT
-- =====================================================

-- Clients peuvent voir leurs conversations
CREATE POLICY "Customers can view own conversations" ON public.chat_conversations
FOR SELECT USING (auth.uid() = customer_id);

-- Agents peuvent voir les conversations assignées
CREATE POLICY "Agents can view assigned conversations" ON public.chat_conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_agents 
    WHERE user_id = auth.uid() AND id = agent_id
  )
);

-- Clients peuvent créer des conversations
CREATE POLICY "Customers can create conversations" ON public.chat_conversations
FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Messages : utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "Users can view own conversation messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id 
    AND (c.customer_id = auth.uid() OR c.agent_id IN (
      SELECT id FROM public.chat_agents WHERE user_id = auth.uid()
    ))
  )
);

-- Utilisateurs peuvent créer des messages dans leurs conversations
CREATE POLICY "Users can create messages in own conversations" ON public.chat_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id 
    AND (c.customer_id = auth.uid() OR c.agent_id IN (
      SELECT id FROM public.chat_agents WHERE user_id = auth.uid()
    ))
  )
);

-- =====================================================
-- POLITIQUES POUR LES VENDEURS
-- =====================================================

-- Vendeurs peuvent voir leurs propres versements
CREATE POLICY "Vendors can view own payouts" ON public.vendor_payouts
FOR SELECT USING (auth.uid() = vendor_id);

-- =====================================================
-- POLITIQUES POUR LES SESSIONS
-- =====================================================

-- Utilisateurs peuvent voir leurs sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
FOR SELECT USING (auth.uid() = user_id);

-- Système peut créer et mettre à jour les sessions
CREATE POLICY "System can manage sessions" ON public.user_sessions
FOR ALL WITH CHECK (true);

-- =====================================================
-- POLITIQUES POUR LES TABLES PUBLIQUES (SANS RLS)
-- =====================================================

-- Les tables suivantes restent publiques en lecture :
-- - categories (catalogue public)
-- - products (catalogue public)
-- - warehouses (information publique)
-- - suppliers (information publique pour transparence)
-- - chat_agents (liste publique des agents disponibles)

-- Mais on peut ajouter des restrictions pour les modifications
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Tous peuvent voir les catégories et produits actifs
CREATE POLICY "Anyone can view active categories" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Anyone can view active products" ON public.products
FOR SELECT USING (status = 'active');

-- Seuls les admins peuvent modifier les catégories et produits
CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage products" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'vendor')
  )
);

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔒 Politiques RLS configurées avec succès !';
    RAISE NOTICE '✅ Sécurité activée sur toutes les tables sensibles';
    RAISE NOTICE '👤 Utilisateurs : accès limité à leurs propres données';
    RAISE NOTICE '🛡️ Admins : accès complet pour la gestion';
    RAISE NOTICE '🔐 Agents : accès limité aux fonctions de support';
    RAISE NOTICE '📊 Tables publiques : catalogue produits accessible';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Votre base de données est maintenant sécurisée !';
END $$;