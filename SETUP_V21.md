# BE STRONGER V22 — Progression intelligente

V22 ajoute :
- historique de performances
- PR estimé
- e1RM via formule d'Epley
- volume par performance
- RPE
- recommandation automatique de charge
- enregistrement des performances depuis Séance Live
- dashboard progression

## Logique de recommandation
RPE ≤ 7 → +2,5 kg
RPE 8 → même charge
RPE > 8 → -2,5 kg

Cette logique est une aide à la progression, pas une prescription médicale.

## Supabase
Exécuter `supabase_v21_additions.sql` après les scripts précédents.

La version production doit ensuite :
- synchroniser tout l'historique client avec Supabase
- afficher les graphiques
- calculer les PR par exercice
- gérer les cycles/deload
- sécuriser strictement les accès coach/client via RLS.
