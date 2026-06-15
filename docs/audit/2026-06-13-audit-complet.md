# Audit complet Medinaa — 13 juin 2026

> Audit approfondi mené par 5 experts (data/schéma, backend, frontend, mobile, sécurité) avant la réorganisation du schéma de données. Toutes les affirmations critiques ont été vérifiées au niveau fichier:ligne.

## Résumé exécutif

Medinaa est un monorepo fullstack à 3 applications qui collecte, stocke et expose les entités médicales de Madagascar (source OpenStreetMap via Overpass), avec un modèle d'ownership permettant à des propriétaires de revendiquer (`claim`) et éditer leur établissement.

**Posture globale** : la qualité du code applicatif est honnêtement au-dessus de la moyenne pour ce stade (auth JWT propre, validation stricte, requêtes paramétrées, upsert idempotent qui préserve les claims). Les problèmes graves ne sont pas dans la logique métier mais dans :

1. **La gestion des secrets** (mot de passe keystore de prod commité en clair dans un repo public).
2. **L'exposition d'endpoints d'administration** sans authentification (scraper, export de toute la base).
3. **Un bug de routage qui casse l'auth mobile bout-en-bout** (`/api/api/auth/*`).
4. **L'absence totale de filet pour les changements de schéma** (`synchronize: true`, aucune migration versionnée), juste avant une réorganisation du schéma.

**Top 6 à traiter en priorité (avant la réorg) :**

| # | Action | Sévérité | Fichier |
|---|---|---|---|
| 1 | Passer `synchronize: false` + générer la migration initiale | CRITIQUE | `backend/src/app.module.ts:32` |
| 2 | Corriger le double-préfixe `@Controller('api/auth')` → `@Controller('auth')` | CRITIQUE | `backend/src/modules/auth/auth.controller.ts:6` |
| 3 | Protéger scraper + export par `JwtAuthGuard` (idéalement rôle admin) | CRITIQUE | `scraper.controller.ts`, `export.controller.ts` |
| 4 | Supprimer le fallback JWT (`getOrThrow`) + documenter `.env.example` | CRITIQUE | `auth.module.ts:17`, `jwt.strategy.ts:11` |
| 5 | Traiter le keystore comme compromis (rotation + retrait des secrets trackés) | CRITIQUE | `CLAUDE.md`, `mobile/android/gradle.properties:36-37` |
| 6 | Token mobile dans `expo-secure-store` (déjà installé) au lieu d'AsyncStorage | ÉLEVÉ | `mobile/src/lib/storage.ts:24-26` |

---

## 1. Architecture réelle (corrige le CLAUDE.md, qui est périmé)

Le `CLAUDE.md` racine décrit seulement backend + frontend et ignore l'auth, le mobile et l'ownership. État réel :

