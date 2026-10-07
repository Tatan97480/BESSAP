# BE STRONGER V20 — Vidéos

V20 ajoute une vraie bibliothèque vidéo d'exercices.

## Fonctionnalités
- bibliothèque coach
- recherche d'exercices
- cartes vidéo
- lecture intégrée
- description technique
- lien vidéo ↔ exercice
- table Supabase `exercise_media`
- bucket Storage `exercise-videos`
- RLS Storage + table

## Mise en production
1. Exécuter les scripts précédents puis `supabase_v20_additions.sql`.
2. Vérifier le bucket `exercise-videos`.
3. Remplacer les URL de démonstration par des fichiers Supabase Storage.
4. Dans la prochaine version, brancher l'upload natif avec progression et miniatures.

⚠️ Ne jamais exposer une clé `service_role` dans l'application frontend.
