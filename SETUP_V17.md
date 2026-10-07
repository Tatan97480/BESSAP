# BE STRONGER V22

V22 ajoute une vraie logique d'éditeur de programmes :
- bibliothèque d'exercices
- catégories et équipements
- prescriptions séries/reps/repos/RPE
- éditeur par semaine
- ajout/retrait d'exercices
- affectation conceptuelle aux clients
- suivi de validation des séances
- tables Supabase `exercises`, `program_sessions`, `session_exercises`
- RLS coach/client pour les programmes

## Installation Supabase
1. Exécuter les scripts précédents V22.
2. Exécuter `supabase_v17_additions.sql`.
3. Renseigner `config.js`.
4. Publier le dossier.

## V22 = étape produit
Le builder local est fonctionnel en démonstration. Pour production, brancher les actions de création/modification du builder sur les tables Supabase, puis ajouter l'upload vidéo, les notifications push et les webhooks de paiement.
