# BE STRONGER V22 — Dashboard client

V22 ajoute un espace **Mon suivi** côté client :
- poids actuel et objectif
- tour de taille
- nombre de séances
- série de jours actifs
- objectif principal
- dernières performances
- modification des métriques
- séparation claire des données coach/client

Pour une version production, les métriques devront être stockées dans Supabase avec RLS afin que le client ne puisse lire que ses propres données et que le coach ne voie que ses clients.
