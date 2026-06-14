# Plan de réorganisation du schéma de données

> Préparé le 2026-06-13 à partir de l'audit. **Statut : PHASE 1 IMPLÉMENTÉE le 2026-06-13.** La taxonomie (6 cat/25 types) et la structure géo (Région/District seedés, Commune/Fokontany en attente) sont en place dans les 3 apps. Détail dans `journal-decisions.md`. **Phase 2 restante** : reverse-geocoding lat/lng→géo, seed Communes/Fokontany, complétion des 114 districts vs INSTAT, curation des ~1521 entités `unverified`, suppression des colonnes OSM legacy, tables `claims`/`ratings`.
>
> NB : ce plan documentait la trajectoire générale (incluant claims/ratings) ; la réorg réellement faite a porté sur la **taxonomie + la géo** demandées par Mickael. Les sections ci-dessous restent la référence pour les étapes non encore faites.

## Objectif

Passer d'un schéma plat hérité de l'import OSM (1 grosse table `medical_entities` dénormalisée) à un schéma normalisé, indexé, avec intégrité référentielle, prêt à porter les fonctionnalités produit (ownership validé, notation, recherche performante) et la montée en charge (50k+ entités).

## Principe directeur

**Sécurité des données d'abord.** Les 2177 entités existantes ne doivent jamais être perdues. Chaque étape est une migration versionnée, testée sur une copie, réversible.

## Étape 0 — Filet de sécurité (BLOQUANT, à faire en premier)

1. `app.module.ts:32` : `synchronize: config.get('NODE_ENV') === 'development'` puis, pour la phase de migration, **`false`**.
2. Créer `backend/src/migrations/`.
3. `npm run migration:generate -- src/migrations/InitialSchema` : capture l'état actuel comme point de départ.
4. Vérifier `data-source.ts` (pointe déjà vers `src/migrations/*.ts`).
5. Sauvegarder : `pg_dump` de la base `medinaa` + confirmer que `backend/data/osm_medical_madagascar.json` est présent localement (source de reconstruction, non versionnée).

> Tant que l'étape 0 n'est pas validée, ne toucher à aucune colonne.

## Étape 1 — Intégrité de l'ownership

