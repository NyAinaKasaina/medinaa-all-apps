# État du projet Medinaa — source de vérité

> Dernière mise à jour : 2026-06-13 (après audit complet). Ce fichier prime sur le `CLAUDE.md` racine quand ils divergent.

## Vue d'ensemble

Monorepo fullstack, 3 applications, branche de travail `rahmicka`, branche principale `main`. Données : entités médicales de Madagascar depuis OpenStreetMap (Overpass), avec ownership (propriétaires qui revendiquent et éditent leur fiche).

```
medinaa-all-apps/
  backend/    NestJS 10 + TypeORM 0.3 + PostgreSQL 16   (port 3000, /api, Swagger /docs)
  frontend/   React 18 + Vite + shadcn/ui manuel        (port 5173) — app ADMIN
  mobile/     React Native + Expo + MapLibre            (Metro 8081) — app GRAND PUBLIC
  docs/       contexte vivant + audits + plans
```

Lancer le tout : `npm run dev` à la racine (concurrently). Détails dans `CLAUDE.md` racine.

## Rôle réel de chaque app

- **frontend (admin)** : dashboard de stats, liste/détail des entités, pilotage du scraper, export JSON/CSV. **Ne fait aucun appel d'authentification** (pas de login dans l'admin).
- **mobile (public)** : carte MapLibre avec clustering, recherche, détail d'entité, **auth JWT** (register/login), **claim** + **édition** de sa fiche, i18n fr/en/mg.

## Modules backend

`places` (CRUD + stats), `scraper` (collecte Overpass + fallback local + jobs), `export` (JSON/CSV), `auth` (JWT register/login), `users`.

## Endpoints réels (préfixe global `/api`)

Voir l'inventaire complet et vérifié dans [`../audit/2026-06-13-audit-complet.md`](../audit/2026-06-13-audit-complet.md) §1. Points à retenir :

- `POST /api/places/:id/claim`, `PATCH /api/places/:id`, `GET /api/me/places` existent (JWT requis) mais **ne sont pas documentés** dans le CLAUDE.md racine.
- `scraper/*` et `export/*` sont **publics** aujourd'hui (à protéger, voir dette).
- **Bug actif non corrigé** : `auth.controller.ts` déclare `@Controller('api/auth')` alors que le préfixe global est déjà `api` ⇒ routes réelles `/api/api/auth/*`. Le mobile appelle `/api/auth/*` ⇒ login/register en 404. À corriger en `@Controller('auth')`.

## Schéma PostgreSQL actuel

10 tables. Réorg du 2026-06-13 (phase 1) : ajout d'une taxonomie médicale et d'une hiérarchie géographique.

- **`medical_entities`** (2177 lignes) : colonnes OSM d'origine (legacy, lecture seule) + colonnes réorg : `type_slug` FK→medical_types (NULL = à classifier), `category_slug` FK→medical_categories (dénormalisé), `classification_status` (`osm_auto`/`verified`/`unverified`), `region_id`/`district_id`/`commune_id`/`fokontany_id` (FK géo, NULL pour l'instant). Index sur type/category/region/district/(lat,lng) + index partiel `unverified`. `owner_id` reste varchar (pas encore FK, voir dette A-2).
- **Taxonomie** : `medical_categories` (6) + `medical_types` (25), libellés fr/mg/en. Slugs des catégories : urgences_secours, soins_proximite, soins_specialises, maternite_enfance, produits_sante, diagnostic_analyse.
- **Géographie** : `regions` (24, seedées), `districts` (114, seedés — liste à compléter vs INSTAT), `communes` + `fokontany` (tables créées, **non seedées** — phase 2).
- **Classification actuelle** : ~656 entités `osm_auto`, ~1521 `unverified` (à curer par admin + propriétaires).
- `users` : `passwordHash`/`createdAt` toujours en camelCase en base (anomalie, voir dette).
- Pas encore de table `ratings`/`claims` (séparé de la réorg, voir dette).

Détail colonne par colonne : audit §2.

## Conventions techniques

- **TypeORM** : colonnes en `snake_case` via `name:` explicite (sauf l'anomalie `users`). `synchronize: **false**` (depuis la réorg du 2026-06-13) — le schéma est géré par les scripts SQL.
- **Migrations** : scripts SQL idempotents dans `backend/src/migrations/` (`001`-`004` appliqués, voir le README du dossier). Pas encore de migrations TypeORM générées (CREATEDB requis).
- **Endpoints réorg** : `GET /api/taxonomy` (arbre cat+types), `/api/taxonomy/types`, `/api/regions`, `/api/regions/:id/districts`. `/api/places` accepte `category`, `type` (slug + repli OSM), `regionId`, `districtId`, `status`. `/api/places/stats` renvoie `byCategory`, `byType`, `unverified`.
- **Types partagés** : aucun. `MedicalEntity` est dupliqué (backend entity / `frontend/src/lib/api.ts` / `mobile/src/lib/api.ts`). `TypeBadge` dupliqué front/mobile avec divergences.
- **Auth** : JWT 30j, bcrypt(10), login timing-safe, `passwordHash` en `select:false`. Secret JWT avec fallback hardcodé `medinaa-secret` (à supprimer).
- **Frontend** : TanStack Query v5 (query keys descriptives, polling conditionnel), proxy Vite `/api` → `:3000`.
- **Mobile** : token dans AsyncStorage (à migrer vers `expo-secure-store`, déjà installé). Base URL `EXPO_PUBLIC_API_URL ?? http://localhost:3000`.

## Données et recovery

- `backend/data/` est **gitignored** : le fichier de fallback `osm_medical_madagascar.json` (2177 entités) n'est **pas** dans le repo, c'est une ressource locale.
- Overpass (`overpass-api.de`) est souvent bloqué sur la machine de dev → fallback local automatique.
- **Reconstruction des données** : DROP des tables + redémarrage backend (TypeORM recrée le schéma en dev) + `POST /api/scraper/start` (charge le fallback local) ⇒ 2177 entités rechargées en quelques secondes. Idempotent par `osm_id`, et l'upsert **préserve `owner_id`** (les claims survivent à un re-scrape).

## Build mobile

Builds APK locaux dans `mobile/releases/` via `npm run build:release*` (voir CLAUDE.md racine). Keystore `mobile/android/app/medinaa-release.jks` (gitignored). **Attention sécurité** : `applicationId` = placeholder `com.mobile` (à personnaliser avant publication), et le mot de passe keystore est actuellement exposé en clair (voir dette S-1).
