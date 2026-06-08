# Medinaa Mobile — Plan de conception

**Date** : 2026-06-08
**Branche** : mobile-app
**Stack** : React Native, Expo Bare Workflow, MapLibre GL, TanStack Query v5, react-i18next

---

## Contexte

Le `frontend/` existant est un backoffice web (React + Vite) pour administrer les entités médicales. Ce plan concerne une **nouvelle app mobile** (`mobile/`) destinée à tous les acteurs du monde de la santé à Madagascar — grand public et professionnels (pharmacies, médecins, hôpitaux, etc.).

**Inspiration UX** : Practo (découverte par catégorie/spécialité) + Google Maps (exploration cartographique).
**Architecture retenue** : Hybride — écran d'accueil Practo-style + carte plein écran accessible via FAB + mini-carte sur chaque fiche détail.

---

## Section 1 — Architecture & Structure du projet

### Emplacement dans le monorepo

```
medinaa/
  backend/       ← NestJS (inchangé)
  frontend/      ← React backoffice (inchangé)
  mobile/        ← React Native Expo Bare (NOUVEAU)
  CLAUDE.md
```

### Stack technique mobile

| Besoin | Lib choisie |
|---|---|
| Framework | Expo Bare Workflow (React Native 0.74+) |
| Navigation | React Navigation v6 (Native Stack + Bottom Tabs) |
| Data fetching | TanStack Query v5 (même que le frontend) |
| Carte | `@maplibre/maplibre-react-native` + tuiles OSM |
| Géolocalisation | `expo-location` |
| i18n | `react-i18next` + `i18next` |
| Design system | Fichier `theme.ts` central (tokens purs, aucune couleur hardcodée ailleurs) |
| Auth | `expo-secure-store` pour le token JWT |
| HTTP | `fetch` natif + wrapper identique à `frontend/src/lib/api.ts` |

### Connexion au backend

L'app mobile consomme le même backend NestJS existant. En dev, l'IP locale de la machine est configurée via une variable d'env (`EXPO_PUBLIC_API_URL`). Le backend nécessitera 5 nouveaux endpoints pour l'auth et le claim (voir Section 7).

---

## Section 2 — Design System & Thème

### Principe

Toutes les valeurs visuelles (couleurs, typographie, espacements, rayons, ombres) sont définies dans un unique fichier `mobile/src/theme/theme.ts`. **Aucune couleur ou valeur de style ne doit être écrite en dur ailleurs dans le code.** Pour changer le thème globalement, on ne modifie que ce fichier.

### Fichier `mobile/src/theme/theme.ts`

```ts
export const palette = {
  // Verts émeraude (couleur identitaire Medinaa, cohérente avec le frontend)
  emerald50:  '#ecfdf5',
  emerald100: '#d1fae5',
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',

  // Neutres
  white:      '#ffffff',
  gray50:     '#f9fafb',
  gray100:    '#f3f4f6',
  gray200:    '#e5e7eb',
  gray300:    '#d1d5db',
  gray400:    '#9ca3af',
  gray500:    '#6b7280',
  gray700:    '#374151',
  gray900:    '#111827',

  // Sémantiques
  red500:     '#ef4444',
  red50:      '#fef2f2',
  amber500:   '#f59e0b',
  amber50:    '#fffbeb',
  blue500:    '#3b82f6',
  blue50:     '#eff6ff',
}

export const colors = {
  // Couleurs fonctionnelles — modifier ici pour changer le thème entier
  primary:          palette.emerald600,
  primaryLight:     palette.emerald100,
  primaryDark:      palette.emerald700,
  secondary:        palette.emerald400,

  background:       palette.gray50,
  surface:          palette.white,
  surfaceAlt:       palette.gray100,

  text:             palette.gray900,
  textSecondary:    palette.gray500,
  textDisabled:     palette.gray300,
  textOnPrimary:    palette.white,

  border:           palette.gray200,
  borderStrong:     palette.gray300,

  error:            palette.red500,
  errorBg:          palette.red50,
  warning:          palette.amber500,
  warningBg:        palette.amber50,
  info:             palette.blue500,
  infoBg:           palette.blue50,
  success:          palette.emerald500,
  successBg:        palette.emerald50,
}

export const typography = {
  fontFamily: {
    regular:  'System',   // remplacer par une police custom via expo-font si besoin (ex: Figtree)
    medium:   'System',
    bold:     'System',
  },
  fontSize: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
}

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
}

export const radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 9999,
}

export const shadow = {
  sm: {
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
}

export const theme = { colors, typography, spacing, radius, shadow, palette }
export type Theme = typeof theme
export default theme
```

### Usage dans les composants

```ts
import theme from '@/theme/theme'

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.base,
    borderRadius: theme.radius.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
})
```

### Mode sombre (optionnel, phase 2)

