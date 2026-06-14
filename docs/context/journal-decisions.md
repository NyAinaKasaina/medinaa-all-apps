# Journal des décisions et leçons

> ADR léger. Une entrée par décision structurante ou erreur évitée, la plus récente en haut. Objectif : que Claude (et l'équipe) apprenne des choix passés et ne repose pas deux fois la même question.

Format : `## YYYY-MM-DD — Titre` · **Contexte** / **Décision** / **Conséquences** / **Leçon**.

---

## 2026-06-13 — Réorg schéma phase 1 : taxonomie médicale + hiérarchie géographique

**Contexte.** Mise en œuvre du plan de réorg (taxonomie 6 catégories / 25 types adaptée au système de santé MDG, hiérarchie géo Région > District > Commune > Fokontany), validée via 3 décisions : tables de référence, géo structure + seed Régions/Districts (géocodage en phase 2), mapping auto des types évidents + statut `unverified` pour les ambigus.

**Actions réalisées (les 3 apps).**
- **DB** : 4 scripts SQL idempotents dans `backend/src/migrations/` (001 schéma, 002 seed taxonomie, 003 seed 24 régions + 114 districts, 004 mapping OSM→type). `synchronize` passé à **false** (schéma géré par SQL). Résultat : 6 cat, 25 types, 24 régions, 114 districts ; 656 entités auto-classées, 1521 `unverified` ; 2177 intactes.
- **Backend** : entités `MedicalCategory/MedicalType/Region/District/Commune/Fokontany` + 7 colonnes sur `MedicalEntity`. Modules read `TaxonomyModule` (`GET /api/taxonomy`, `/taxonomy/types`) et `GeoModule` (`GET /api/regions`, `/regions/:id/districts`). `places.service` : filtres `category/type/regionId/districtId/status`, stats `byCategory`+`unverified`, curation via `typeSlug` (PATCH owner → `classification_status='verified'`). Smoke test OK.
- **Frontend** : `lib/taxonomy.ts` (hook + couleurs catégorie), `TypeBadge` piloté par `typeSlug`, `PlacesPage` filtres catégorie + région/district dépendants, `DashboardPage` répartition par catégorie + « à classifier ». Build OK.
- **Mobile** : idem (taxonomy hook, TypeBadge, Home/Search par catégorie, EditEntityScreen sélecteur de type pour curation propriétaire). tsc OK.

**Conséquences / reste (phase 2).** Reverse-geocoding lat/lng → géo (PostGIS non installé), seed Communes/Fokontany, complétion des districts (liste ~114 à vérifier vs INSTAT), curation des 1521 `unverified`, suppression des colonnes OSM legacy. Colonnes OSM (`amenity`/`healthcare`/`addr_*`) conservées en lecture seule comme repli.

**Leçon.** Le mapping OSM est plus pauvre que prévu (30% auto-classés, pas 60%) : l'OSM ne distingue ni CHU/CHD ni CSB1/CSB2, et `doctors` (754) est laissé `unverified` par prudence. La richesse de la taxonomie métier dépasse la donnée source → la curation humaine (admin + propriétaires) est centrale, pas optionnelle.

---

## 2026-06-13 — Correctifs critiques pré-réorg (B-1, S-1, S-3) + filet migrations

**Contexte.** Après l'audit, Mickael a validé l'exécution des correctifs critiques et du filet migrations avant la réorg.

**Décision / actions réalisées.**
- **B-1** : `@Controller('auth')` (était `'api/auth'`). Vérifié bout-en-bout (route mappée `/api/auth/login`, ancienne route 404).
- **S-3** : `getOrThrow('JWT_SECRET')` + `JWT_SECRET` fort généré dans `.env`, placeholder dans `.env.example`.
- **S-1** : keystore **rotaté** (l'ancien `.jks` était absent de la machine, rotation sans perte). Nouveau mot de passe dans `mobile/android/keystore.properties` (gitignored). `build.gradle` lit ce fichier. Secrets retirés de `CLAUDE.md` + `gradle.properties`. Nouveau SHA-256 documenté.
- **Filet migrations** : `pg_dump` complet + schéma dans `backend/data/`, fichier fallback `osm_medical_madagascar.json` **régénéré** (il était absent !), dossier `backend/src/migrations/` + README, `synchronize` inversé en fail-safe `=== 'development'`. Backend rebuild + smoke test OK (2177 entités intactes).

**Conséquences.** La génération de la migration `InitialSchema` TypeORM est reportée au démarrage de la réorg (droit CREATEDB requis). L'ancien secret keystore reste dans l'historique git mais est inoffensif.

**Leçon.** Un smoke test a tué le serveur de dev de Mickael (`pkill -f dist/main` a attrapé l'enfant de son `nest --watch`). Toujours vérifier les process actifs et tester sur un port distinct. Voir la mémoire `feedback-ne-pas-tuer-dev-server`.

---

## 2026-06-13 — Audit fondateur + structuration du contexte

**Contexte.** Avant une réorganisation du schéma de données, Mickael a demandé un audit approfondi multi-experts puis la mise en place d'une mémoire/contexte durable pour Claude.

**Décision.** Audit mené par 5 experts (data, backend, frontend, mobile, sécurité), consolidé dans `docs/audit/2026-06-13-audit-complet.md`. Création de `docs/context/` (état, dette, plan reorg, ce journal) comme source de vérité vivante, plus une mémoire persistante côté Claude.

**Conséquences.** Le `CLAUDE.md` racine est identifié comme périmé (ignore auth, mobile, claim). `docs/context/etat-du-projet.md` prime désormais. La réorg du schéma se fera dans une session ultérieure, sur la base de `reorg-schema-plan.md`.

**Leçon.** Ne jamais traiter le `CLAUDE.md` racine comme la vérité absolue sur l'état du code : il décrit l'intention initiale, pas l'état courant. Vérifier dans le code et `docs/context/`.

---

## 2026-06-13 — Pré-requis bloquant : migrations avant tout changement de schéma

**Contexte.** Le projet tourne en `synchronize: true` (hors prod) sans aucune migration versionnée. La réorg va modifier des colonnes sur 2177 entités.

**Décision.** Aucun changement de schéma ne sera fait tant que `synchronize: false` + migration initiale ne sont pas en place.

**Conséquences.** Étape A-1 placée en tête de la dette, en amont de toute la réorg.

**Leçon.** Sous `synchronize: true`, un simple renommage de propriété d'entité = DROP/CREATE de colonne = perte de données silencieuse. Le filet (migration + sauvegarde) se pose AVANT de toucher au schéma, jamais après.

---

<!-- Ajouter les nouvelles décisions au-dessus de cette ligne -->