- **backend/** — NestJS 10, TypeORM 0.3, PostgreSQL 16. Modules : `places`, `scraper`, `export`, `auth` (JWT), `users`. Préfixe global `/api`, Swagger sur `/docs`.
- **frontend/** — React 18 + Vite + shadcn/ui manuel. App d'**administration** (dashboard, places, scraper, export). **Ne fait aucun appel d'auth.**
- **mobile/** — React Native + Expo. App **grand public** : carte MapLibre avec clustering, recherche, détail, auth JWT, claim + édition d'établissement, i18n fr/en/mg.

**Couplage critique** : l'interface `MedicalEntity` est **dupliquée** dans `frontend/src/lib/api.ts` et `mobile/src/lib/api.ts` (sans package partagé). `TypeBadge` est aussi dupliqué (avec divergences). Tout changement de schéma impose des éditions synchronisées dans **au moins 3 endroits** (entité backend + 2 interfaces front/mobile), sans garde-fou de compilation entre apps.

### Inventaire réel des endpoints

| Méthode | Route (préfixe `/api`) | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | non | **route réelle cassée → `/api/api/auth/register`** (voir B-1) |
| POST | `/api/auth/login` | non | idem, timing-safe (bon) |
| GET | `/api/places` | non | `q, type, city, page, limit` |
| GET | `/api/places/stats` | non | `total, withPhone, withWebsite, withHours, byType` |
| GET | `/api/places/:id` | non | pas de `ParseUUIDPipe` → 500 si UUID invalide |
| POST | `/api/places/:id/claim` | **oui** | non documenté dans CLAUDE.md |
| PATCH | `/api/places/:id` | **oui** | non documenté ; ownership vérifié (pas d'IDOR) |
| GET | `/api/me/places` | **oui** | non documenté |
| POST | `/api/scraper/start` | **non** | **devrait être admin** |
| POST | `/api/scraper/pause` | **non** | **devrait être admin** |
| GET | `/api/scraper/status` | non | `{ job: ScrapeJob \| null }` |
| GET | `/api/scraper/jobs` | non | |
| GET | `/api/export/json` | **non** | **toute la base, sans pagination** |
| GET | `/api/export/csv` | **non** | idem |
| GET | `/docs` | non | Swagger exposé sans condition |

---

## 2. Schéma de données actuel

### `medical_entities` (27 colonnes, 2177 lignes ; 0 claimée, 315 sans nom, 0 sans coords)

PK `id` (uuid), UNIQUE `osm_id`. **Aucun autre index.** Toutes les requêtes filtrées font un `Seq Scan` (confirmé par EXPLAIN). Colonnes clés : `osm_id`, `osm_type`, `name`, `name_mg`, `amenity`, `healthcare`, `health_facility_type`, `lat`, `lng`, `phone`, `website`, `opening_hours`, `addr_{street,housenumber,city,district,province}`, `operator`, `operator_type`, `beds`, `emergency`, `osm_url`, `tags` (jsonb), `owner_id` (varchar libre, **pas de FK**), `scraped_at`, `created_at`, `updated_at`.

### `users` (4 colonnes)

`id` (uuid), `email` (unique), `passwordHash`, `createdAt`. **Note** : `passwordHash` et `createdAt` n'ont pas de `name:` explicite → créées **en camelCase** dans PostgreSQL, brisant la convention snake_case du reste du schéma (`user.entity.ts:7-8`).

### `scrape_jobs` / `scrape_errors`

`scrape_jobs` : `status` varchar sans CHECK constraint. `scrape_errors` : FK `scrape_job_id` → `scrape_jobs` ON DELETE CASCADE (nullable).

---

## 3. Findings par sévérité

### CRITIQUE

**A-1 — `synchronize: true` sans aucune migration versionnée** (`app.module.ts:32`)
En dev, TypeORM applique automatiquement les diffs d'entité, y compris des DROP COLUMN implicites au renommage et des recréations de colonne au changement de type. Sur les 2177 entités, un redémarrage après un changement de type efface la donnée **sans avertissement** (le commentaire « DROP les tables manuellement » dans CLAUDE.md confirme que le risque est connu mais non mitigé). Le dossier `backend/src/migrations/` **n'existe pas**. C'est le prérequis bloquant avant toute réorg.

**B-1 — Double-préfixe `/api/api/auth` (auth mobile cassée)** (`auth.controller.ts:6`)
`@Controller('api/auth')` + `setGlobalPrefix('api')` ⇒ routes réelles `/api/api/auth/register|login`. Le mobile appelle `/api/auth/login` (`mobile/src/lib/api.ts:49-51`) ⇒ **404**. L'auth n'a donc jamais fonctionné bout-en-bout contre le backend lancé. **Vérifié.** Correctif : `@Controller('auth')`.

**S-1 — Secret keystore de prod commité en clair, repo public** (`CLAUDE.md`, `mobile/android/gradle.properties:36-37`)
`MedinaaProd@2026!` présent dans 2 fichiers trackés + historique git (`git grep` confirme). Le `.jks` est bien gitignored, mais le mot de passe est brûlé publiquement de façon permanente. Si le `.jks` fuite, n'importe qui peut signer une APK malveillante acceptée comme mise à jour légitime sur les appareils existants. À considérer comme **compromis** : rotation de clé avant publication store + Play App Signing + retrait des secrets trackés + purge d'historique (ou repo en privé).

**S-2 — Scraper et export ouverts sans auth** (`scraper.controller.ts`, `export.controller.ts`)
N'importe qui peut déclencher/arrêter des jobs et télécharger **toute la base** (incluant `owner_id` → lien établissement/compte). Vecteur de DoS (mémoire/CPU/Overpass) et de fuite. Ajouter `JwtAuthGuard` + à terme un `RolesGuard` admin (le scraper ne doit jamais être accessible aux propriétaires).

**S-3 — Secret JWT avec fallback hardcodé** (`auth.module.ts:17`, `jwt.strategy.ts:11`)
`cfg.get('JWT_SECRET', 'medinaa-secret')`. Absent de `.env.example`. Si non défini en prod, les tokens sont signés avec une valeur publiquement lisible ⇒ forge de JWT pour n'importe quel `sub` ⇒ contournement complet de l'auth. Correctif : `getOrThrow('JWT_SECRET')` + `.env.example`.

### ÉLEVÉ / MAJEUR

**A-2 — `owner_id` n'est pas une FK** (`medical-entity.entity.ts:85`) — varchar libre, intégrité applicative seule, full scan sur `findBy({ ownerId })`. 0 claimée aujourd'hui ⇒ migration triviale vers `uuid` + FK `ON DELETE SET NULL`.

**A-3 — Aucun index sur colonnes filtrées** — `name` (ILIKE), `amenity`, `healthcare`, `addr_city`, `owner_id`. Acceptable à 2177 lignes, rédhibitoire à 50k+.

**A-4 — Redondance `amenity` / `healthcare` / `health_facility_type`** — 68% des entités ont `amenity` ET `healthcare` (ex. `doctors` + `doctor`). Pas de colonne canonique ; l'heuristique `COALESCE(amenity, healthcare, 'autre')` est dupliquée entre `places.service.ts:77-83` et `TypeBadge` (front + mobile).

**A-5 — Double stockage `tags` jsonb + colonnes extraites** — chaque valeur existe en double. Un UPDATE owner met à jour la colonne mais pas `tags`, créant une divergence.

**A-6 — Pas de table `ratings`** — `RatingStars.tsx` existe mais n'a aucune source de données (résidu Google Places). Le guard `if (rating == null) return null` s'active toujours.

**S-4 — Token JWT en clair côté mobile** (`storage.ts:24-26`) — AsyncStorage non chiffré alors qu'`expo-secure-store` est déjà installé. Token valable **30 jours**, rejouable.

**B-2 — `savedNodes` compte les tentatives, pas les succès** (`scraper.service.ts:150-154`) — chiffre trompeur affiché comme « entités sauvegardées ».

**B-3 — Timeout Overpass client 30s vs query 180s** (`overpass.client.ts:136`) — coupe des requêtes Overpass légitimes et bascule en fallback à tort.

**B-4 — Pas de rate-limiting** (`@nestjs/throttler` absent) — brute-force possible sur login/register.

**B-5 — Pas de `ParseUUIDPipe`** (`places.controller.ts:28,37,43`) — UUID invalide ⇒ 500 PostgreSQL au lieu de 400.

**M-1 — La carte ne charge que 500 entités sur 2177** (`MapScreen.tsx:38`) — 1673 jamais affichées. Pas de pagination ni bbox.

**M-2 — Règle des Hooks violée dans MapScreen** (`MapScreen.tsx:25-35`) — return conditionnel web avant des hooks.

**M-3 — `applicationId "com.mobile"` (placeholder Expo)** — à changer avant toute publication (casse les updates ensuite).

**M-4 — EditEntityScreen sans garde ownership côté client** — protection backend seule, UI n'empêche pas l'accès.

**F-1 — Colonnes fantômes Google Places dans l'UI export** (`ExportPage.tsx:99`) — `place_id`, `formatted_address`, `rating`, etc. n'existent plus ⇒ l'UI ment sur le contenu réel.

**F-2 — Footer « Google Places API »** (`Sidebar.tsx:56`) — résidu visible en prod.

**F-3 — Dictionnaires de types incomplets/erronés** (`DashboardPage.tsx:10-17`, `PlacesPage.tsx:11-18`) — clé `health` invalide (aucun tag OSM), filtre les entités `healthcare=*` hors de l'UI.

### MOYEN / MINEUR (extraits)

- CORS/helmet absents (`main.ts`) ; Swagger exposé en prod ; JWT 30j sans révocation.
- `synchronize` piloté par `!== 'production'` (fail-open si `NODE_ENV` mal renseigné) — inverser en `=== 'development'`.
- `osm_url` et `osm_type` calculables depuis `osm_id` (redondants).
- `ScheduleModule` importé sans aucun `@Cron` ; `RegisterDto.entityId` validé mais ignoré (pas de claim à l'inscription).
- `'(Sans nom)'` codé en dur (hors i18n) dans 5 écrans mobiles ; `calcDistance` Haversine dupliquée ; `EntityMapPin` mort.
- `fs.readFileSync` bloquant pour le fallback local (`overpass.client.ts:102`).

---

## 4. Carte de couplage au schéma (pour la réorg)

**Renommer `amenity`/`healthcare` → champ canonique unique** = le changement le plus impactant. Touche : `places.service.ts:77-83` (SQL brut, échoue à l'exécution seulement), `TypeBadge` (front + mobile), `PlaceCard`, `PlaceDetailPage`, `DashboardPage`, `PlacesPage`, et côté mobile `EntityCard`, `EntityDetail`, `ClaimScreen`, `MapScreen`, `SearchScreen`, `HomeScreen` (≈ 7 fichiers mobiles).

**Mutations en écriture (risque élevé)** : `EditEntityScreen` n'envoie que `{ phone, openingHours, website }`. Un renommage de `opening_hours` casse ce PATCH **silencieusement** (backend ignore le champ inconnu via `whitelist`).

**Le plus sûr** : `parseElement` (`scraper.service.ts`) et les DTO sont typés `Partial<MedicalEntity>` ⇒ le compilateur TS détecte les renommages. Le SQL brut de stats et le QueryBuilder (`e.addr_city`) sont les seuls points non type-safe côté backend.

**Recovery des données** : `backend/data/` est gitignored ⇒ `osm_medical_madagascar.json` (2177 entités) n'est **pas** dans le repo, c'est une ressource locale. En cas de perte : DROP tables + redémarrage backend + `POST /api/scraper/start` (fallback local) recharge tout en quelques secondes.

---

## 5. Recommandations pour la réorganisation du schéma

Détail complet et plan d'exécution dans [`../context/reorg-schema-plan.md`](../context/reorg-schema-plan.md). En résumé, par priorité :

1. **Migrations d'abord** : `synchronize: false`, créer `backend/src/migrations/`, générer la migration initiale (snapshot de l'existant) **avant** tout changement.
2. **`owner_id` → `uuid` + FK** vers `users(id)` `ON DELETE SET NULL`.
3. **Index** sur `amenity`, `healthcare`, `addr_city`, `owner_id`, `(lat,lng)`, et GIN full-text sur `name`.
4. **Colonne `type_canonical`** (ou colonne générée) pour résoudre `amenity`/`healthcare` une seule fois en base.
5. **Table `claims`** (statut + historique + validation admin), `owner_id` devenant un cache.
6. **Table `ratings`** (score 1-5, unique `(entity_id, user_id)`) + `rating_avg`/`rating_count` pour brancher `RatingStars`.
7. **Table `entity_addresses`** (extraction des `addr_*`).
8. **Corriger `users`** en snake_case (`password_hash`, `created_at`).
9. **Décider du sort de `tags`** (supprimer, ou figer en lecture seule) + supprimer `osm_url`.

**Stratégie sans perte** : tester chaque migration sur copie ; pour les changements de type, passer par colonne temporaire + copie + renommage ; garder `osm_medical_madagascar.json` comme source de reconstruction.

---

## Annexe — IDs des agents d'audit (session du 13/06/2026)

Data/schéma `a5e0bf31717df0446` · Backend `abeb6b999d2726c9c` · Frontend `a40e5eb71266d4d87` · Mobile `aaefa66c45ce57825` · Sécurité `a40acf8feb486d5d4`.
