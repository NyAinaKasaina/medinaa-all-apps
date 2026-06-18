# Medinaa — Landing page (`medinaa.mg`) — Design

- **Date** : 2026-06-18
- **Statut** : Validé (brainstorming) → prêt pour plan d'implémentation
- **Projet** : `landing/` (4ᵉ app du monorepo Medinaa)

---

## 1. Contexte & objectif

Medinaa, c'est **4 projets distincts** :

| Projet | Domaine | Rôle |
|---|---|---|
| Mobile Android | (Play Store) | App native pour le grand public |
| Web client | sous-domaine (p.ex. `app.medinaa.mg`) | App web pour le grand public |
| Web backoffice | sous-domaine admin | Administration interne |
| **Landing (ce doc)** | **`medinaa.mg`** | **Vitrine + acquisition** |

**Objectif n°1 : acquisition.** Présenter le projet puis convertir le visiteur vers l'usage des apps (app web universelle + app Android via Play Store).

**Lancement coordonné** : la landing et l'app web sortent ensemble. La landing est la « porte d'entrée », l'app web est à 1 clic.

---

## 2. Périmètre

**Dans le périmètre :**
- Landing statique multilingue (FR / MG / EN), SEO très performant, animations soignées.
- Affichage de **stats réelles** tirées du backend.
- Émission d'**events analytics** (first-party) vers le backend.
- Système de thème dynamique (3 couleurs) + dark mode.

**Hors périmètre (autres projets) :**
- L'app web client, le backoffice admin (déploiements séparés).
- Le **panneau de consultation analytics** vit dans le backoffice ; la landing se contente d'**émettre** les events.
- Pas de waitlist, pas de prise de rendez-vous, pas de compte utilisateur.

---

## 3. Stack & architecture

- **Next.js (App Router)** + TypeScript + **TailwindCSS** + **shadcn/ui** (composants écrits à la main, comme `frontend/`).
- **Rendu SSG/ISR** — pages pré-générées en HTML statique (SEO + LCP). Pas de SSR par requête.
- **`output: 'standalone'`** — déploiement **VPS self-host** (serveur Node via PM2 ou Docker) derrière un reverse-proxy (**Caddy** ou nginx) pour `medinaa.mg`. L'ISR (revalidation des stats) fonctionne sur serveur Node.
- **Emplacement** : nouveau dossier **`/landing`** dans le monorepo (cohérent avec `backend/`, `frontend/`, `mobile/`).

### i18n (FR / MG / EN)
- Routing par locale : `/fr`, `/mg`, `/en`. `/` redirige selon `Accept-Language` (fallback **`fr`**).
- Lib **`next-intl`** + dictionnaires JSON par langue.
- **`hreflang`** + `x-default`, **metadata & `sitemap.xml` par locale**.

---

## 4. Système de design

### Palette — 3 couleurs, single source of truth
Variables CSS HSL dans `globals.css`, mappées dans Tailwind avec `<alpha-value>` → tout se décline par opacité (`primary/10`, `secondary/60`…).

| Token | Hex | HSL | Rôle |
|---|---|---|---|
| `--primary` | `#1070C0` | `207 85% 41%` | Bleu du logo — éléments clés, liens, CTA |
| `--secondary` | `#0E9F6E` | `160 84% 34%` | Émeraude-teal — sections, accents santé |
| `--tertiary` | `#F59E0B` | `38 92% 50%` | Ambre — accents CTA, highlights |
| `--background` | `#F8FAFC` | `210 40% 98%` | Fond (neutre, hors marque) |
| `--foreground` | `#0F172A` | `222 47% 11%` | Texte (neutre, hors marque) |

- **Dark mode** : un bloc `.dark` réutilise **les mêmes 3 variables** (valeurs ajustées) → aucune couleur supplémentaire à gérer.
- **Toggle** clair/sombre via **`next-themes`**, **light par défaut**.
- Le neutre (blanc → encre) n'est **pas** une 4ᵉ couleur : c'est la « toile ».
- Bonus : variables CSS = thème **changeable à chaud** plus tard (switcher runtime) sans rebuild — non requis au lancement, mais l'archi est prête.

### Style
- **« Clean Health SaaS »** minimal + **bento** pour les stats.
- **Disposition** inspirée de **Zocdoc** (hero search-first, parcours « trouve près de chez toi »).
- **Contenu + design visés nettement au-dessus des références.**
- Typo : **Figtree** en continuité de l'app + un display à confirmer.
- Le **skill `ui-ux-pro-max`** sera utilisé à l'implémentation pour affiner style, font-pairing et composants.

