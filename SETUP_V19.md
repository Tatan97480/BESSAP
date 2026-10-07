# BE STRONGER V22 — temps réel

V22 ajoute :
- flux d’activité live
- centre de notifications
- cloche de notifications
- Supabase Realtime
- événement à chaque validation de série/séance
- notification automatique du coach lorsqu'un client valide une activité
- structure `workout_live_events`
- synchronisation coach/client sans rafraîchir la page

## Installation
1. Exécuter les scripts V15 → V18.
2. Exécuter `supabase_v19_additions.sql`.
3. Vérifier que la publication `supabase_realtime` contient `workout_live_events` et `notifications`.
4. Renseigner `config.js`.
5. Publier.

## Exemple de flux
Client :
`Série validée → INSERT workout_live_events`

Supabase :
`Realtime → coach connecté`

Coach :
`🔔 notification → activité live → historique`

## Production
Ajouter :
- push notifications natives/PWA
- présence en ligne
- reprise après déconnexion
- file d'événements offline
- idempotence pour éviter les doublons
- monitoring et logs
