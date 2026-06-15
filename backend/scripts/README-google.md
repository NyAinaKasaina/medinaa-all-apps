# Enrichissement Google (bootstrap nom / téléphone / horaires)

Bootstrap **ponctuel** : on comble les champs vides des entités (téléphone, horaires, nom) depuis
Google Places, puis la donnée est destinée à être maintenue par les **propriétaires** (comptes
établissements à venir). On ne réécrit jamais une valeur déjà présente.

## Prérequis
- Clé Google Maps Platform avec **Places API** + facturation activée.
- La mettre dans `backend/.env` (gitignored) :
  ```
  GOOGLE_MAPS_API_KEY=xxxxxxxx
  ```
- Restreindre la clé (API Places uniquement, restriction par IP du serveur).

## Lancer
```bash
cd backend
node scripts/google-enrich.cjs --limit 25     # PILOTE recommandé (valider qualité + coût)
node scripts/google-enrich.cjs                # run complet (entités nommées sans tel/horaires)
node scripts/google-enrich.cjs --nameless     # tente aussi les entités SANS nom (nearby, faible confiance)
```
Options : `--max-dist M` (distance max candidat↔entité, défaut 1500 m), `--radius M`, `--sleep ms`, `--refresh`.

## Fonctionnement
1. Entité **avec nom** : `Find Place From Text` (nom + biais de localisation lat/lng) → candidat.
2. Contrôle de distance (candidat ≤ `--max-dist` de l'entité) pour éviter les faux appariements.
3. `Place Details` (champs : name, formatted_phone_number, opening_hours) → comble tel/horaires (et nom si vide).
4. Stocke `google_place_id` + `google_enriched_at`. Reprenable : ignore les entités déjà enrichies (sauf `--refresh`).

Les entités **sans nom** (≈315) ne sont pas recherchables par texte ; `--nameless` tente le lieu médical
le plus proche (à valider, faible confiance).

## Coût (indicatif)
~2 appels par entité (Find Place + Details), ~0,017 $/appel ≈ **0,034 $/entité**.
Le script affiche le nombre d'appels et une estimation à la fin. Faire le pilote d'abord.

## ToS Google (important)
Seul `google_place_id` est stockable durablement. Le tél/horaires sont des champs opérationnels
comblés transitoirement, puis maintenus par les propriétaires (la donnée cesse d'être « cache Google »).
Ne pas étendre ce script aux notes/avis/photos (stockage/affichage restreints par les ToS).
