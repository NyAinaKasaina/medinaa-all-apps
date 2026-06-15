# Medinaa — Contexte projet pour Claude

## Vue d'ensemble

Application fullstack pour collecter, stocker et consulter toutes les entités médicales à Madagascar (hôpitaux, pharmacies, médecins, dispensaires, CSB, etc.) depuis les données OpenStreetMap.

**Source de données** : OpenStreetMap via Overpass API (gratuit, sans clé). Fallback automatique sur `backend/data/osm_medical_madagascar.json` si l'API est inaccessible.

---

## Lancer le projet (dev complet)

```bash
# Depuis la racine /medinaa — lance les 3 apps en parallèle
npm run dev
```

| Stream | App | Port | Hot reload |
|---|---|---|---|
| cyan  | Backend NestJS | 3000 | `ts-jest` watch |
| magenta | Frontend Vite | 5173 | HMR |
| yellow | Mobile Expo Metro | 8081 | Fast Refresh |

Commandes individuelles si besoin :
```bash
npm run dev:backend    # NestJS seul
npm run dev:frontend   # Vite seul
npm run dev:mobile     # Expo Metro seul
```

Prérequis : `npm install` à la racine (installe `concurrently`). PostgreSQL doit tourner (`medinaa` DB).

---

## Structure du dépôt

```
medinaa/
  backend/     ← NestJS 10 + TypeORM + PostgreSQL
  frontend/    ← React 18 + Vite + shadcn/ui
  CLAUDE.md
  .gitignore
```

---

## Backend (`backend/`)

### Stack
- **NestJS 10**, **TypeORM 0.3.x**, **PostgreSQL 16**
- TypeScript strict, `experimentalDecorators`, `emitDecoratorMetadata`
- `synchronize: true` en dev (désactiver en prod, utiliser les migrations)

### Lancer
```bash
cd backend
npm run start:dev   # port 3000, hot-reload
```

### Config (`backend/.env`)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=medinaa
DB_PASSWORD=medinaa
DB_NAME=medinaa
NODE_ENV=development
PORT=3000
```
Pas de clé API requise — données OSM/Overpass libres.

### Modules

| Module | Route base | Rôle |
|--------|-----------|------|
| `PlacesModule` | `/api/places` | CRUD + stats des entités médicales |
| `ScraperModule` | `/api/scraper` | Collecte Overpass + import fichier local |
| `ExportModule` | `/api/export` | Téléchargement JSON / CSV |

### Endpoints

```
GET  /api/places              ?q= &type= &city= &page= &limit=
GET  /api/places/stats        total, withPhone, withWebsite, withHours, byType
GET  /api/places/:id
POST /api/scraper/start       lance un job (fallback local si Overpass bloqué)
POST /api/scraper/pause
GET  /api/scraper/status      { job: ScrapeJob | null }
GET  /api/scraper/jobs
GET  /api/export/json
GET  /api/export/csv
GET  /docs                    Swagger UI
```

### Schéma PostgreSQL

**`medical_entities`**
| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `osm_id` | VARCHAR UNIQUE | ex: `node/590656559` |
| `osm_type` | VARCHAR | node / way / relation |
| `name` | VARCHAR | nullable (~10% sans nom) |
| `name_mg` | VARCHAR | nom en malgache |
| `amenity` | VARCHAR | hospital, pharmacy, clinic, doctors, dentist, health_post… |
| `healthcare` | VARCHAR | doctor, nurse, pharmacy, hospital… (tag OSM alternatif) |
| `health_facility_type` | VARCHAR | |
| `lat` / `lng` | DOUBLE PRECISION | |
| `phone` | VARCHAR | |
| `website` | VARCHAR | |
| `opening_hours` | VARCHAR | format OSM: `Mo-Fr 08:00-18:00` |
| `addr_street/housenumber/city/district/province` | VARCHAR | |
| `operator` | VARCHAR | |
| `operator_type` | VARCHAR | |
| `beds` | INT | nombre de lits |
| `emergency` | BOOLEAN | |
| `osm_url` | VARCHAR | lien direct OSM |
| `tags` | JSONB | tous les tags bruts OSM |
| `scraped_at` | TIMESTAMP | |
| `created_at / updated_at` | TIMESTAMP | auto TypeORM |

**`scrape_jobs`**
| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `status` | VARCHAR | pending / running / paused / done / failed |
| `total_nodes` | INT | éléments reçus d'Overpass |
| `saved_nodes` | INT | entités sauvegardées en DB |
| `started_at / last_updated_at` | TIMESTAMP | |

**`scrape_errors`** — erreurs par job (FK → scrape_jobs CASCADE).

### Logique scraper (`ScraperService`)

1. `POST /api/scraper/start` → crée un `ScrapeJob` RUNNING
2. `OverpassClient.fetchAll()` :
   - Essaie Overpass API (`https://overpass-api.de/api/interpreter`)
   - Si bloqué / timeout → charge `backend/data/osm_medical_madagascar.json` (2 173 entités)