---

## 5. Structure de page (11 sections)

1. **Header sticky** — logo · ancres (Fonctionnalités · Comment ça marche · Couverture · FAQ) · switch langue FR/MG/EN · toggle clair/sombre · CTA « Ouvrir l'app web ». *Anim : transparent → solide au scroll, soulignés au survol.*
2. **Hero search-first** — titre + sous-titre + **barre de recherche** (type d'établissement + localité) qui **deep-link vers l'app web** (requête préremplie) + **CTA device-aware**. Visuel : carte de Madagascar avec **pins en cascade**. *Anim : apparition décalée titre/CTA, pin-drop, flottement device.*
3. **Bandeau confiance** — signaux **factuels** (pas de faux avis) : « Données ouvertes OpenStreetMap · Couverture nationale · 100 % gratuit · Sans compte ». *Anim : fade-in.*
4. **Stats bento** — tuiles : compteur animé **2 173+ établissements**, répartition par type (hôpitaux, pharmacies, médecins, dispensaires/CSB…), nb villes/communes, % avec téléphone/horaires + mini-carte densité. *Anim : count-up au scroll, reveal décalé, hover-lift.*
5. **Fonctionnalités** — 4–6 cartes : recherche & filtres par type · « près de moi » géolocalisé · carte interactive · fiches détaillées (tél, horaires, adresse, lien OSM) · itinéraire / départ personnalisable · multilingue. *Anim : reveal décalé, micro-anim d'icône.*
6. **Comment ça marche** — 3 étapes : *Cherche → Explore la carte → Contacte / Itinéraire*. *Anim : reveal séquentiel + ligne tracée.*
7. **Showcase app (mobile + web)** — **mockups device** (téléphone Android + cadre navigateur) avec **placeholders** (carte + fiche détail), CTA device-aware répété. *Anim : parallax léger lié au scroll.*
8. **Couverture nationale** — carte Madagascar régions/pins, accroche « tout le pays ». *Anim : pins + highlight région.*
9. **FAQ** (accordéon) — gratuit ? · d'où viennent les données ? · iOS ? · signaler une erreur ? · app web vs mobile ? → **+ JSON-LD FAQ**. *Anim : accordéon.*
10. **CTA final** — bande dégradé `primary→secondary`, « Trouvez un établissement maintenant » + CTA device-aware. *Anim : fond animé subtil.*
11. **Footer** — liens (À propos, Contact, **Mentions légales / Confidentialité**), **attribution OpenStreetMap (licence ODbL, obligatoire)**, switch langue, lien admin discret (optionnel), ©. Trilingue.

---

## 6. Contenu & i18n

**Positionnement** : « Tous les établissements de santé de Madagascar, géolocalisés et gratuits. »

**Tagline de marque (header / OG)** — *retenue : A* :
> **« Toute la santé de Madagascar, sur une carte. »**
> *(EN : “All of Madagascar's healthcare, on one map.” · MG : « Ny fahasalamana manerana an'i Madagasikara, ao anaty sarintany. » — à valider)*

**Hero :**
- **Titre (FR)** : « Trouvez les soins dont vous avez besoin, où que vous soyez à Madagascar. »
- **Sous-titre (FR)** : « Hôpitaux, pharmacies, médecins, dispensaires, CSB… 2 173+ établissements géolocalisés, gratuitement. Sur le web et sur Android. »
- **EN title** : “Find the care you need, wherever you are in Madagascar.”
- **MG** : à valider par l'équipe (langue native).

**Meta description SEO (variante C)** : « L'annuaire des établissements de santé de Madagascar — gratuit, géolocalisé : hôpitaux, pharmacies, médecins, dispensaires et CSB sur une carte. »

**Ton** : clair, rassurant, utile, local.

**Process i18n** : FR = langue canonique ; EN rédigé avec confiance ; **MG proposé puis validé par l'équipe**. Catalogue de chaînes complet construit à l'implémentation (dictionnaires `next-intl`).

---

## 7. Animations

- **Lib** : **Framer Motion** (`motion`) pour reveals orchestrés + micro-interactions ; CSS pur pour hovers/gradients.
- **Patterns** : fade-up décalé au scroll (`whileInView`), **compteurs animés** (stats), pin-drop carte, parallax device, hover-lift cartes, gradient animé léger (hero / CTA final), nav qui se compacte.
- **Garde-fous** : `prefers-reduced-motion` respecté ; animations **`transform`/`opacity` uniquement** (GPU) ; **hero affiché d'abord** (LCP protégé) puis animé. Objectif **Lighthouse 95+ / Core Web Vitals vert** maintenu.

---

## 8. SEO « très performant »

- **Metadata API** par page/locale : title, description, canonical, OpenGraph, Twitter.
- **`hreflang`** (FR/MG/EN) + `x-default`.
- **JSON-LD** : `Organization`, `WebSite`, `MobileApplication`/`SoftwareApplication` (les apps), **`FAQPage`** (section FAQ).
- **`robots.txt`** + **`sitemap.xml`** auto, par locale.
- **Image OG** générée (`next/og`).
- **Budget perf** : fonts self-hosted (`next/font`), images `next/image` (AVIF/WebP), JS minimal, lazy-load below-the-fold. **Lighthouse 95+ / CWV vert** vérifié en CI.

---

## 9. Données & intégrations

- **Stats bento** : fetch de `GET /api/places/stats` **au build (ISR, `revalidate` ~ 1 jour)** avec **fallback en dur** (constantes : `2 173` établissements, répartitions) si l'API est injoignable → chiffres réels, sans dépendance runtime.
- **CTA device-aware** : le serveur rend la version universelle (« Ouvrir l'app web » en principal) ; le client détecte Android et **inverse la priorité visuelle** (badge Play Store en avant). Progressive enhancement, sans risque SEO.
- **Barre de recherche du hero** : deep-link vers l'app web avec la requête préremplie (pont d'acquisition), fallback = ouverture simple de l'app web.

---

## 10. Analytics (first-party, full free, consultable dans le backoffice)

- **Mini-beacon** sur la landing → `POST` vers le **backend NestJS existant** → table **`analytics_events`** (Postgres) → consultation dans le **backoffice** (panneau = projet backoffice, hors périmètre landing).
- **Events** : pageview, locale, device (desktop/Android/iOS), referrer, **clics CTA (app web vs Play Store)**.
- **Privacy-friendly** : pas de cookies, pas de service tiers, pas de bandeau cookies requis.
- *Alternative possible : Umami auto-hébergé (dashboard riche prêt à l'emploi) — non retenue par défaut.*

---

## 11. Composants

- **shadcn/ui** : Button, Card, Accordion, Badge, Sheet (nav mobile), DropdownMenu (langue), Tabs, Separator.
- **Custom** : `Hero`, `SearchBarMock`, `BentoStats` (CountUp), `FeatureCard`, `StepCard`, `DeviceMockup` (phone + browser), `MapCoverage`, `CTASection`, `Footer`, `LangSwitcher`, `ThemeToggle`, `MotionReveal`, `AnalyticsBeacon`.

---

## 12. Qualité

- **Accessibilité** : WCAG AA (contrastes validés sur la palette), `prefers-reduced-motion`, navigation clavier, focus visibles, alt text.
- **Performance** : budget Lighthouse 95+ / CWV vert (cf. §7–8).
- **Tests** :
  - **Vitest + Testing Library** sur les parties interactives (switch langue, CTA device-aware, toggle thème).
  - **Playwright** smoke : chargement des 3 locales, CTA pointant vers les bonnes URLs, 0 erreur console.
  - **Lighthouse CI** (budget SEO/perf).

---

## 13. Légal

- Pages **Mentions légales** + **Politique de confidentialité** (analytics first-party → mention simple).
- **Attribution OpenStreetMap** obligatoire (licence **ODbL**) — présente dans le footer et la page « À propos / données ».

---

## 14. Décisions différées / hypothèses

- **Captures réelles** des apps : aucune pour l'instant → **mockups UI en placeholder**, à remplacer plus tard.
- **Malgache (MG)** : chaînes à valider par l'équipe.
- **Sous-domaine app web** : `app.medinaa.mg` supposé — à confirmer.
- **URL Play Store** : à fournir au moment du lancement.
- **Switcher de thème runtime** : non requis au lancement (archi prête).
- **iOS** : pas d'app native → parcours iOS = app web.

---

## 15. Critères de succès

1. Landing en ligne sur `medinaa.mg`, **trilingue** (FR/MG/EN) avec `hreflang`.
2. **Lighthouse 95+** (Perf/SEO/Best Practices/A11y) sur mobile.
3. CTA device-aware fonctionnels (app web partout, Play Store mis en avant sur Android).
4. Stats réelles affichées (avec fallback robuste).
5. Events analytics reçus par le backend.
6. Thème modifiable depuis **3 variables** + dark mode opérationnel.
