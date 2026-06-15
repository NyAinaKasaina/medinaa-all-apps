# Migrations

Dossier des migrations versionnées (`synchronize: false` dans `app.module.ts`).

## Scripts SQL de la réorg (appliqués le 2026-06-13)

Scripts idempotents, à rejouer dans l'ordre via `psql -v ON_ERROR_STOP=1 -f <fichier>` (faire un `pg_dump` avant) :

1. `001_taxonomy_geo_schema.sql` — tables `medical_categories`, `medical_types`, `regions`, `districts`, `communes`, `fokontany` + colonnes/index/FK sur `medical_entities`.
2. `002_seed_taxonomy.sql` — 6 catégories + 25 types (UPSERT).
3. `003_seed_regions_districts.sql` — 24 régions + 114 districts (UPSERT ; liste districts à compléter vs INSTAT).
4. `004_map_osm_to_types.sql` — reclassement OSM→type des types non ambigus (ne touche que les lignes `unverified`).
5. `005_geo_align_datapersonne.sql` — **réalignement géo (phase 2)** : remplace les 4 tables normalisées par la table `fokontany` dénormalisée (codes officiels INSTAT) + colonnes `code_*` sur medical_entities. Suivi de la copie des 19 336 fokontany et du géocodage : voir `backend/scripts/README-geo.md`.

Pour réappliquer à neuf : restaurer un backup puis rejouer 001→004.

---

## Migrations TypeORM (non encore mises en place)

## État (2026-06-13, étape 0 de la réorg)

Le filet de sécurité est en place :

- Sauvegardes complètes de la base dans `backend/data/` (gitignored) :
  - `backup-medinaa-AAAAMMJJ.sql` — schéma + données (`pg_dump` complet, restaurable par `psql`)
  - `schema-medinaa-AAAAMMJJ.sql` — schéma seul (baseline DDL de référence)
  - `osm_medical_madagascar.json` — fallback régénéré depuis la base (2177 entités, rechargeable via `POST /api/scraper/start`)
- `synchronize` est désormais en mode fail-safe (`=== 'development'`) dans `app.module.ts`.

## Générer la migration initiale (à faire au démarrage de la réorg)

`migration:generate` compare les entités à une base. Comme la base de dev a déjà le schéma (créé par `synchronize`), il faut générer contre une base **vide** :

```bash
# 1. Créer une base vide temporaire (nécessite le droit CREATEDB sur l'utilisateur medinaa)
#    sudo -u postgres psql -c "ALTER USER medinaa CREATEDB;"   # si besoin
createdb -h localhost -U medinaa medinaa_migbase

# 2. Générer la migration initiale contre la base vide
cd backend
DB_NAME=medinaa_migbase npm run migration:generate

# 3. Supprimer la base temporaire
dropdb -h localhost -U medinaa medinaa_migbase
```

Sur la base de dev existante (déjà au schéma), marquer cette migration comme appliquée pour éviter un `CREATE TABLE` en double, puis passer `synchronize` à `false` partout. Détails dans `docs/context/reorg-schema-plan.md` (étape 0).

## Workflow courant (après la bascule)

```bash
cd backend
npm run migration:generate   # génère depuis les entités modifiées
npm run migration:run        # applique
npm run migration:revert     # annule la dernière
```

## Restauration d'urgence

```bash
# Restauration complète depuis le dump
PGPASSWORD=medinaa psql -h localhost -U medinaa -d medinaa -f backend/data/backup-medinaa-AAAAMMJJ.sql

# OU reconstruction depuis le fallback (DROP tables + redémarrage backend + POST /api/scraper/start)
```