3. Parse chaque `OsmElement` → `Partial<MedicalEntity>` via `parseElement()`
4. Upsert par batches de 100 (`BATCH_SIZE`)
5. Supporte la pause entre batches (`shouldPause` flag en mémoire)
6. Si le serveur redémarre avec un job RUNNING → le remet à PAUSED automatiquement (`OnApplicationBootstrap`)

### Migrations (production)
```bash
npm run migration:generate   # génère depuis data-source.ts
npm run migration:run
npm run migration:revert
```

---

## Frontend (`frontend/`)

### Stack
- **React 18**, **Vite 5**, **TypeScript**
- **shadcn/ui** (composants écrits manuellement, pas via CLI)
- **TailwindCSS 3** — couleur principale `emerald-600 (#059669)`, font `Figtree`
- **React Router v6** (`createBrowserRouter`)
- **TanStack Query v5** (cache, polling, mutations)

### Lancer
```bash
cd frontend
npm run dev   # port 5173
```

Le proxy Vite redirige `/api/*` → `http://localhost:3000`.

### Pages

| Page | Route | Fonctionnalités |
|------|-------|-----------------|
| Tableau de bord | `/` | 4 stat cards, barres byType, statut dernier scrape |
| Entités médicales | `/places` | Recherche live (debounce 350ms), filtres type, pagination |
| Détail entité | `/places/:id` | Adresse, tél, horaires, lien OSM, coordonnées |
| Scraper | `/scraper` | Start/Pause, barre de progression, polling 2s, historique |
| Export | `/export` | Téléchargement JSON + CSV |

### Layout
- **Mobile** : header fixe + bottom tab bar (4 tabs)
- **Desktop** : sidebar gauche 256px + contenu scrollable

### Composants UI (`src/components/ui/`)
Tous écrits manuellement (shadcn-style) : `Button`, `Card`, `Badge`, `Input`, `Progress`, `Skeleton`, `Separator`. Pas de `components.json`, pas de CLI shadcn.

### Types OSM dans le frontend

`TypeBadge` reconnaît : `hospital`, `pharmacy`, `clinic`, `doctors`, `dentist`, `health_post`, `dispensary`, `nursing_home`, `laboratory`, `doctor`, `nurse`, `physiotherapist`, `midwife`, `community_health_worker`, `birthing_centre`.

---

## Données OSM

### Fichier local (`backend/data/osm_medical_madagascar.json`)
- **2 173 entités** médicales à Madagascar
- Collecté via Overpass API (requête bbox `(-25.6,43.2,-11.9,50.5)`)
- Format processed (champs extraits + `raw_tags`)
- Utilisé en fallback si `overpass-api.de` est inaccessible depuis la machine

### Requête Overpass (`backend/src/common/config/scraper.config.ts`)
Couvre `amenity` (hospital, clinic, pharmacy, doctors, dentist, health_post…) + `healthcare` (tous types) sur toute la bbox Madagascar. Timeout 180s.

---

## Points d'attention

