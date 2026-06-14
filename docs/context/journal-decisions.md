# Journal des décisions et leçons

> ADR léger. Une entrée par décision structurante ou erreur évitée, la plus récente en haut. Objectif : que Claude (et l'équipe) apprenne des choix passés et ne repose pas deux fois la même question.

Format : `## YYYY-MM-DD — Titre` · **Contexte** / **Décision** / **Conséquences** / **Leçon**.

---

## 2026-06-14 — Data cleaning : classification étendue + bilan enrichissement

**Classification étendue (gratuit, migration `007`).** Reclassement des `unverified` depuis les tags OSM, plus large que le 1er pass (j'avais été trop prudent) : `doctors`/`doctor`→cabinet_medical_general, `health_post`(+nurse)→CSB1 / (+doctor)→CSB2, `nurse`→soins_infirmiers, `hospital`→**CHD (défaut documenté, CHU à reclasser)**. Résultat : **Classifiées 30% → 89%** (osm_auto 656→1942, à classifier 1521→**235**). Restent indéterminés : `clinic` (pas d'équivalent propre dans la taxo), tags génériques (`yes`, `health_facility`, `alternative`…). Statut `osm_auto` = auto, à vérifier (dashboard Qualité distingue Vérifié/Auto).

**`--nameless` abandonné.** Pilote 1/25 (Google ne couvre pas les zones des 315 sans nom). Les noms manquants viendront du claim par les propriétaires.

**Purge hors-Madagascar (migration `008`).** Le scrape OSM (bbox) avait capté **136 entités de Mayotte/Comores** (noms comoriens/mahorais, toutes code_faritra NULL = hors territoire). Supprimées via boîtes géographiques explicites (backup pré-purge fait). Effet : **total 2177 → 2041, géolocalisation 94% → 100%** (les 136 étaient tout le « sans région »).

**Site web (Google, ~12 $).** `scripts/google-website.cjs` : Place Details (champ website) pour les entités appariées → **72 sites comblés** (31 → ~103 avant purge, 82 après).

**Extension taxonomie (migration `009`).** Les 212 restants venaient d'un trou de taxo (pas de type « clinique ») + de tags OSM génériques. Ajout de 3 types (soins_proximite) : `clinique_polyclinique`, `maison_repos`, `medecine_traditionnelle`, puis mapping (clinic→clinique 110, nursing_home→maison_repos 15, alternative→medecine_traditionnelle 7). Classifiées **90% → 96%** (unverified 212→**80**). Le frontend lit la taxo en direct (/api/taxonomy) → nouveaux types visibles sans recompiler. **Reste 80 irréductibles** : `healthcare=yes` (50), `health_facility` (20), `counselling` (7)… = tags OSM sans info de type → seuls les propriétaires les qualifieront.

**Bilan qualité (denominateur 2041, vs début de session à 2177).** Classifiées 30%→**96%** · Géolocalisées 94%→**100%** · Téléphone 7%→**17%** · Horaires 5%→**13%** · Site web 1%→**4%** · Nom **86%**. Plafonds atteints : tél/horaires/site = couverture Google ; commune/fokontany = matching par nom ; noms manquants + 80 non classés → claim propriétaires.

---

## 2026-06-14 — Enrichissement Google (bootstrap nom/tel/horaires)

**Contexte.** Combler les gros trous de contact (149/2177 tél) depuis Google Places, en bootstrap ponctuel ; ensuite les propriétaires (comptes à venir) maintiendront la donnée. Champs voulus par Mickael : **nom, téléphone, horaires uniquement**.

**Approche.** Script `backend/scripts/google-enrich.cjs` (clé `GOOGLE_MAPS_API_KEY` dans `.env`). Pour chaque entité nommée : **Nearby Search par rayon strict + mot-clé (nom)** puis filtre par token distinctif du nom (précision), puis Place Details (name, formatted_phone_number, opening_hours). **Comble uniquement les champs vides** (jamais d'écrasement). Stockage durable limité au `google_place_id` (+ `google_enriched_at`), conforme ToS ; nom/tel/horaires transitoires puis owner-maintained. Migration `006`.

**Pilotes (2026-06-14).** Premier jet `Find Place` : appariement bruité (faux homonymes lointains). Passage en Nearby+rayon+filtre de nom → net mieux. Pilote ciblé Analamanga (urbain) : **17/25 appariés, 15 tél + 11 horaires comblés** (~60%/44%). Rural : rendement plus faible (Google peu fourni hors villes). Décision : run complet pertinent (rendement variable selon zone).

**À retenir.** Google couvre bien le médical urbain (Antananarivo), peu le rural. Ne pas étendre aux notes/avis/photos (ToS). Les ~315 entités sans nom ne sont pas recherchables par texte (option `--nameless` = nearby, faible confiance).

---

## 2026-06-14 — Onglet « Qualité des données » (data cleaning)

**Contexte.** Entrée en phase de data cleaning : besoin d'un tableau de bord visualisant la pertinence/complétude des entités (classifiées ou pas, géolocalisées ou pas). App web admin uniquement.

**Réalisé.**
- **Backend** : `stats` enrichi de `byStatus` (verified/osm_auto/unverified), `geo` (complétude faritra/distrika/kaominina/fokontany) et `withName`. `query-places` : param `geo=located|missing` (a une région / sans région).
- **Frontend** : nouvelle page `DataQualityPage` (`/quality`, onglet « Qualité » dans sidebar + bottom nav) : 2 scores en-tête (% classifiées, % géolocalisées), carte Classification (barres cliquables → liste filtrée), entonnoir Géolocalisation (région→district→commune→fokontany + lien « sans région »), complétude des champs. PlacesPage : filtre `geo` (Géolocalisé / Sans région) lu aussi depuis l'URL.

**Vérifié.** Builds OK. API : `stats` renvoie byStatus/geo/withName ; `?geo=missing`=136, `?geo=located`=2041.

---

## 2026-06-14 — Adaptation UX de l'app web admin au nouveau schéma

**Contexte.** Le schéma enrichi (taxonomie + géo INSTAT) avait l'intégration fonctionnelle de base ; l'UX ne l'exploitait pas pleinement. Périmètre : **app web admin uniquement** (Kasaina gère le mobile). Affichage + filtres, sans nouvelle auth (l'édition/curation inline du type est reportée car elle nécessite une auth admin).

**Réalisé.**
- **Backend** (read-only) : `places.service.findOne` renvoie `geo: {faritra/distrika/kaominina/fokontany: {code,nom}}` (résolu via la table fokontany au niveau le plus profond) ; `stats` ajoute `byFaritra`. `export.service` CSV enrichi des colonnes taxonomie + géo (le JSON les avait déjà).
- **Frontend** : `lib/geo.ts` (`useFaritraLabel`, `prettyGeo`). PlaceDetailPage : fil d'Ariane administratif faritra›distrika›kaominina›fokontany + libellé catégorie + badge « à classifier », adresse OSM reléguée en secondaire. PlacesPage : filtres type (sous-catégorie), commune, statut (+ init `?status=unverified` depuis l'URL). PlaceCard : région officielle + badge « à classifier ». DashboardPage : carte « Répartition par région » + compteur à classifier cliquable. Nettoyage : footer sidebar et colonnes d'export (résidus « Google Places » supprimés).