Le fichier `theme.ts` peut exposer un `darkTheme` qui remplace uniquement les tokens `colors.*`. Aucun composant ne doit être modifié — seul le thème change. À implémenter dans une phase ultérieure.

---

## Section 3 — Navigation & Écrans

### Structure de navigation

```
RootStack (Native Stack)
├── OnboardingScreen        ← langue + permission géolocalisation (1er lancement)
├── MainTabs (Bottom Tab Navigator)
│   ├── Tab 1 : Accueil     (HomeScreen)
│   ├── Tab 2 : Recherche   (SearchScreen)
│   ├── Tab 3 : Carte       (MapScreen)
│   └── Tab 4 : Profil      (ProfileScreen)
├── EntityDetailScreen      ← /places/:id, accessible depuis toutes les tabs
├── EntitySearchResultsScreen
├── ClaimScreen             ← revendiquer un établissement
├── AuthStack
│   ├── LoginScreen
│   └── RegisterScreen      ← pré-rempli avec les données OSM de l'entité
└── EditEntityScreen        ← pour les propriétaires connectés
```

### Détail des écrans

#### OnboardingScreen (1er lancement uniquement)
- Sélection de langue (FR / MG / EN) avec drapeaux
- Demande de permission géolocalisation avec explication claire
- Stockage de la préférence langue + flag `onboardingDone` en `AsyncStorage`

#### HomeScreen (Tab 1) — style Practo
- Barre de recherche en haut ("Chercher un médecin, pharmacie…")
- Grille de catégories visuelles (icônes) : Hôpital, Pharmacie, Médecin, Clinique, CSB, Dentiste, Laboratoire, Urgences, Tous…
- Section "Près de vous" : liste horizontale de cartes entités (3-4 visibles)
- Section "Récemment consultés" (stockage local)
- FAB (bouton flottant) "Voir sur la carte" → **switch vers Tab 3 (MapScreen)** via `navigation.navigate('MainTabs', { screen: 'Map' })`, pas un push de nouvelle route

#### SearchScreen (Tab 2)
- Recherche fulltext (debounce 350ms, même logique que le frontend)
- Filtres : type, ville/district, urgences disponibles
- Résultats en liste de cartes verticales
- Bouton "Carte" en header pour basculer en vue carte des résultats

#### MapScreen (Tab 3)
- Carte MapLibre plein écran
- Pins colorés par type d'entité (couleur = `theme.colors.primary` et variantes)
- Clustering automatique pour les zones denses
- Bottom sheet : tap sur un pin → fiche résumée de l'entité (nom, type, distance, téléphone)
- Centré sur la position de l'utilisateur par défaut

#### EntityDetailScreen
- Header : nom + badge type
- Infos : téléphone (tap = appel direct), horaires, adresse, urgences, lits
- Section "Contact" avec liens cliquables
- **Mini-carte MapLibre** en bas de la fiche, centrée sur les coordonnées de l'entité, non-scrollable, hauteur fixe 220px
- Bouton "Itinéraire" → ouvre l'app de navigation native (Google Maps / Plans)
- **Bouton "Revendiquer cet établissement"** : visible uniquement si l'entité n'a pas encore de propriétaire. Si déjà revendiquée : badge "Établissement vérifié ✓" à la place du bouton.

#### ProfileScreen (Tab 4)
- Non connecté : présentation du programme "Gérez votre établissement" + bouton Login/Inscription
- Connecté (propriétaire) : liste de ses établissements, accès à `EditEntityScreen`

#### ClaimScreen
- Affiche les infos OSM existantes de l'entité
- Formulaire pour confirmer nom, email, téléphone
- Explique ce que le propriétaire pourra modifier après validation

---

## Section 4 — Entités médicales couvertes

Types OSM déjà en base + types supplémentaires à ajouter :

| Catégorie | Types |
|---|---|
| Hôpitaux | `hospital`, CHU, CHRR, CHRD |
| Centres de santé | `clinic`, `health_post`, CSB1, CSB2, `dispensary` |
| Praticiens | `doctors`, `doctor`, `nurse`, `dentist`, `physiotherapist`, `midwife`, `community_health_worker` |
| Pharmacie & parapharmacie | `pharmacy`, `optician` |
| Spécialisés | `laboratory`, `nursing_home`, `birthing_centre`, centre de dialyse, centre d'imagerie/radiologie |
| Urgences & services | service d'ambulance, banque de sang, centre de vaccination |
| Médecine traditionnelle | tradipraticien |

Chaque type aura une icône et une couleur de badge définis dans le design system.

---

## Section 5 — Internationalisation (i18n)

- Lib : `react-i18next` + `i18next`
- Langues : Français (`fr`), Malagasy (`mg`), Anglais (`en`)
- Fichiers : `mobile/src/i18n/locales/fr.json`, `mg.json`, `en.json`
- Langue détectée au 1er lancement → demandée à l'utilisateur → stockée en `AsyncStorage`
- Changement de langue possible depuis les Settings (sous-section du ProfileScreen)
- Les noms d'entités OSM ont déjà un champ `name_mg` (nom en malgache) — utilisé automatiquement si la langue active est `mg`

