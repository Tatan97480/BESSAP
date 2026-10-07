# BE STRONGER V22 — mise en ligne

1. Créer un projet Supabase.
2. Dans SQL Editor, exécuter `supabase_schema.sql`.
3. Dans `config.js`, renseigner uniquement :
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
4. Ne jamais mettre de `service_role` key dans le front-end.
5. Publier le dossier sur GitHub Pages / Vercel / Netlify.
6. Pour les paiements, brancher un système serveur (Stripe et/ou achats intégrés selon la distribution).
7. Pour les codes coaching, utiliser une Edge Function / backend afin de valider le code et créer `coach_clients`; ne jamais faire confiance au JavaScript du navigateur pour attribuer un accès gratuit.

## Test hors ligne
Ouvrir `index.html` et choisir « DÉMO HORS LIGNE ».

## Architecture V22
Auth -> profiles -> coach_clients -> programs -> program_assignments -> workout_logs

Le contrôle d'accès doit rester côté serveur avec RLS.