- **overpass-api.de bloqué** sur la machine de dev → le fallback local est automatique, pas d'action requise
- **`synchronize: true`** en dev : TypeORM recrée les tables au démarrage si le schéma change. Bien penser à DROP les tables manuellement si on change un type de colonne (ex: passage `place_id` → `osm_id`)
- **Le fichier `.env` ne doit pas être commité** (dans `.gitignore`)
- **`scraper/status`** retourne `{ job: ScrapeJob | null }` (pas directement `null` — NestJS sérialise `null` en corps vide)
- Les **entités sans nom** (~236 sur 2173) affichent `(Sans nom)` dans l'UI

---

## Commandes utiles

```bash
# Créer la DB PostgreSQL
sudo -u postgres psql -c "CREATE USER medinaa WITH PASSWORD 'medinaa';"
sudo -u postgres psql -c "CREATE DATABASE medinaa OWNER medinaa;"

# Vérifier la DB
PGPASSWORD=medinaa psql -h localhost -U medinaa -d medinaa -c "\dt"

# Nettoyer les jobs/erreurs
PGPASSWORD=medinaa psql -h localhost -U medinaa -d medinaa -c "TRUNCATE scrape_jobs, scrape_errors CASCADE;"

# Reset complet du schéma (si changement d'entité)
PGPASSWORD=medinaa psql -h localhost -U medinaa -d medinaa -c "
DROP TABLE IF EXISTS scrape_errors, scrape_jobs, medical_entities CASCADE;
"
# Puis relancer le backend → TypeORM recrée tout

# Lancer les deux serveurs
cd backend && npm run start:dev &
cd frontend && npm run dev
```

---

## Git

```
Remote : git@github.com:NyAinaKasaina/medinaa-all-apps.git
Branche principale : main
```

### Historique
- `26398ef` — initialisation fullstack (NestJS + React + shadcn/ui)
- `55e32d8` — migration Google Places → OpenStreetMap / Overpass
- `20414aa` — fallback fichier local si Overpass inaccessible

---

## Mobile — Builds locaux APK

### Dossier `mobile/releases/`

Tous les APKs de release locaux sont déposés dans `mobile/releases/`.  
Format du nom : `medinaa-v<version>-<arch>-<YYYYMMDD>.apk`  
Les fichiers `.apk` sont exclus du git (`.gitignore`), le dossier est tracké via `.gitkeep`.

### Script de build

**Commandes npm (depuis `mobile/`) :**
```bash
npm run build:release          # arm64-v8a (défaut)
npm run build:release:arm64    # arm64-v8a explicite
npm run build:release:armv7    # armeabi-v7a (anciens appareils)
npm run build:release:fat      # arm64-v8a + armeabi-v7a (APK universel)
```

**Directement (depuis `mobile/`) :**
```bash
bash scripts/build-release.sh
bash scripts/build-release.sh --arch arm64-v8a
bash scripts/build-release.sh --arch armeabi-v7a
bash scripts/build-release.sh --arch "arm64-v8a,armeabi-v7a"
```

Le script lit la version depuis `app.json`, build avec Gradle, puis copie automatiquement l'APK signé dans `mobile/releases/`.

### Keystore de release

| Champ | Valeur |
|---|---|
| Fichier | `mobile/android/app/medinaa-release.jks` (gitignored) |
| Alias | `medinaa` |
| Password | dans `mobile/android/keystore.properties` (gitignored) + gestionnaire de mots de passe |
| Validité | 10 000 jours (~2053), RSA 2048 bits |
| SHA-256 cert | `9E:51:10:D0:66:3F:8A:18:E7:68:3F:FD:5B:39:6A:50:F8:F4:CA:0E:5B:00:1C:55:49:69:25:30:C7:1F:5B:B5` |

> Keystore régénéré le 2026-06-13 (rotation après exposition de l'ancien mot de passe dans le repo public). Le `.jks` et `keystore.properties` sont exclus du git. Les secrets de signature vivent dans `mobile/android/keystore.properties` (format dans `keystore.properties.example`). Sans le `.jks` + son mot de passe, impossible de mettre à jour l'app sur les appareils existants : à conserver dans un gestionnaire de mots de passe.

### Prérequis
- Java 17+, `ANDROID_HOME` défini, NDK 27.1.12297006 installé
- `mobile/node_modules/` présent (`npm install` depuis `mobile/`)
- Keystore présent dans `mobile/android/app/medinaa-release.jks`