- `owner_id` varchar → `uuid`, ajouter FK vers `users(id)` `ON DELETE SET NULL`, dans l'entité : `@ManyToOne(() => User)` + `@JoinColumn({ name: 'owner_id' })`.
- Risque données : nul (0 entité claimée aujourd'hui).
- Index partiel `WHERE owner_id IS NOT NULL`.

## Étape 2 — Index de performance

```sql
CREATE INDEX idx_me_amenity     ON medical_entities (amenity)     WHERE amenity IS NOT NULL;
CREATE INDEX idx_me_healthcare  ON medical_entities (healthcare)  WHERE healthcare IS NOT NULL;
CREATE INDEX idx_me_addr_city   ON medical_entities (addr_city)   WHERE addr_city IS NOT NULL;
CREATE INDEX idx_me_owner_id    ON medical_entities (owner_id)    WHERE owner_id IS NOT NULL;
CREATE INDEX idx_me_latlng      ON medical_entities (lat, lng)    WHERE lat IS NOT NULL;
CREATE INDEX idx_me_name_fts    ON medical_entities USING GIN (to_tsvector('french', coalesce(name,'')));
```

Le GIN full-text est important : les filtres `ILIKE '%q%'` ne peuvent pas utiliser un B-tree.

## Étape 3 — Type canonique

Ajouter `type_canonical varchar` (ou colonne générée PG12+) = `COALESCE(amenity, healthcare, 'autre')`, indexée. Permet de supprimer la logique dupliquée dans `places.service.ts:77-83`, `TypeBadge` (front + mobile). **Décision à prendre** : colonne stockée mise à jour par le scraper, ou colonne générée. Recommandation : colonne générée (toujours cohérente).

## Étape 4 — Tables extraites

- **`claims`** : `id, entity_id FK, user_id FK, status CHECK(pending|approved|rejected|revoked), requested_at, resolved_at, UNIQUE(entity_id,user_id)`. `medical_entities.owner_id` devient le cache de l'`user_id` approuvé. Permet validation admin, historique, transfert, révocation.
- **`ratings`** : `id, entity_id FK, user_id FK, score smallint CHECK(1..5), comment text, created_at, UNIQUE(entity_id,user_id)`. + colonnes dérivées `rating_avg numeric(3,2)`, `rating_count int` sur `medical_entities` (trigger ou vue). Débloque `RatingStars`.
- **`entity_addresses`** (optionnel, plus tard) : extraction des `addr_*` + `postcode`, `UNIQUE(entity_id)`.

## Étape 5 — Nettoyage

- `users` : `@Column({ name: 'password_hash', select: false })`, `@CreateDateColumn({ name: 'created_at' })` + migration `RENAME COLUMN`.
- `tags` jsonb : **décision** — supprimer (les colonnes extraites suffisent) OU figer en read-only (jamais réécrit aux updates). Recommandation : conserver read-only avec `COMMENT ON COLUMN ... IS 'Read-only OSM snapshot'`, et corriger les updates owner pour ne plus désynchroniser.
- Supprimer `osm_url` (= `'https://www.openstreetmap.org/' || osm_id`) et envisager de dériver `osm_type` depuis `osm_id`.

## Étape 6 — Propagation aux 3 apps (synchronisée, obligatoire)

Tout renommage/ajout impacte (voir audit §4) :

- **backend** : `medical-entity.entity.ts`, `places.service.ts` (SQL brut stats + QueryBuilder `e.addr_city`), `update-place.dto.ts`, `scraper.service.ts` (`parseElement`), `export.service.ts` (headers CSV), `overpass.client.ts` (`LocalRecord`).
- **frontend** : `lib/api.ts` (interface), `TypeBadge`, `PlaceCard`, `PlaceDetailPage`, `DashboardPage`, `PlacesPage`, `ExportPage`.
- **mobile** : `lib/api.ts` (interface), `TypeBadge`, `EntityCard`, `EntityDetailScreen`, `EditEntityScreen` (mutations !), `ClaimScreen`, `MapScreen`, `SearchScreen`, `HomeScreen`.

> Le passage `amenity`/`healthcare` → `type_canonical` touche ~7 fichiers mobiles. `EditEntityScreen` écrit `{phone, openingHours, website}` : un renommage casse le PATCH **silencieusement** (backend ignore le champ inconnu).

**Recommandation transverse** : profiter de la réorg pour introduire un `packages/types` partagé (ou génération depuis l'OpenAPI Swagger) et supprimer la triple duplication de `MedicalEntity`/`TypeBadge`.

## Ordre d'exécution recommandé

0 (filet) → 1 (FK) → 2 (index) → 3 (type canonique) → 5 (nettoyage users + tags) → 4 (claims, ratings) → 6 (propagation apps, en parallèle de chaque étape qui change un contrat).

## Plan de rollback

Chaque migration a son `down()`. En dernier recours : DROP des tables + redémarrage backend (recrée le schéma cible) + `POST /api/scraper/start` (recharge les 2177 entités depuis le fallback local). Les claims/ratings créés par des utilisateurs réels devront être sauvegardés séparément avant tout DROP une fois qu'il y en aura.

## Questions ouvertes pour Mickael

1. `tags` jsonb : on supprime ou on garde en read-only ?
2. `type_canonical` : colonne générée (recommandé) ou pilotée par le scraper ?
3. La réorg inclut-elle déjà les tables `claims` et `ratings`, ou on se limite d'abord à normaliser l'existant (FK + index + type canonique) ?
4. On en profite pour le `packages/types` partagé, ou on garde la duplication pour cette itération ?