---

## Section 6 — Géolocalisation

- Permission demandée sur `OnboardingScreen` avec explication contextuelle ("Pour afficher les établissements près de vous")
- Si refusée : l'app fonctionne normalement, carte centrée sur Antananarivo par défaut
- À chaque lancement : `expo-location` récupère `coords.latitude` / `coords.longitude` → stocké dans un contexte React global `LocationContext`
- Utilisé par : HomeScreen (tri "Près de vous"), MapScreen (centrage), EntityDetailScreen (calcul de distance)

---

## Section 7 — Authentification & Claim

### Flux public (pas de login)
- Navigation complète disponible, toutes les entités consultables
- Pas de création de compte requise

### Flux propriétaire
1. Sur une fiche entité → bouton "Revendiquer cet établissement"
2. `ClaimScreen` : confirmation des infos, saisie email + mot de passe
3. Backend : `POST /api/auth/register` + `POST /api/places/:id/claim`
4. Token JWT stocké dans `expo-secure-store`
5. Propriétaire connecté → `EditEntityScreen` pour modifier ses infos (nom, téléphone, horaires, description)

### Endpoints backend à créer
```
POST /api/auth/register     { email, password, entityId }
POST /api/auth/login        { email, password }
POST /api/places/:id/claim  { token }  (Auth Bearer)
PATCH /api/places/:id       { ...fields } (Auth Bearer, propriétaire uniquement)
GET  /api/me/places         liste des entités du propriétaire connecté
```

---

## Section 8 — Structure des fichiers `mobile/`

```
mobile/
  src/
    theme/
      theme.ts              ← tokens centraux (couleurs, typo, espacements)
    i18n/
      index.ts
      locales/
        fr.json
        mg.json
        en.json
    navigation/
      RootNavigator.tsx
      MainTabNavigator.tsx
    screens/
      OnboardingScreen.tsx
      HomeScreen.tsx
      SearchScreen.tsx
      MapScreen.tsx
      EntityDetailScreen.tsx
      EntitySearchResultsScreen.tsx
      ProfileScreen.tsx
      ClaimScreen.tsx
      EditEntityScreen.tsx
      auth/
        LoginScreen.tsx
        RegisterScreen.tsx
    components/
      ui/
        Button.tsx
        Card.tsx
        Badge.tsx
        Input.tsx
        Skeleton.tsx
        BottomSheet.tsx
      entity/
        EntityCard.tsx       ← carte résumé (liste)
        EntityMapPin.tsx     ← pin carte personnalisé
        TypeBadge.tsx
        MiniMap.tsx          ← mini-carte pour EntityDetailScreen
      layout/
        ScreenWrapper.tsx
        CustomTabBar.tsx     ← tab bar personnalisé (optionnel, uniquement si le style natif est insuffisant)
    context/
      LocationContext.tsx
      AuthContext.tsx
    lib/
      api.ts                ← wrapper fetch (même pattern que frontend)
      storage.ts            ← AsyncStorage helpers
  app.json
  package.json
  tsconfig.json
  .env.example              ← contenu : EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

---

## Prochaines étapes — Ordre d'implémentation

### Phase 1 — Fondations (à faire en premier)
1. Scaffolding `mobile/` avec Expo Bare Workflow
2. Configuration TypeScript + alias `@/`
3. Fichier `theme.ts` (design system complet)
4. Navigation (RootStack + MainTabs)
5. `LocationContext` + `expo-location` (permission au lancement)
6. `lib/api.ts` + `EXPO_PUBLIC_API_URL`
7. i18n : structure + fichiers `fr.json`, `mg.json`, `en.json`

### Phase 2 — Écrans principaux
8. `OnboardingScreen` (langue + géoloc)
9. `HomeScreen` (catégories + "Près de vous" + FAB carte)
10. `SearchScreen` (recherche + filtres + liste)
11. `EntityDetailScreen` (fiche complète + mini-carte MapLibre)

### Phase 3 — Carte
12. `MapScreen` (MapLibre plein écran + pins + clustering + bottom sheet)
13. `MiniMap` composant réutilisable (pour EntityDetailScreen)

### Phase 4 — Auth & Claim (backend + mobile)
14. Backend : 5 nouveaux endpoints (auth/register, auth/login, claim, patch, me/places)
15. `AuthStack` (LoginScreen + RegisterScreen)
16. `ClaimScreen` + `EditEntityScreen`
17. `ProfileScreen` (état connecté + liste établissements)

### Phase 5 — Polish
18. Gestion hors-ligne (cache TanStack Query persistant)
19. Mode sombre (`darkTheme` dans `theme.ts`)
20. Tests de base + build APK local Android