**Vérifié.** Builds backend + frontend OK. API : `/places/:id` renvoie `geo`, `/places/stats` renvoie `byFaritra` (23), CSV contient les colonnes taxonomie+géo.

**Reste (itération suivante).** Auth admin + édition/assignation du type depuis le web (curation inline des 1521 `unverified`). Vérif visuelle navigateur non faite ici (build + API validés).

---

## 2026-06-13 — Réorg phase 2 : géographie alignée sur data-personne (codes officiels INSTAT)

**Contexte.** Mickael a pointé le projet `data-personne` comme référence pour la structure géo. Celui-ci utilise la **codification officielle INSTAT** : codes hiérarchiques auto-imbriqués (faritra CHAR(2) < distrika CHAR(4) < kaominina CHAR(6) < fokontany CHAR(8)) dans une table `fokontany` dénormalisée (codes + noms aux 4 niveaux). Sa base `datapersonne` (localhost) contient une référence **complète** : 19 336 fokontany, 1704 communes, 119 districts, 23 régions.

**Décisions (validées).** (1) Remplacer mes 4 tables normalisées à IDs entiers par la table `fokontany` dénormalisée (structure data-personne) + colonnes `code_faritra/distrika/kaominina/fokontany` sur `medical_entities`. (2) Rattachement best-effort : région/district fiable, commune/fokontany au mieux.

**Actions réalisées.**
- **DB** : script `005_geo_align_datapersonne.sql` (drop ancien géo, crée `fokontany` dénormalisée + colonnes codes). Copie des 19 336 fokontany officiels depuis `datapersonne` (`\copy`).
- **Géocodage** : `backend/scripts/geo-enrich.cjs` (point-in-polygon Node, sans PostGIS) contre les limites geoBoundaries (ADM1-4, gitignored dans `backend/data/geo/`), match noms→codes officiels. Couverture : **faritra 94%, distrika 91%, kaominina 63%, fokontany 52%** (2177 entités). Ajustements : alias « Matsiatra Ambony »→Haute Matsiatra, arrondissements d'Antananarivo→ANTANANARIVO_I..VI, région fusionnée Vatovavy-Fitovinany résolue via district, repli par préfixe commun pour les variantes (Atsimo/Sud...).
- **Backend** : entité `Fokontany` dénormalisée (remplace Region/District/Commune/Fokontany), `GeoModule` → `GET /api/geo/{faritra,distrika,kaominina}` (code+nom). `places` filtre par `faritra/distrika/kaominina` (codes). Build + smoke test OK (23 régions, filtre faritra=11 → 535 entités Analamanga).
- **Frontend + mobile** : interfaces `code_*` + `GeoUnit{code,nom}`, endpoints geo, sélecteurs faritra/distrika par code (frontend). Build/tsc OK.

**Leçon.** Deux référentiels à marier : codes officiels (data-personne, sans géométrie) + polygones (geoBoundaries, sans codes), pont par noms. Fiable aux niveaux grossiers, dégradé au fokontany (17 465 polygones ≠ 19 336 fokontany, noms divergents). geoBoundaries = 22 régions (pré-réforme) vs 23 officielles → gérer les régions scindées via le district. **Réutiliser la structure d'un projet jumeau (codes INSTAT) > réinventer un schéma géo.**

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
