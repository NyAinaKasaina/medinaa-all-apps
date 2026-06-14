# Dette technique et risques — backlog priorisé

> Issu de l'audit du 2026-06-13. Cocher en fermant un point, ajouter les nouveaux en bas. Référence des preuves : [`../audit/2026-06-13-audit-complet.md`](../audit/2026-06-13-audit-complet.md).

Légende sévérité : 🔴 CRITIQUE · 🟠 ÉLEVÉ/MAJEUR · 🟡 MOYEN · ⚪ MINEUR

## À faire AVANT la réorganisation du schéma

- [x] 🔴 **A-1** Filet migrations + bascule (2026-06-13) : backups pg_dump + fallback régénéré, `synchronize: false`, schéma géré par scripts SQL idempotents `001`-`004`. **Reste (optionnel)** : générer des migrations TypeORM formelles (CREATEDB requis).
- [x] 🔴 **B-1** Corriger le double-préfixe auth (2026-06-13) : `@Controller('auth')`. Vérifié : `/api/auth/login` répond, `/api/api/auth/login` est 404.
- [x] 🟡 Inverser la garde `synchronize` en `=== 'development'` (2026-06-13). `app.module.ts`

## Sécurité (avant mise à l'échelle / publication)

- [x] 🔴 **S-1** Keystore rotaté (2026-06-13) : secrets retirés de `CLAUDE.md` et `gradle.properties`, nouveau keystore généré, secrets dans `mobile/android/keystore.properties` (gitignored), `build.gradle` adapté. **Reste (optionnel)** : Play App Signing, purge de l'historique git (ancien mot de passe désormais inoffensif car le keystore ne signe plus rien).
- [ ] 🔴 **S-2** Protéger `scraper/*` et `export/*` par `JwtAuthGuard` (idéalement `RolesGuard` admin). Aujourd'hui : DoS + dump complet de la base anonyme. **Attention** : le frontend admin n'a aucune auth, ajouter un guard le casserait — nécessite d'abord une auth admin.
- [x] 🔴 **S-3** Fallback JWT supprimé (2026-06-13) : `getOrThrow('JWT_SECRET')` dans les deux fichiers, `JWT_SECRET` fort dans `.env` + placeholder dans `.env.example`.
- [ ] 🟠 **S-4** Token mobile dans `expo-secure-store` (déjà installé) au lieu d'AsyncStorage. `storage.ts:24-26`
- [ ] 🟡 CORS allowlist + `helmet()` + conditionner Swagger sur `NODE_ENV !== 'production'`. `main.ts`
- [ ] 🟡 Ajouter `@nestjs/throttler` (rate-limit sur login/register). `auth.controller.ts`
- [ ] 🟡 Réduire la durée du JWT (30j → court) + mécanisme de révocation (`tokenVersion`). `auth.module.ts:18`
- [ ] ⚪ Politique de mot de passe (complexité) dans `RegisterDto`. `register.dto.ts:5`
- [ ] ⚪ `ownerId` exposé dans l'export JSON public. `export.service.ts:29`

## Schéma de données (cadré par reorg-schema-plan.md)

- [ ] 🟠 **A-2** `owner_id` varchar → `uuid` + FK `users(id)` ON DELETE SET NULL. `medical-entity.entity.ts:85`
- [~] 🟠 **A-3** Index ajoutés (réorg 2026-06-13) : `type_slug`, `category_slug`, `region_id`, `district_id`, `(lat,lng)`, partiel `unverified`. **Reste** : GIN full-text sur `name`, index `owner_id`.
- [x] 🟠 **A-4** Résolu autrement (réorg 2026-06-13) : taxonomie `type_slug`/`category_slug` (tables de référence) remplace `COALESCE(amenity, healthcare)`. Colonnes OSM conservées en repli.
- [ ] 🟠 **A-6** Table `ratings` + `rating_avg`/`rating_count` (brancher `RatingStars`).
- [ ] 🟡 Table `claims` (statut + historique + validation admin).
- [ ] 🟡 Table `entity_addresses` (extraction `addr_*`).
- [ ] 🟡 Corriger `users` en snake_case (`password_hash`, `created_at`). `user.entity.ts:7-8`
- [ ] 🟡 **A-5** Décider du sort de `tags` jsonb (supprimer ou figer read-only) + supprimer `osm_url`/`osm_type` (calculables depuis `osm_id`).

## Backend (qualité / robustesse)

- [ ] 🟠 **B-2** `savedNodes` doit compter les succès, pas les tentatives. `scraper.service.ts:150-154`
- [ ] 🟠 **B-3** Aligner le timeout client Overpass (30s) sur la query (180s). `overpass.client.ts:136`
- [ ] 🟠 **B-5** `ParseUUIDPipe` sur les `@Param('id')`. `places.controller.ts:28,37,43`
- [ ] ⚪ Lecture du fallback en `fs.promises.readFile`. `overpass.client.ts:102`
- [ ] ⚪ Retirer `ScheduleModule` (aucun `@Cron`) ou l'utiliser. `app.module.ts:37`
- [ ] ⚪ `RegisterDto.entityId` validé mais ignoré : implémenter le claim à l'inscription ou retirer le champ.
- [ ] ⚪ Corriger le summary Swagger « scrape Google Places ». `scraper.controller.ts:11`

## Frontend (admin)

- [ ] 🟠 **F-1** Remplacer les colonnes fantômes Google Places par les vrais champs OSM. `ExportPage.tsx:99`
- [x] 🟠 **F-3** Corrigé (réorg 2026-06-13) : filtres pilotés par la taxonomie (catégories + région/district), dashboard par catégorie. Clé `health` invalide supprimée.
- [ ] ⚪ **F-2** Retirer le footer « Google Places API ». `Sidebar.tsx:56`
- [ ] ⚪ `onError` sur les mutations scraper ; `aria-label` sur le bouton clear ; activer `noUnusedLocals`. 

## Mobile (public)

- [ ] 🟠 **M-1** La carte ne charge que 500/2177 entités. Charger tout ou endpoint geojson + bbox. `MapScreen.tsx:38`
- [ ] 🟠 **M-2** Sortir les hooks du return conditionnel web. `MapScreen.tsx:25-35`
- [ ] 🟠 **M-3** Personnaliser `applicationId`/`namespace` (`com.mobile` → `com.medinaa.app`) avant publication. `mobile/android/app/build.gradle`
- [ ] 🟠 **M-4** Garde ownership côté client dans `EditEntityScreen`.
- [ ] 🟡 Gérer l'expiration du token (intercepteur 401 → logout). `api.ts`, `AuthContext.tsx`
- [ ] 🟡 Compléter `app.json` (bundleIdentifier, package, permissions, plugins, scheme).
- [ ] ⚪ Extraire `calcDistance` dans `lib/geo.ts` ; i18n pour `'(Sans nom)'` ; supprimer `EntityMapPin` mort ; pagination `SearchScreen`.

## Transverse

- [ ] 🟡 Mettre en place des **types partagés** (`packages/types` ou génération depuis OpenAPI) pour `MedicalEntity` et `TypeBadge`, afin d'éliminer la triple duplication.
- [ ] 🟡 Mettre le `CLAUDE.md` racine à jour (auth, mobile, claim, endpoints) — actuellement périmé.
