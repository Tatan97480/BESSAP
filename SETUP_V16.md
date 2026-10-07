# BE STRONGER V22 — passage au vrai onboarding

## 1. Supabase
- Créer le projet.
- Exécuter `supabase_schema.sql`.
- Puis exécuter `supabase_v16_additions.sql`.
- Renseigner `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans `config.js`.

## 2. Parcours client
Lors de l'inscription, le sportif choisit :
- **J’AI DÉJÀ UN COACH** → code obligatoire → RPC `accept_coach_invite` → statut `coaching`.
- **JE M’ENTRAÎNE SEUL** → statut `premium` → checkout.

Le statut d’accès est lu depuis la base ; le navigateur ne doit pas décider seul qu'un client a droit à l'accès gratuit.

## 3. Paiement
Le bouton Premium appelle l'Edge Function `create-checkout`.
En production :
- créer un produit/prix Stripe,
- stocker `STRIPE_SECRET_KEY` uniquement dans les secrets Edge Function,
- créer une session Checkout,
- traiter les webhooks `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`,
- mettre à jour le statut Premium côté serveur.

Si l'application est distribuée nativement sur iOS/Android, vérifier les règles Apple/Google concernant les achats numériques et utiliser les mécanismes requis par la plateforme.

## 4. Invitations
Un coach génère un code à usage contrôlé.
Le code est validé par la RPC côté serveur, associé au coach, marqué comme utilisé et le client passe en `coaching`.

## 5. Sécurité
- RLS activé.
- Jamais de service_role dans le front.
- Jamais de secret Stripe dans le front.
- Vérification serveur des rôles et droits.
- Prévoir rate limiting, logs, sauvegardes, politique de confidentialité, suppression/export des données.

## 6. Démo
Sans configuration Supabase, le bouton « DÉMO HORS LIGNE » permet de tester l'interface.
