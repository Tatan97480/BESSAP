# BE STRONGER V14

V14 prend le prototype V10 et le rapproche du workflow de l'application BISSAP montrée par l'utilisateur :
- accueil coach
- clients / fiches client
- programmes multi-semaines
- planning
- timer WOD
- progression
- nutrition
- Coach IA
- paiements / accès
- réglages
- espace sportif séparé

## Modèle d'accès
- COACHING : le sportif déjà coaché obtient l'accès inclus.
- PREMIUM : le sportif autonome arrive via le lien public et souscrit.
- COACH : voit uniquement ses clients.

## Prototype
Les données sont stockées dans localStorage. Aucun paiement ou serveur n'est réel.

## Pour production
Brancher authentification, base PostgreSQL/Supabase avec Row Level Security, permissions serveur, codes d'invitation, paiement et webhooks, stockage, notifications, IA serveur, RGPD et publication mobile.
