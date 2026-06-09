# Medinaa Mobile App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native mobile app (Expo Bare Workflow) for Medinaa — discovery + map of all medical entities in Madagascar for the general public and health professionals, with an owner "claim your listing" system.

**Architecture:** Hybrid Practo+Google Maps — Practo-style home (categories + nearby list + FAB → full map), EntityDetail with fixed 220px MapLibre mini-map. Connects to existing NestJS backend (port 3000). Backend extended with 5 new auth/claim endpoints.

**Tech Stack:** React Native 0.76, Expo SDK 52, React Navigation v6, TanStack Query v5, `@maplibre/maplibre-react-native`, `expo-location`, `expo-secure-store`, `react-i18next`, `@gorhom/bottom-sheet`, `@expo/vector-icons`

---

## File Map

```
mobile/
├── src/
│   ├── theme/theme.ts
│   ├── i18n/index.ts + locales/{fr,mg,en}.json
│   ├── context/LocationContext.tsx + AuthContext.tsx
│   ├── lib/api.ts + storage.ts
│   ├── navigation/RootNavigator.tsx + MainTabNavigator.tsx
│   ├── screens/OnboardingScreen.tsx, HomeScreen.tsx, SearchScreen.tsx,
│   │          MapScreen.tsx, EntityDetailScreen.tsx, ProfileScreen.tsx,
│   │          ClaimScreen.tsx, EditEntityScreen.tsx,
│   │          auth/LoginScreen.tsx, auth/RegisterScreen.tsx
│   └── components/
│       ├── ui/Button.tsx, Card.tsx, Badge.tsx, Input.tsx, Skeleton.tsx, BottomSheet.tsx
│       ├── entity/EntityCard.tsx, TypeBadge.tsx, MiniMap.tsx, EntityMapPin.tsx
│       └── layout/ScreenWrapper.tsx
├── __tests__/
├── App.tsx + index.js + app.json + babel.config.js + tsconfig.json + jest.config.js
backend/src/
├── auth/auth.module.ts, auth.service.ts, auth.controller.ts, jwt.strategy.ts, jwt-auth.guard.ts
│       dto/register.dto.ts, login.dto.ts
├── users/user.entity.ts, users.module.ts, users.service.ts
└── places/ (modify) + medical-entity.entity.ts (add ownerId)
```

---
<!-- PART 1: Tasks 1-5 -->

## Task 1 — Expo Bare scaffolding + tooling

**Files:**
- Create: `mobile/` (entire directory)
- Create: `mobile/package.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/jest.config.js`
- Create: `mobile/.env.example`
- Create: `mobile/index.js`
- Create: `mobile/App.tsx`

- [ ] **Step 1: Initialize Expo Bare project from repo root**

```bash
cd /home/dagoa/projects/medinaa
npx create-expo-app mobile --template bare-minimum
cd mobile
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install \
  @react-navigation/native@^6.1.18 \
  @react-navigation/native-stack@^6.10.1 \
  @react-navigation/bottom-tabs@^6.6.1 \
  react-native-screens@~4.0.0 \
  react-native-safe-area-context@4.12.0 \
  @tanstack/react-query@^5.56.2 \
  @maplibre/maplibre-react-native@^10.0.0 \
  expo-location@~18.0.4 \
  expo-secure-store@~14.0.0 \
  @react-native-async-storage/async-storage@2.1.0 \
  i18next@^24.0.0 \
  react-i18next@^15.0.0 \
  @gorhom/bottom-sheet@^5.0.0 \
  react-native-reanimated@~3.16.1 \
  react-native-gesture-handler@~2.20.2 \
  @expo/vector-icons@^14.0.0

npm install --save-dev \
  babel-plugin-module-resolver@^5.0.2 \
  @testing-library/react-native@^12.7.2 \
  @testing-library/jest-native@^5.4.3 \
  @types/react@~18.3.0
```

- [ ] **Step 3: Configure TypeScript paths in `mobile/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 4: Configure Babel with path alias in `mobile/babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['module-resolver', { root: ['./src'], alias: { '@': './src' } }],
    ],
  }
}
```

- [ ] **Step 5: Configure Jest in `mobile/jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@maplibre/.*|@gorhom/.*|@tanstack/.*)',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}
```

- [ ] **Step 6: Create `mobile/.env.example`**

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

- [ ] **Step 7: Replace `mobile/App.tsx` with minimal shell (real content added in Task 6)**

```tsx
import 'react-native-gesture-handler'
import React from 'react'
import { Text, View } from 'react-native'

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Medinaa</Text>
    </View>
  )
}
```

- [ ] **Step 8: Verify app launches on Android**

```bash
npx expo run:android
```
Expected: Metro bundler starts, app shows "Medinaa" on device/emulator.

- [ ] **Step 9: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): initialize Expo Bare Workflow + tooling"
```

---

## Task 2 — Design System (`theme.ts`)

**Files:**
- Create: `mobile/src/theme/theme.ts`
- Create: `mobile/__tests__/theme.test.ts`

- [ ] **Step 1: Create `mobile/src/theme/theme.ts`**

```ts
export const palette = {
  emerald50:  '#ecfdf5', emerald100: '#d1fae5', emerald400: '#34d399',
  emerald500: '#10b981', emerald600: '#059669', emerald700: '#047857',
  white: '#ffffff', gray50: '#f9fafb', gray100: '#f3f4f6',
  gray200: '#e5e7eb', gray300: '#d1d5db', gray400: '#9ca3af',
  gray500: '#6b7280', gray700: '#374151', gray900: '#111827',
  red500: '#ef4444', red50: '#fef2f2', amber500: '#f59e0b',
  amber50: '#fffbeb', blue500: '#3b82f6', blue50: '#eff6ff',
}

export const colors = {
  primary: palette.emerald600, primaryLight: palette.emerald100,
  primaryDark: palette.emerald700, secondary: palette.emerald400,
  background: palette.gray50, surface: palette.white,
  surfaceAlt: palette.gray100,
  text: palette.gray900, textSecondary: palette.gray500,
  textDisabled: palette.gray300, textOnPrimary: palette.white,
  border: palette.gray200, borderStrong: palette.gray300,
  error: palette.red500, errorBg: palette.red50,
  warning: palette.amber500, warningBg: palette.amber50,
  info: palette.blue500, infoBg: palette.blue50,
  success: palette.emerald500, successBg: palette.emerald50,
}

export const typography = {
  fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  fontSize: { xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
  fontWeight: {
    regular: '400' as const, medium: '500' as const,
    semibold: '600' as const, bold: '700' as const,
  },
  lineHeight: { tight: 1.2, normal: 1.5, loose: 1.8 },
}

export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 48,
}

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 }

export const shadow = {
  sm: { shadowColor: palette.gray900, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: palette.gray900, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 4 },
  lg: { shadowColor: palette.gray900, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 8 },
}

export const theme = { colors, typography, spacing, radius, shadow, palette }
export type Theme = typeof theme
export default theme
```

- [ ] **Step 2: Write test `mobile/__tests__/theme.test.ts`**

```ts
import theme, { colors, spacing, radius } from '@/theme/theme'

describe('theme tokens', () => {
  it('primary color matches brand emerald', () => {
    expect(colors.primary).toBe('#059669')
  })
  it('all color tokens reference palette (no raw hex outside palette)', () => {
    expect(colors.background).toBe(theme.palette.gray50)
    expect(colors.surface).toBe(theme.palette.white)
  })
  it('spacing.base is 16', () => { expect(spacing.base).toBe(16) })
  it('radius.full is 9999', () => { expect(radius.full).toBe(9999) })
})
```

- [ ] **Step 3: Run test**

```bash
cd mobile && npm test -- --testPathPattern=theme
```
Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/theme/ mobile/__tests__/theme.test.ts
git commit -m "feat(mobile): add central design system theme.ts"
```

---

## Task 3 — Storage + API layer

**Files:**
- Create: `mobile/src/lib/storage.ts`
- Create: `mobile/src/lib/api.ts`
- Create: `mobile/__tests__/storage.test.ts`
- Create: `mobile/__tests__/api.test.ts`

- [ ] **Step 1: Create `mobile/src/lib/storage.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  ONBOARDING_DONE: 'onboardingDone',
  LANGUAGE: 'language',
  RECENTLY_VIEWED: 'recentlyViewed',
  AUTH_TOKEN: 'authToken',
} as const

export const storage = {
  getOnboardingDone: () => AsyncStorage.getItem(KEYS.ONBOARDING_DONE).then(v => v === 'true'),
  setOnboardingDone: () => AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true'),
  getLanguage: () => AsyncStorage.getItem(KEYS.LANGUAGE),
  setLanguage: (lang: string) => AsyncStorage.setItem(KEYS.LANGUAGE, lang),
  getRecentlyViewed: async (): Promise<string[]> => {
    const raw = await AsyncStorage.getItem(KEYS.RECENTLY_VIEWED)
    return raw ? JSON.parse(raw) : []
  },
  addRecentlyViewed: async (id: string): Promise<void> => {
    const list = await storage.getRecentlyViewed()
    const updated = [id, ...list.filter(i => i !== id)].slice(0, 10)
    await AsyncStorage.setItem(KEYS.RECENTLY_VIEWED, JSON.stringify(updated))
  },
  getToken: () => AsyncStorage.getItem(KEYS.AUTH_TOKEN),
  setToken: (token: string) => AsyncStorage.setItem(KEYS.AUTH_TOKEN, token),
  clearToken: () => AsyncStorage.removeItem(KEYS.AUTH_TOKEN),
}
```

- [ ] **Step 2: Create `mobile/src/lib/api.ts`**

```ts
const getBaseUrl = () => process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export interface MedicalEntity {
  id: string; osmId: string; osmType: string; name?: string; nameMg?: string
  amenity?: string; healthcare?: string; healthFacilityType?: string
  lat?: number; lng?: number; phone?: string; website?: string
  openingHours?: string; addrStreet?: string; addrHousenumber?: string
  addrCity?: string; addrDistrict?: string; addrProvince?: string
  operator?: string; operatorType?: string; beds?: number
  emergency?: boolean; osmUrl?: string; tags?: Record<string, string>
  ownerId?: string | null; scrapedAt?: string; createdAt: string; updatedAt: string
}

export interface PlacesResponse { items: MedicalEntity[]; total: number; page: number; limit: number; pages: number }
export interface PlacesStats { total: number; withPhone: number; withWebsite: number; withHours: number; byType: Record<string, number> }
export interface AuthResponse { token: string; user: { id: string; email: string } }

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${getBaseUrl()}${path}`, { headers, ...init })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status}: ${body}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  places: {
    list: (p: { q?: string; type?: string; city?: string; page?: number; limit?: number } = {}) => {
      const qs = new URLSearchParams()
      if (p.q) qs.set('q', p.q); if (p.type) qs.set('type', p.type)
      if (p.city) qs.set('city', p.city); if (p.page) qs.set('page', String(p.page))
      if (p.limit) qs.set('limit', String(p.limit))
      return request<PlacesResponse>(`/api/places?${qs}`)
    },
    stats: () => request<PlacesStats>('/api/places/stats'),
    get: (id: string) => request<MedicalEntity>(`/api/places/${id}`),
    update: (id: string, data: Partial<MedicalEntity>, token: string) =>
      request<MedicalEntity>(`/api/places/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
    claim: (id: string, token: string) =>
      request<MedicalEntity>(`/api/places/${id}/claim`, { method: 'POST' }, token),
    myPlaces: (token: string) => request<MedicalEntity[]>('/api/me/places', {}, token),
  },
  auth: {
    register: (email: string, password: string, entityId?: string) =>
      request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, entityId }) }),
    login: (email: string, password: string) =>
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  },
}
```

- [ ] **Step 3: Write test `mobile/__tests__/api.test.ts`**

```ts
import { api } from '@/lib/api'

global.fetch = jest.fn()

beforeEach(() => jest.clearAllMocks())

describe('api.places.list', () => {
  it('builds query string from params', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, text: async () => JSON.stringify({ items: [], total: 0, page: 1, limit: 20, pages: 0 })
    })
    await api.places.list({ q: 'hopital', type: 'hospital', page: 2 })
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(url).toContain('q=hopital')
    expect(url).toContain('type=hospital')
    expect(url).toContain('page=2')
  })
})

describe('api.auth.login', () => {
  it('sends email and password in body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, text: async () => JSON.stringify({ token: 'jwt', user: { id: '1', email: 'a@b.com' } })
    })
    await api.auth.login('a@b.com', 'pass')
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body).toEqual({ email: 'a@b.com', password: 'pass' })
  })

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, text: async () => 'Unauthorized' })
    await expect(api.auth.login('a@b.com', 'wrong')).rejects.toThrow('401')
  })
})
```

- [ ] **Step 4: Write test `mobile/__tests__/storage.test.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { storage } from '@/lib/storage'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

beforeEach(() => AsyncStorage.clear())

describe('storage.recentlyViewed', () => {
  it('adds and deduplicates ids', async () => {
    await storage.addRecentlyViewed('a')
    await storage.addRecentlyViewed('b')
    await storage.addRecentlyViewed('a') // re-add 'a' → goes to front
    const result = await storage.getRecentlyViewed()
    expect(result).toEqual(['a', 'b'])
  })

  it('caps at 10 items', async () => {
    for (let i = 0; i < 12; i++) await storage.addRecentlyViewed(String(i))
    const result = await storage.getRecentlyViewed()
    expect(result.length).toBe(10)
  })
})

describe('storage.language', () => {
  it('stores and retrieves language', async () => {
    await storage.setLanguage('mg')
    expect(await storage.getLanguage()).toBe('mg')
  })
})
```

- [ ] **Step 5: Run tests**

```bash
cd mobile && npm test -- --testPathPattern="api|storage"
```
Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/lib/ mobile/__tests__/api.test.ts mobile/__tests__/storage.test.ts
git commit -m "feat(mobile): add API layer and AsyncStorage helpers with tests"
```

---

## Task 4 — i18n (FR / MG / EN)

**Files:**
- Create: `mobile/src/i18n/index.ts`
- Create: `mobile/src/i18n/locales/fr.json`
- Create: `mobile/src/i18n/locales/mg.json`
- Create: `mobile/src/i18n/locales/en.json`

- [ ] **Step 1: Create `mobile/src/i18n/locales/fr.json`**

```json
{
  "common": { "loading": "Chargement…", "error": "Erreur", "retry": "Réessayer", "back": "Retour", "close": "Fermer", "save": "Enregistrer", "cancel": "Annuler", "search": "Rechercher", "noResults": "Aucun résultat", "km": "km", "verified": "Établissement vérifié" },
  "onboarding": { "title": "Bienvenue sur Medinaa", "subtitle": "Trouvez les établissements de santé à Madagascar", "chooseLanguage": "Choisissez votre langue", "locationTitle": "Votre position", "locationReason": "Pour afficher les établissements proches de vous", "allow": "Autoriser", "skip": "Passer", "continue": "Continuer" },
  "home": { "searchPlaceholder": "Chercher un médecin, pharmacie…", "categories": "Catégories", "nearYou": "Près de vous", "recentlyViewed": "Récemment consultés", "viewOnMap": "Voir sur la carte", "seeAll": "Voir tout" },
  "categories": { "hospital": "Hôpital", "pharmacy": "Pharmacie", "clinic": "Clinique", "doctor": "Médecin", "csb": "CSB", "dentist": "Dentiste", "laboratory": "Laboratoire", "emergency": "Urgences", "all": "Tous" },
  "search": { "placeholder": "Rechercher…", "filters": "Filtres", "type": "Type", "city": "Ville", "emergencyOnly": "Urgences uniquement", "results": "résultats" },
  "detail": { "phone": "Téléphone", "hours": "Horaires", "address": "Adresse", "emergency": "Urgences", "beds": "Lits", "directions": "Itinéraire", "openOsm": "Voir sur OSM", "claim": "Revendiquer cet établissement", "noPhone": "Non renseigné", "noHours": "Horaires non renseignés", "noAddress": "Adresse non renseignée", "noCoords": "Coordonnées indisponibles" },
  "map": { "title": "Carte", "nearMe": "Autour de moi" },
  "profile": { "title": "Profil", "claimProgram": "Gérez votre établissement", "claimDesc": "Vous êtes professionnel de santé ? Revendiquez votre établissement pour mettre à jour vos informations.", "login": "Se connecter", "register": "Créer un compte", "myFacilities": "Mes établissements", "logout": "Se déconnecter" },
  "auth": { "email": "Email", "password": "Mot de passe", "loginTitle": "Connexion", "registerTitle": "Créer un compte", "loginButton": "Se connecter", "registerButton": "S'inscrire", "noAccount": "Pas de compte ?", "hasAccount": "Déjà un compte ?" },
  "claim": { "title": "Revendiquer cet établissement", "description": "Confirmez vos informations pour gérer cet établissement.", "entityInfo": "Informations de l'établissement", "submit": "Revendiquer" },
  "edit": { "title": "Modifier l'établissement", "phone": "Téléphone", "hours": "Horaires (format OSM : Mo-Fr 08:00-18:00)", "website": "Site web" }
}
```

- [ ] **Step 2: Create `mobile/src/i18n/locales/en.json`**

```json
{
  "common": { "loading": "Loading…", "error": "Error", "retry": "Retry", "back": "Back", "close": "Close", "save": "Save", "cancel": "Cancel", "search": "Search", "noResults": "No results", "km": "km", "verified": "Verified facility" },
  "onboarding": { "title": "Welcome to Medinaa", "subtitle": "Find health facilities in Madagascar", "chooseLanguage": "Choose your language", "locationTitle": "Your location", "locationReason": "To show facilities near you", "allow": "Allow", "skip": "Skip", "continue": "Continue" },
  "home": { "searchPlaceholder": "Search a doctor, pharmacy…", "categories": "Categories", "nearYou": "Near you", "recentlyViewed": "Recently viewed", "viewOnMap": "View on map", "seeAll": "See all" },
  "categories": { "hospital": "Hospital", "pharmacy": "Pharmacy", "clinic": "Clinic", "doctor": "Doctor", "csb": "Health Center", "dentist": "Dentist", "laboratory": "Laboratory", "emergency": "Emergency", "all": "All" },
  "search": { "placeholder": "Search…", "filters": "Filters", "type": "Type", "city": "City", "emergencyOnly": "Emergency only", "results": "results" },
  "detail": { "phone": "Phone", "hours": "Hours", "address": "Address", "emergency": "Emergency", "beds": "Beds", "directions": "Directions", "openOsm": "View on OSM", "claim": "Claim this facility", "noPhone": "Not provided", "noHours": "Hours not provided", "noAddress": "Address not provided", "noCoords": "Coordinates unavailable" },
  "map": { "title": "Map", "nearMe": "Near me" },
  "profile": { "title": "Profile", "claimProgram": "Manage your facility", "claimDesc": "Are you a health professional? Claim your facility to update your information.", "login": "Log in", "register": "Create account", "myFacilities": "My facilities", "logout": "Log out" },
  "auth": { "email": "Email", "password": "Password", "loginTitle": "Log in", "registerTitle": "Create account", "loginButton": "Log in", "registerButton": "Register", "noAccount": "No account?", "hasAccount": "Already have an account?" },
  "claim": { "title": "Claim this facility", "description": "Confirm your information to manage this facility.", "entityInfo": "Facility information", "submit": "Claim" },
  "edit": { "title": "Edit facility", "phone": "Phone", "hours": "Hours (OSM format: Mo-Fr 08:00-18:00)", "website": "Website" }
}
```

- [ ] **Step 3: Create `mobile/src/i18n/locales/mg.json`**

```json
{
  "common": { "loading": "Miandry…", "error": "Hadisoana", "retry": "Avereno", "back": "Hiverina", "close": "Akatona", "save": "Tehiry", "cancel": "Foana", "search": "Hikaroka", "noResults": "Tsy misy valiny", "km": "km", "verified": "Fikambanana voamarina" },
  "onboarding": { "title": "Tongasoa amin'i Medinaa", "subtitle": "Hahita ny toeram-pahasalamana eto Madagasikara", "chooseLanguage": "Misafidiana ny fitenin'ny", "locationTitle": "Ny toeranao", "locationReason": "Hanatona ny toeram-pahasalamana akaikin'ny", "allow": "Ekena", "skip": "Tsitsilo", "continue": "Mitohy" },
  "home": { "searchPlaceholder": "Hikaroka dokotera, fanafody…", "categories": "Karazana", "nearYou": "Akaikin'ny toeranao", "recentlyViewed": "Nojerenao vao haingana", "viewOnMap": "Jereo amin'ny sarintany", "seeAll": "Jereo rehetra" },
  "categories": { "hospital": "Hopitaly", "pharmacy": "Farmasia", "clinic": "Klinika", "doctor": "Dokotera", "csb": "CSB", "dentist": "Dentista", "laboratory": "Laboratoara", "emergency": "Maika", "all": "Rehetra" },
  "search": { "placeholder": "Hikaroka…", "filters": "Sivana", "type": "Karazana", "city": "Tanàna", "emergencyOnly": "Maika ihany", "results": "valiny" },
  "detail": { "phone": "Laingam-pikarohana", "hours": "Ora fiasana", "address": "Adiresy", "emergency": "Maika", "beds": "Fandriana", "directions": "Lalana", "openOsm": "Jereo OSM", "claim": "Halako ity toera-pahasalamana ity", "noPhone": "Tsy voasoratra", "noHours": "Tsy voasoratra", "noAddress": "Tsy voasoratra", "noCoords": "Coordinates tsy misy" },
  "map": { "title": "Sarintany", "nearMe": "Akaikin'izaho" },
  "profile": { "title": "Profily", "claimProgram": "Tantanin'ny fandraharaha", "claimDesc": "Mpiasa amin'ny fahasalamana ve ianao? Halako ny fandraharaha.", "login": "Hiditra", "register": "Mamorona kaonty", "myFacilities": "Ny toera-pahasalaman'ny", "logout": "Hiala" },
  "auth": { "email": "Email", "password": "Teny miafina", "loginTitle": "Hiditra", "registerTitle": "Mamorona kaonty", "loginButton": "Hiditra", "registerButton": "Misoratra", "noAccount": "Tsy misy kaonty?", "hasAccount": "Efa manana kaonty?" },
  "claim": { "title": "Halako ity toera-pahasalamana ity", "description": "Marihina ny mombamomba.", "entityInfo": "Mombamomba ny toera-pahasalamana", "submit": "Halako" },
  "edit": { "title": "Hanova ny toera-pahasalamana", "phone": "Laingam-pikarohana", "hours": "Ora fiasana", "website": "Tranonkala" }
}
```

- [ ] **Step 4: Create `mobile/src/i18n/index.ts`**

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'
import mg from './locales/mg.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code']

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en }, mg: { translation: mg } },
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

export default i18n
```

- [ ] **Step 5: Run existing tests to confirm nothing broke**

```bash
cd mobile && npm test -- --ci
```
Expected: all previous tests still pass.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/i18n/
git commit -m "feat(mobile): add i18n setup with FR/MG/EN locales"
```

---

## Task 5 — Context providers (Location + Auth)

**Files:**
- Create: `mobile/src/context/LocationContext.tsx`
- Create: `mobile/src/context/AuthContext.tsx`
- Create: `mobile/__tests__/context/AuthContext.test.tsx`

- [ ] **Step 1: Create `mobile/src/context/LocationContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import * as Location from 'expo-location'

interface LocationState {
  coords: { latitude: number; longitude: number } | null
  permissionGranted: boolean
  loading: boolean
}

const LocationContext = createContext<LocationState>({
  coords: null, permissionGranted: false, loading: true,
})

// Default: Antananarivo city center
export const DEFAULT_COORDS = { latitude: -18.9137, longitude: 47.5361 }

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocationState>({ coords: null, permissionGranted: false, loading: true })

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        setState({ coords: null, permissionGranted: false, loading: false })
        return
      }
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(loc => {
        setState({ coords: loc.coords, permissionGranted: true, loading: false })
      }).catch(() => {
        setState({ coords: null, permissionGranted: true, loading: false })
      })
    })
  }, [])

  return <LocationContext.Provider value={state}>{children}</LocationContext.Provider>
}

export const useLocation = () => useContext(LocationContext)
export const useCoords = () => useContext(LocationContext).coords ?? DEFAULT_COORDS
```

- [ ] **Step 2: Create `mobile/src/context/AuthContext.tsx`**

```tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { storage } from '@/lib/storage'
import { api } from '@/lib/api'

interface AuthState {
  token: string | null
  user: { id: string; email: string } | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, entityId?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  token: null, user: null, isLoading: true,
  login: async () => {}, register: async () => {}, logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthState['user']>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    storage.getToken().then(t => { setToken(t); setIsLoading(false) })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    await storage.setToken(res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, password: string, entityId?: string) => {
    const res = await api.auth.register(email, password, entityId)
    await storage.setToken(res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    await storage.clearToken()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 3: Write test `mobile/__tests__/context/AuthContext.test.tsx`**

```tsx
import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { storage } from '@/lib/storage'

jest.mock('@/lib/api')
jest.mock('@/lib/storage', () => ({
  storage: { getToken: jest.fn().mockResolvedValue(null), setToken: jest.fn(), clearToken: jest.fn() }
}))

const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>

it('starts with no token', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => {})
  expect(result.current.token).toBeNull()
})

it('sets token after login', async () => {
  ;(api.auth.login as jest.Mock).mockResolvedValue({ token: 'jwt123', user: { id: '1', email: 'a@b.com' } })
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => { await result.current.login('a@b.com', 'pass') })
  expect(result.current.token).toBe('jwt123')
  expect(storage.setToken).toHaveBeenCalledWith('jwt123')
})

it('clears token on logout', async () => {
  ;(api.auth.login as jest.Mock).mockResolvedValue({ token: 'jwt123', user: { id: '1', email: 'a@b.com' } })
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => { await result.current.login('a@b.com', 'pass') })
  await act(async () => { await result.current.logout() })
  expect(result.current.token).toBeNull()
})
```

- [ ] **Step 4: Run tests**

```bash
cd mobile && npm test -- --testPathPattern=AuthContext
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/context/ mobile/__tests__/context/
git commit -m "feat(mobile): add LocationContext and AuthContext providers"
```

---
<!-- PART 2: Tasks 6-10 -->

## Task 6 — Navigation skeleton + App.tsx wiring

**Files:**
- Create: `mobile/src/navigation/RootNavigator.tsx`
- Create: `mobile/src/navigation/MainTabNavigator.tsx`
- Modify: `mobile/App.tsx`

- [ ] **Step 1: Create `mobile/src/navigation/MainTabNavigator.tsx`**

```tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import HomeScreen from '@/screens/HomeScreen'
import SearchScreen from '@/screens/SearchScreen'
import MapScreen from '@/screens/MapScreen'
import ProfileScreen from '@/screens/ProfileScreen'

export type MainTabParamList = {
  Home: undefined
  Search: undefined
  Map: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabNavigator() {
  const { t } = useTranslation()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline', Search: 'search-outline',
            Map: 'map-outline', Profile: 'person-outline',
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('home.nearYou') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: t('common.search') }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: t('map.title') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile.title') }} />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 2: Create `mobile/src/navigation/RootNavigator.tsx`**

```tsx
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { storage } from '@/lib/storage'
import MainTabNavigator from './MainTabNavigator'
import OnboardingScreen from '@/screens/OnboardingScreen'
import EntityDetailScreen from '@/screens/EntityDetailScreen'
import ClaimScreen from '@/screens/ClaimScreen'
import EditEntityScreen from '@/screens/EditEntityScreen'
import LoginScreen from '@/screens/auth/LoginScreen'
import RegisterScreen from '@/screens/auth/RegisterScreen'

export type RootStackParamList = {
  Onboarding: undefined
  MainTabs: undefined
  EntityDetail: { id: string }
  Claim: { entityId: string }
  EditEntity: { entityId: string }
  Login: undefined
  Register: { entityId?: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    storage.getOnboardingDone().then(setOnboardingDone)
  }, [])

  if (onboardingDone === null) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingDone ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        )}
        <Stack.Screen name="EntityDetail" component={EntityDetailScreen}
          options={{ headerShown: true, headerTitle: '', headerBackTitle: '' }} />
        <Stack.Screen name="Claim" component={ClaimScreen} />
        <Stack.Screen name="EditEntity" component={EditEntityScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

- [ ] **Step 3: Replace `mobile/App.tsx` with full wiring**

```tsx
import 'react-native-gesture-handler'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '@/context/AuthContext'
import { LocationProvider } from '@/context/LocationContext'
import '@/i18n/index'
import RootNavigator from '@/navigation/RootNavigator'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
})

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <RootNavigator />
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
```

- [ ] **Step 4: Create placeholder screens** (so the app compiles — real implementations in later tasks)

For each screen listed below, create the file with a minimal placeholder:

```tsx
// Template — apply to: HomeScreen, SearchScreen, MapScreen, ProfileScreen,
// OnboardingScreen, EntityDetailScreen, ClaimScreen, EditEntityScreen,
// auth/LoginScreen, auth/RegisterScreen
import React from 'react'
import { View, Text } from 'react-native'
export default function XxxScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>XxxScreen</Text></View>
}
```

- [ ] **Step 5: Verify app compiles and tab bar renders**

```bash
npx expo run:android
```
Expected: app launches, 4 tabs visible at the bottom, each shows its placeholder screen.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/navigation/ mobile/App.tsx mobile/src/screens/
git commit -m "feat(mobile): add navigation skeleton with tab bar and root stack"
```

---

## Task 7 — UI base components

**Files:**
- Create: `mobile/src/components/ui/Button.tsx`
- Create: `mobile/src/components/ui/Card.tsx`
- Create: `mobile/src/components/ui/Badge.tsx`
- Create: `mobile/src/components/ui/Input.tsx`
- Create: `mobile/src/components/ui/Skeleton.tsx`
- Create: `mobile/src/components/layout/ScreenWrapper.tsx`
- Create: `mobile/__tests__/components/Button.test.tsx`

- [ ] **Step 1: Create `mobile/src/components/ui/Button.tsx`**

```tsx
import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import theme from '@/theme/theme'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

export default function Button({ label, onPress, variant = 'primary', loading, disabled, fullWidth, style }: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        (pressed || isDisabled) && styles.pressed,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? theme.colors.textOnPrimary : theme.colors.primary} />
        : <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      }
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.xl, borderRadius: theme.radius.md, minHeight: 48 },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.7 },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.primaryLight },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary },
  ghost: { backgroundColor: 'transparent' },
  label: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold },
  primaryLabel: { color: theme.colors.textOnPrimary },
  secondaryLabel: { color: theme.colors.primaryDark },
  outlineLabel: { color: theme.colors.primary },
  ghostLabel: { color: theme.colors.primary },
})
```

- [ ] **Step 2: Create `mobile/src/components/ui/Card.tsx`**

```tsx
import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'
import theme from '@/theme/theme'

export default function Card({ children, style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props}>{children}</View>
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.base, ...theme.shadow.md },
})
```

- [ ] **Step 3: Create `mobile/src/components/ui/Badge.tsx`**

```tsx
import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import theme from '@/theme/theme'

interface BadgeProps { label: string; color?: string; bgColor?: string; style?: ViewStyle }

export default function Badge({ label, color = theme.colors.primary, bgColor = theme.colors.primaryLight, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: theme.radius.full, alignSelf: 'flex-start' },
  text: { fontSize: theme.typography.fontSize.xs, fontWeight: theme.typography.fontWeight.semibold },
})
```

- [ ] **Step 4: Create `mobile/src/components/ui/Input.tsx`**

```tsx
import React from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import theme from '@/theme/theme'

interface InputProps extends TextInputProps { label?: string; error?: string }

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={theme.colors.textDisabled}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: theme.spacing.base },
  label: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text, marginBottom: theme.spacing.xs },
  input: { height: 48, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.base, fontSize: theme.typography.fontSize.md, color: theme.colors.text },
  inputError: { borderColor: theme.colors.error },
  error: { fontSize: theme.typography.fontSize.xs, color: theme.colors.error, marginTop: theme.spacing.xs },
})
```

- [ ] **Step 5: Create `mobile/src/components/ui/Skeleton.tsx`**

```tsx
import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'
import theme from '@/theme/theme'

interface SkeletonProps { width?: number | string; height?: number; borderRadius?: number; style?: ViewStyle }

export default function Skeleton({ width = '100%', height = 16, borderRadius = theme.radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
    ])).start()
  }, [opacity])
  return <Animated.View style={[{ width: width as any, height, borderRadius, backgroundColor: theme.colors.border, opacity }, style]} />
}
```

- [ ] **Step 6: Create `mobile/src/components/layout/ScreenWrapper.tsx`**

```tsx
import React from 'react'
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import theme from '@/theme/theme'

interface Props { children: React.ReactNode; scrollable?: boolean; style?: ViewStyle; contentStyle?: ViewStyle }

export default function ScreenWrapper({ children, scrollable = true, style, contentStyle }: Props) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      {scrollable
        ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
        : <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
})
```

- [ ] **Step 7: Write test `mobile/__tests__/components/Button.test.tsx`**

```tsx
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Button from '@/components/ui/Button'

it('renders label and calls onPress', () => {
  const onPress = jest.fn()
  render(<Button label="Test" onPress={onPress} />)
  fireEvent.press(screen.getByText('Test'))
  expect(onPress).toHaveBeenCalledTimes(1)
})

it('does not call onPress when disabled', () => {
  const onPress = jest.fn()
  render(<Button label="Test" onPress={onPress} disabled />)
  fireEvent.press(screen.getByText('Test'))
  expect(onPress).not.toHaveBeenCalled()
})

it('shows ActivityIndicator when loading', () => {
  render(<Button label="Test" onPress={() => {}} loading />)
  expect(screen.queryByText('Test')).toBeNull()
})
```

- [ ] **Step 8: Run tests**

```bash
cd mobile && npm test -- --testPathPattern=Button
```
Expected: 3 tests pass.

- [ ] **Step 9: Commit**

```bash
git add mobile/src/components/ui/ mobile/src/components/layout/ mobile/__tests__/components/
git commit -m "feat(mobile): add base UI components (Button, Card, Badge, Input, Skeleton, ScreenWrapper)"
```

---

## Task 8 — Entity components (TypeBadge, EntityCard)

**Files:**
- Create: `mobile/src/components/entity/TypeBadge.tsx`
- Create: `mobile/src/components/entity/EntityCard.tsx`
- Create: `mobile/__tests__/components/TypeBadge.test.tsx`
- Create: `mobile/__tests__/components/EntityCard.test.tsx`

- [ ] **Step 1: Create `mobile/src/components/entity/TypeBadge.tsx`**

```tsx
import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import theme from '@/theme/theme'
import { useTranslation } from 'react-i18next'

interface TypeConfig { labelKey: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }

const TYPE_CONFIG: Record<string, TypeConfig> = {
  hospital:     { labelKey: 'categories.hospital',  color: '#dc2626', bg: '#fef2f2', icon: 'medkit' },
  pharmacy:     { labelKey: 'categories.pharmacy',  color: '#059669', bg: '#ecfdf5', icon: 'medical' },
  clinic:       { labelKey: 'categories.clinic',    color: '#2563eb', bg: '#eff6ff', icon: 'business' },
  doctors:      { labelKey: 'categories.doctor',    color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  doctor:       { labelKey: 'categories.doctor',    color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  dentist:      { labelKey: 'categories.dentist',   color: '#0891b2', bg: '#ecfeff', icon: 'happy' },
  laboratory:   { labelKey: 'categories.laboratory',color: '#b45309', bg: '#fffbeb', icon: 'flask' },
  health_post:  { labelKey: 'categories.csb',       color: '#047857', bg: '#ecfdf5', icon: 'home' },
  dispensary:   { labelKey: 'categories.csb',       color: '#047857', bg: '#ecfdf5', icon: 'home' },
  nurse:        { labelKey: 'categories.doctor',    color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  physiotherapist: { labelKey: 'categories.doctor', color: '#7c3aed', bg: '#f5f3ff', icon: 'person' },
  midwife:      { labelKey: 'categories.doctor',    color: '#db2777', bg: '#fdf2f8', icon: 'person' },
}

const FALLBACK: TypeConfig = { labelKey: 'categories.all', color: theme.colors.textSecondary, bg: theme.colors.surfaceAlt, icon: 'add-circle-outline' }

export function getTypeConfig(type?: string): TypeConfig {
  return (type && TYPE_CONFIG[type]) ? TYPE_CONFIG[type] : FALLBACK
}

interface TypeBadgeProps { type?: string; style?: ViewStyle }

export default function TypeBadge({ type, style }: TypeBadgeProps) {
  const { t } = useTranslation()
  const cfg = getTypeConfig(type)
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
      <Text style={[styles.text, { color: cfg.color }]}>{t(cfg.labelKey)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: theme.radius.full, alignSelf: 'flex-start' },
  text: { fontSize: theme.typography.fontSize.xs, fontWeight: theme.typography.fontWeight.semibold },
})
```

- [ ] **Step 2: Create `mobile/src/components/entity/EntityCard.tsx`**

```tsx
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import Card from '@/components/ui/Card'
import TypeBadge from './TypeBadge'
import { MedicalEntity } from '@/lib/api'
import { useCoords } from '@/context/LocationContext'

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface EntityCardProps { entity: MedicalEntity; onPress: () => void; compact?: boolean }

export default function EntityCard({ entity, onPress, compact = false }: EntityCardProps) {
  const { t } = useTranslation()
  const userCoords = useCoords()
  const type = entity.amenity ?? entity.healthcare
  const displayName = entity.name ?? '(Sans nom)'
  const dist = entity.lat && entity.lng
    ? calcDistance(userCoords.latitude, userCoords.longitude, entity.lat, entity.lng)
    : null

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <Card style={[styles.card, compact && styles.compact]}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <TypeBadge type={type} style={{ marginVertical: theme.spacing.xs }} />
            {entity.addrCity && <Text style={styles.sub} numberOfLines={1}>{entity.addrCity}</Text>}
          </View>
          <View style={styles.right}>
            {dist !== null && (
              <Text style={styles.dist}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} ${t('common.km')}`}</Text>
            )}
            {entity.emergency && <Ionicons name="flash" size={14} color={theme.colors.error} />}
            {entity.ownerId && <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />}
          </View>
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.sm },
  compact: { padding: theme.spacing.sm, marginBottom: theme.spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1, marginRight: theme.spacing.sm },
  name: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text },
  sub: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  right: { alignItems: 'flex-end', gap: theme.spacing.xs },
  dist: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary, fontWeight: theme.typography.fontWeight.medium },
})
```

- [ ] **Step 3: Write `mobile/__tests__/components/TypeBadge.test.tsx`**

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import TypeBadge from '@/components/entity/TypeBadge'
import { getTypeConfig } from '@/components/entity/TypeBadge'
import '../../../src/i18n/index'

it('renders hospital type with red color', () => {
  const cfg = getTypeConfig('hospital')
  expect(cfg.color).toBe('#dc2626')
})

it('uses fallback for unknown type', () => {
  const cfg = getTypeConfig('unknown_type')
  expect(cfg.icon).toBe('add-circle-outline')
})

it('renders without crashing for undefined type', () => {
  render(<TypeBadge />)
  expect(screen.getByText(/all|Rehetra|Tous/i)).toBeTruthy()
})
```

- [ ] **Step 4: Run tests**

```bash
cd mobile && npm test -- --testPathPattern="TypeBadge|EntityCard"
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/entity/ mobile/__tests__/components/TypeBadge.test.tsx mobile/__tests__/components/EntityCard.test.tsx
git commit -m "feat(mobile): add TypeBadge and EntityCard components"
```

---

## Task 9 — BottomSheet component

**Files:**
- Create: `mobile/src/components/ui/BottomSheet.tsx`

- [ ] **Step 1: Configure Reanimated in `mobile/android/app/build.gradle`**

Open `mobile/android/app/build.gradle` and add inside the `android {}` block:

```gradle
android {
    // ... existing config ...
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }
}
```

- [ ] **Step 2: Create `mobile/src/components/ui/BottomSheet.tsx`**

```tsx
import React, { forwardRef, useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import theme from '@/theme/theme'

interface BottomSheetProps {
  snapPoints?: (string | number)[]
  children: React.ReactNode
  onChange?: (index: number) => void
}

const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ snapPoints = ['25%', '50%'], children, onChange }, ref) => {
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
      []
    )
    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bg}
        handleIndicatorStyle={styles.handle}
        onChange={onChange}
      >
        <BottomSheetView style={styles.content}>{children}</BottomSheetView>
      </GorhomBottomSheet>
    )
  }
)

BottomSheet.displayName = 'BottomSheet'
export default BottomSheet

const styles = StyleSheet.create({
  bg: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl },
  handle: { backgroundColor: theme.colors.border, width: 40 },
  content: { flex: 1, padding: theme.spacing.base },
})
```

- [ ] **Step 3: Verify Android builds without error**

```bash
cd mobile && npx expo run:android
```
Expected: build succeeds, app launches.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/ui/BottomSheet.tsx mobile/android/app/build.gradle
git commit -m "feat(mobile): add BottomSheet wrapper around @gorhom/bottom-sheet"
```

---

## Task 10 — OnboardingScreen

**Files:**
- Modify: `mobile/src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Implement `OnboardingScreen.tsx`**

```tsx
import React, { useState } from 'react'
import { StyleSheet, Text, View, Pressable, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import i18n, { SUPPORTED_LANGUAGES } from '@/i18n/index'
import { storage } from '@/lib/storage'
import Button from '@/components/ui/Button'
import theme from '@/theme/theme'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Step = 'language' | 'location'
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function OnboardingScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const [step, setStep] = useState<Step>('language')
  const [selectedLang, setSelectedLang] = useState('fr')

  const handleLanguageSelect = async (code: string) => {
    setSelectedLang(code)
    await i18n.changeLanguage(code)
    await storage.setLanguage(code)
    setStep('location')
  }

  const handleLocationAllow = async () => {
    await Location.requestForegroundPermissionsAsync()
    await finish()
  }

  const finish = async () => {
    await storage.setOnboardingDone()
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
  }

  if (step === 'language') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
          <Text style={styles.section}>{t('onboarding.chooseLanguage')}</Text>
          <View style={styles.langList}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <Pressable key={lang.code} onPress={() => handleLanguageSelect(lang.code)}
                style={[styles.langBtn, selectedLang === lang.code && styles.langBtnActive]}>
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, selectedLang === lang.code && styles.langLabelActive]}>{lang.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.locIcon}>📍</Text>
        <Text style={styles.title}>{t('onboarding.locationTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.locationReason')}</Text>
        <Button label={t('onboarding.allow')} onPress={handleLocationAllow} fullWidth style={{ marginTop: theme.spacing.xl }} />
        <Button label={t('onboarding.skip')} onPress={finish} variant="ghost" fullWidth style={{ marginTop: theme.spacing.sm }} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, padding: theme.spacing['2xl'], justifyContent: 'center' },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.sm },
  subtitle: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing['2xl'] },
  section: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.base },
  langList: { gap: theme.spacing.sm, width: '100%' },
  langBtn: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.base, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: theme.spacing.md },
  langBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  langFlag: { fontSize: 24 },
  langLabel: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text },
  langLabelActive: { color: theme.colors.primaryDark },
  locIcon: { fontSize: 64, textAlign: 'center', marginBottom: theme.spacing.base },
})
```

- [ ] **Step 2: Verify on device — first launch shows language selection, second step shows location prompt**

```bash
# Clear app data on emulator to reset onboarding flag, then:
npx expo run:android
```
Expected: language selection → location step → app lands on Home tab.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/OnboardingScreen.tsx
git commit -m "feat(mobile): implement OnboardingScreen with language + geoloc steps"
```

---
<!-- PART 3: Tasks 11-15 -->

## Task 11 — HomeScreen

**Files:**
- Modify: `mobile/src/screens/HomeScreen.tsx`

- [ ] **Step 1: Implement `HomeScreen.tsx`**

```tsx
import React, { useCallback, useRef } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api, MedicalEntity } from '@/lib/api'
import { useCoords } from '@/context/LocationContext'
import EntityCard from '@/components/entity/EntityCard'
import Skeleton from '@/components/ui/Skeleton'
import type { RootStackParamList } from '@/navigation/RootNavigator'
import type { MainTabParamList } from '@/navigation/MainTabNavigator'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

type Nav = NativeStackNavigationProp<RootStackParamList> & BottomTabNavigationProp<MainTabParamList>

const CATEGORIES = [
  { key: 'hospital', icon: 'medkit' as const },
  { key: 'pharmacy', icon: 'medical' as const },
  { key: 'doctor',   icon: 'person' as const },
  { key: 'clinic',   icon: 'business' as const },
  { key: 'csb',      icon: 'home' as const },
  { key: 'dentist',  icon: 'happy' as const },
  { key: 'laboratory', icon: 'flask' as const },
  { key: 'emergency',  icon: 'flash' as const },
  { key: 'all',      icon: 'grid' as const },
]

const OSM_TYPE_MAP: Record<string, string> = {
  hospital: 'hospital', pharmacy: 'pharmacy', doctor: 'doctors',
  clinic: 'clinic', csb: 'health_post', dentist: 'dentist',
  laboratory: 'laboratory', emergency: 'hospital',
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function HomeScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const userCoords = useCoords()

  const { data, isLoading } = useQuery({
    queryKey: ['places', 'nearby'],
    queryFn: () => api.places.list({ limit: 20 }),
  })

  const nearbyEntities = data?.items
    .filter(e => e.lat && e.lng)
    .sort((a, b) =>
      calcDistance(userCoords.latitude, userCoords.longitude, a.lat!, a.lng!) -
      calcDistance(userCoords.latitude, userCoords.longitude, b.lat!, b.lng!)
    ).slice(0, 10) ?? []

  const handleCategoryPress = (key: string) => {
    const type = key === 'all' ? undefined : OSM_TYPE_MAP[key]
    navigation.navigate('Search' as any, { type } as any)
  }

  const goToDetail = (id: string) => navigation.navigate('EntityDetail', { id })

  const goToMap = () => navigation.navigate('Map' as any)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Medinaa</Text>
        </View>

        {/* Search bar (tappable, goes to SearchScreen) */}
        <Pressable onPress={() => navigation.navigate('Search' as any)} style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        </Pressable>

        {/* Categories */}
        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat.key} onPress={() => handleCategoryPress(cat.key)} style={styles.catBtn}>
              <View style={styles.catIcon}>
                <Ionicons name={cat.icon} size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.catLabel} numberOfLines={2}>{t(`categories.${cat.key}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Nearby */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.nearYou')}</Text>
          <Pressable onPress={() => navigation.navigate('Search' as any)}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>

        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} style={styles.skeletonCard} />)
          : nearbyEntities.map(e => (
            <EntityCard key={e.id} entity={e} onPress={() => goToDetail(e.id)} />
          ))
        }
        <View style={{ height: theme.spacing['3xl'] }} />
      </ScrollView>

      {/* FAB — view on map */}
      <Pressable style={styles.fab} onPress={goToMap}>
        <Ionicons name="map" size={20} color={theme.colors.textOnPrimary} />
        <Text style={styles.fabLabel}>{t('home.viewOnMap')}</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.base, paddingTop: theme.spacing.base, paddingBottom: theme.spacing.sm },
  headerTitle: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.base, paddingVertical: theme.spacing.md, marginHorizontal: theme.spacing.base, marginBottom: theme.spacing.lg, ...theme.shadow.sm },
  searchPlaceholder: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary },
  sectionTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, paddingHorizontal: theme.spacing.base, marginBottom: theme.spacing.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: theme.spacing.base },
  seeAll: { fontSize: theme.typography.fontSize.sm, color: theme.colors.primary, fontWeight: theme.typography.fontWeight.medium },
  categories: { paddingHorizontal: theme.spacing.base, gap: theme.spacing.sm, paddingBottom: theme.spacing.base },
  catBtn: { alignItems: 'center', width: 72 },
  catIcon: { width: 56, height: 56, borderRadius: theme.radius.lg, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xs },
  catLabel: { fontSize: theme.typography.fontSize.xs, color: theme.colors.text, textAlign: 'center' },
  skeletonCard: { marginHorizontal: theme.spacing.base, marginBottom: theme.spacing.sm, borderRadius: theme.radius.lg },
  fab: { position: 'absolute', bottom: theme.spacing.xl, right: theme.spacing.base, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderRadius: theme.radius.full, ...theme.shadow.lg },
  fabLabel: { color: theme.colors.textOnPrimary, fontWeight: theme.typography.fontWeight.semibold, fontSize: theme.typography.fontSize.sm },
})
```

- [ ] **Step 2: Verify on device — categories grid, nearby entities list, FAB visible**

```bash
npx expo run:android
```
Expected: HomeScreen shows category chips, list of nearby entities (or skeletons if server offline), FAB "Voir sur la carte".

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/HomeScreen.tsx
git commit -m "feat(mobile): implement HomeScreen with categories, nearby list and map FAB"
```

---

## Task 12 — SearchScreen

**Files:**
- Modify: `mobile/src/screens/SearchScreen.tsx`

- [ ] **Step 1: Implement `SearchScreen.tsx`**

```tsx
import React, { useState } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import EntityCard from '@/components/entity/EntityCard'
import Skeleton from '@/components/ui/Skeleton'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

const TYPE_OPTIONS = ['hospital', 'pharmacy', 'clinic', 'doctors', 'dentist', 'health_post', 'laboratory']

export default function SearchScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<any>()
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedType, setSelectedType] = useState<string | undefined>(route.params?.type)
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()

  const handleQueryChange = (text: string) => {
    setQuery(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(text), 350)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQ, selectedType],
    queryFn: () => api.places.list({ q: debouncedQ || undefined, type: selectedType, limit: 50 }),
    enabled: true,
  })

  const items = emergencyOnly ? (data?.items ?? []).filter(e => e.emergency) : (data?.items ?? [])

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search input */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.colors.textDisabled}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); setDebouncedQ('') }}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Type filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable
          onPress={() => setSelectedType(undefined)}
          style={[styles.chip, !selectedType && styles.chipActive]}
        >
          <Text style={[styles.chipText, !selectedType && styles.chipTextActive]}>{t('categories.all')}</Text>
        </Pressable>
        {TYPE_OPTIONS.map(type => (
          <Pressable key={type} onPress={() => setSelectedType(type === selectedType ? undefined : type)}
            style={[styles.chip, selectedType === type && styles.chipActive]}>
            <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>{type}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setEmergencyOnly(v => !v)}
          style={[styles.chip, emergencyOnly && { ...styles.chipActive, backgroundColor: theme.colors.errorBg, borderColor: theme.colors.error }]}>
          <Ionicons name="flash" size={12} color={emergencyOnly ? theme.colors.error : theme.colors.textSecondary} />
          <Text style={[styles.chipText, emergencyOnly && { color: theme.colors.error }]}>{t('search.emergencyOnly')}</Text>
        </Pressable>
      </ScrollView>

      {/* Results count */}
      {data && (
        <Text style={styles.count}>{items.length} {t('search.results')}</Text>
      )}

      {/* Results list */}
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={80} style={styles.skeleton} />)
        : (
          <FlatList
            data={items}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <EntityCard entity={item} onPress={() => navigation.navigate('EntityDetail', { id: item.id })} />
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>{t('common.noResults')}</Text>}
          />
        )
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  searchRow: { padding: theme.spacing.base },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.base, height: 48, ...theme.shadow.sm },
  searchIcon: { marginRight: theme.spacing.sm },
  input: { flex: 1, fontSize: theme.typography.fontSize.md, color: theme.colors.text },
  chips: { paddingHorizontal: theme.spacing.base, gap: theme.spacing.xs, paddingBottom: theme.spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.primaryDark, fontWeight: theme.typography.fontWeight.semibold },
  count: { paddingHorizontal: theme.spacing.base, paddingBottom: theme.spacing.sm, fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
  list: { paddingHorizontal: theme.spacing.base, paddingBottom: theme.spacing['3xl'] },
  skeleton: { marginHorizontal: theme.spacing.base, marginBottom: theme.spacing.sm, borderRadius: theme.radius.lg },
  empty: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing['3xl'] },
})
```

- [ ] **Step 2: Verify debounced search and filter chips work on device**

```bash
npx expo run:android
```
Expected: typing in search box triggers API call after 350ms, filter chips narrow results.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/SearchScreen.tsx
git commit -m "feat(mobile): implement SearchScreen with debounce and type filters"
```

---

## Task 13 — EntityDetailScreen + MiniMap

**Files:**
- Modify: `mobile/src/screens/EntityDetailScreen.tsx`
- Create: `mobile/src/components/entity/MiniMap.tsx`

- [ ] **Step 1: Create `mobile/src/components/entity/MiniMap.tsx`**

```tsx
import React, { useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import MapLibreGL from '@maplibre/maplibre-react-native'
import theme from '@/theme/theme'
import { useTranslation } from 'react-i18next'

MapLibreGL.setAccessToken(null)

interface MiniMapProps { lat: number; lng: number; name?: string }

export default function MiniMap({ lat, lng, name }: MiniMapProps) {
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://tiles.openfreemap.org/styles/liberty"
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera zoomLevel={14} centerCoordinate={[lng, lat]} animationDuration={0} />
        <MapLibreGL.ShapeSource id="pin" shape={{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }}>
          <MapLibreGL.CircleLayer id="pinCircle" style={{
            circleRadius: 8,
            circleColor: theme.colors.primary,
            circleStrokeWidth: 2,
            circleStrokeColor: theme.colors.surface,
          }} />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { height: 220, borderRadius: theme.radius.lg, overflow: 'hidden', marginTop: theme.spacing.base },
  map: { flex: 1 },
})
```

- [ ] **Step 2: Implement `EntityDetailScreen.tsx`**

```tsx
import React from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import TypeBadge from '@/components/entity/TypeBadge'
import MiniMap from '@/components/entity/MiniMap'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <View style={iStyles.row}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} style={iStyles.icon} />
      <View style={iStyles.col}>
        <Text style={iStyles.label}>{label}</Text>
        <Text style={iStyles.value}>{value}</Text>
      </View>
    </View>
  )
}
const iStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  icon: { marginRight: theme.spacing.sm, marginTop: 2 },
  col: { flex: 1 },
  label: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 2 },
  value: { fontSize: theme.typography.fontSize.base, color: theme.colors.text },
})

export default function EntityDetailScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<any>()
  const { token } = useAuth()
  const { id } = route.params as { id: string }

  const { data: entity, isLoading } = useQuery({
    queryKey: ['entity', id],
    queryFn: () => api.places.get(id),
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={20} style={{ marginBottom: theme.spacing.md }} />)}
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (!entity) return null

  const type = entity.amenity ?? entity.healthcare
  const displayName = entity.name ?? '(Sans nom)'
  const hasCoords = entity.lat != null && entity.lng != null

  const callPhone = () => entity.phone && Linking.openURL(`tel:${entity.phone}`)
  const openDirections = () => {
    if (!hasCoords) return
    const url = `geo:${entity.lat},${entity.lng}?q=${entity.lat},${entity.lng}(${encodeURIComponent(displayName)})`
    Linking.openURL(url)
  }
  const openOsm = () => entity.osmUrl && Linking.openURL(entity.osmUrl)

  const address = [entity.addrHousenumber, entity.addrStreet, entity.addrCity, entity.addrDistrict, entity.addrProvince]
    .filter(Boolean).join(', ') || null

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.headerRow}>
          <TypeBadge type={type} />
          {entity.ownerId && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              <Text style={styles.verifiedText}>{t('common.verified')}</Text>
            </View>
          )}
        </View>

        {entity.emergency && (
          <View style={styles.emergencyBanner}>
            <Ionicons name="flash" size={14} color={theme.colors.error} />
            <Text style={styles.emergencyText}>{t('detail.emergency')}</Text>
          </View>
        )}

        {/* Info rows */}
        <View style={styles.card}>
          <InfoRow icon="call-outline"    label={t('detail.phone')}   value={entity.phone} />
          <InfoRow icon="time-outline"    label={t('detail.hours')}   value={entity.openingHours} />
          <InfoRow icon="location-outline" label={t('detail.address')} value={address} />
          <InfoRow icon="bed-outline"     label={t('detail.beds')}    value={entity.beds ? String(entity.beds) : null} />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {entity.phone && (
            <Pressable onPress={callPhone} style={styles.actionBtn}>
              <Ionicons name="call" size={18} color={theme.colors.primary} />
              <Text style={styles.actionLabel}>{t('detail.phone')}</Text>
            </Pressable>
          )}
          {hasCoords && (
            <Pressable onPress={openDirections} style={styles.actionBtn}>
              <Ionicons name="navigate" size={18} color={theme.colors.primary} />
              <Text style={styles.actionLabel}>{t('detail.directions')}</Text>
            </Pressable>
          )}
          {entity.osmUrl && (
            <Pressable onPress={openOsm} style={styles.actionBtn}>
              <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.actionLabel}>OSM</Text>
            </Pressable>
          )}
        </View>

        {/* Claim or verified */}
        {!entity.ownerId && (
          <Button
            label={t('detail.claim')}
            variant="outline"
            fullWidth
            onPress={() => navigation.navigate('Claim', { entityId: entity.id })}
            style={{ marginTop: theme.spacing.base }}
          />
        )}

        {/* MiniMap */}
        {hasCoords
          ? <MiniMap lat={entity.lat!} lng={entity.lng!} name={displayName} />
          : <Text style={styles.noCoords}>{t('detail.noCoords')}</Text>
        }

        <View style={{ height: theme.spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  name: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.base },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.success, fontWeight: theme.typography.fontWeight.semibold },
  emergencyBanner: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, backgroundColor: theme.colors.errorBg, borderRadius: theme.radius.md, padding: theme.spacing.sm, marginBottom: theme.spacing.base },
  emergencyText: { color: theme.colors.error, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.base, marginBottom: theme.spacing.base, ...theme.shadow.sm },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.base },
  actionBtn: { flex: 1, alignItems: 'center', gap: theme.spacing.xs, backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md, paddingVertical: theme.spacing.md },
  actionLabel: { fontSize: theme.typography.fontSize.xs, color: theme.colors.primaryDark, fontWeight: theme.typography.fontWeight.medium },
  noCoords: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing.base },
})
```

- [ ] **Step 3: Verify detail screen shows mini-map for entities with coordinates**

```bash
npx expo run:android
# Navigate to any entity with lat/lng
```
Expected: entity info + 220px MapLibre map at bottom showing a pin at entity location.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/EntityDetailScreen.tsx mobile/src/components/entity/MiniMap.tsx
git commit -m "feat(mobile): implement EntityDetailScreen with MiniMap and claim button"
```

---

## Task 14 — MapScreen + EntityMapPin + native MapLibre setup

**Files:**
- Create: `mobile/src/components/entity/EntityMapPin.tsx`
- Modify: `mobile/src/screens/MapScreen.tsx`
- Modify: `mobile/android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add location permissions to `android/app/src/main/AndroidManifest.xml`**

Inside the `<manifest>` tag, before `<application>`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

- [ ] **Step 2: Create `mobile/src/components/entity/EntityMapPin.tsx`**

```tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import theme from '@/theme/theme'
import { getTypeConfig } from './TypeBadge'

interface EntityMapPinProps { type?: string; selected?: boolean }

export default function EntityMapPin({ type, selected = false }: EntityMapPinProps) {
  const cfg = getTypeConfig(type)
  return (
    <View style={[styles.pin, { backgroundColor: selected ? theme.colors.primary : cfg.color }, selected && styles.selected]}>
      <Ionicons name={cfg.icon} size={selected ? 16 : 12} color={theme.colors.surface} />
      <View style={[styles.tail, { borderTopColor: selected ? theme.colors.primary : cfg.color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  pin: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...theme.shadow.md },
  selected: { width: 40, height: 40, borderRadius: 20 },
  tail: { position: 'absolute', bottom: -6, width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
})
```

- [ ] **Step 3: Implement `MapScreen.tsx`**

```tsx
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api, MedicalEntity } from '@/lib/api'
import { useCoords } from '@/context/LocationContext'
import EntityCard from '@/components/entity/EntityCard'
import GorhomBottomSheet from '@gorhom/bottom-sheet'
import type { RootStackParamList } from '@/navigation/RootNavigator'

MapLibreGL.setAccessToken(null)

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function MapScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const userCoords = useCoords()
  const bottomSheetRef = useRef<GorhomBottomSheet>(null)
  const [selectedEntity, setSelectedEntity] = useState<MedicalEntity | null>(null)

  const { data } = useQuery({
    queryKey: ['places', 'all-for-map'],
    queryFn: () => api.places.list({ limit: 500 }),
  })

  const geoJson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: (data?.items ?? [])
      .filter(e => e.lat && e.lng)
      .map(e => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [e.lng!, e.lat!] },
        properties: { id: e.id, name: e.name ?? '(Sans nom)', type: e.amenity ?? e.healthcare ?? '' },
      })),
  }), [data])

  const handlePinPress = useCallback((e: any) => {
    const feature = e?.features?.[0]
    if (!feature) return
    const entity = data?.items.find(i => i.id === feature.properties.id)
    if (!entity) return
    setSelectedEntity(entity)
    bottomSheetRef.current?.expand()
  }, [data])

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://tiles.openfreemap.org/styles/liberty"
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          zoomLevel={10}
          centerCoordinate={[userCoords.longitude, userCoords.latitude]}
          animationDuration={500}
        />

        {/* User location dot */}
        <MapLibreGL.UserLocation visible renderMode="native" />

        {/* Clustered entity pins */}
        <MapLibreGL.ShapeSource
          id="entities"
          shape={geoJson}
          cluster
          clusterRadius={40}
          clusterMaxZoomLevel={14}
          onPress={handlePinPress}
        >
          {/* Cluster circle */}
          <MapLibreGL.CircleLayer
            id="clusteredCircle"
            filter={['has', 'point_count']}
            style={{ circleRadius: 20, circleColor: theme.colors.primary, circleOpacity: 0.85 }}
          />
          {/* Cluster count label */}
          <MapLibreGL.SymbolLayer
            id="clusterCount"
            filter={['has', 'point_count']}
            style={{ textField: ['get', 'point_count'], textSize: 13, textColor: theme.colors.textOnPrimary }}
          />
          {/* Individual pins */}
          <MapLibreGL.CircleLayer
            id="unclustered"
            filter={['!', ['has', 'point_count']]}
            style={{ circleRadius: 8, circleColor: theme.colors.primary, circleStrokeWidth: 2, circleStrokeColor: theme.colors.surface }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      {/* Entity bottom sheet */}
      <GorhomBottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['30%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      >
        {selectedEntity && (
          <View style={styles.sheet}>
            <EntityCard
              entity={selectedEntity}
              onPress={() => {
                bottomSheetRef.current?.close()
                navigation.navigate('EntityDetail', { id: selectedEntity.id })
              }}
            />
          </View>
        )}
      </GorhomBottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  sheet: { padding: theme.spacing.base },
})
```

- [ ] **Step 4: Verify map loads, pins appear, tapping a pin opens bottom sheet**

```bash
npx expo run:android
```
Expected: fullscreen OSM map centered on user location, green pins for entities, clusters for dense areas, bottom sheet with EntityCard on pin tap.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/MapScreen.tsx mobile/src/components/entity/EntityMapPin.tsx mobile/android/app/src/main/AndroidManifest.xml
git commit -m "feat(mobile): implement MapScreen with MapLibre clustering and entity bottom sheet"
```

---

## Task 15 — ProfileScreen (public state)

**Files:**
- Modify: `mobile/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Implement `ProfileScreen.tsx` (public + owner states)**

```tsx
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import EntityCard from '@/components/entity/EntityCard'
import Card from '@/components/ui/Card'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ProfileScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { token, user, logout } = useAuth()

  const { data: myPlaces } = useQuery({
    queryKey: ['myPlaces'],
    queryFn: () => api.places.myPlaces(token!),
    enabled: !!token,
  })

  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Ionicons name="business" size={64} color={theme.colors.primaryLight} />
            <Text style={styles.heroTitle}>{t('profile.claimProgram')}</Text>
            <Text style={styles.heroDesc}>{t('profile.claimDesc')}</Text>
          </View>
          <Button label={t('profile.login')} onPress={() => navigation.navigate('Login')} fullWidth />
          <Button label={t('profile.register')} onPress={() => navigation.navigate('Register', {})}
            variant="outline" fullWidth style={{ marginTop: theme.spacing.sm }} />
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.userCard}>
          <Ionicons name="person-circle" size={48} color={theme.colors.primary} />
          <Text style={styles.email}>{user?.email}</Text>
        </Card>

        <Text style={styles.section}>{t('profile.myFacilities')}</Text>
        {(myPlaces ?? []).map(entity => (
          <EntityCard key={entity.id} entity={entity}
            onPress={() => navigation.navigate('EditEntity', { entityId: entity.id })} />
        ))}
        {myPlaces?.length === 0 && (
          <Text style={styles.noFacilities}>Aucun établissement revendiqué</Text>
        )}
        <Button label={t('profile.logout')} variant="ghost" onPress={logout}
          fullWidth style={{ marginTop: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  hero: { alignItems: 'center', paddingVertical: theme.spacing['2xl'], gap: theme.spacing.md },
  heroTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, textAlign: 'center' },
  heroDesc: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.base, marginBottom: theme.spacing.xl },
  email: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text },
  section: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  noFacilities: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing.xl },
})
```

- [ ] **Step 2: Verify both states on device (non-connected → public, after login → owner)**

```bash
npx expo run:android
```
Expected: Profile tab shows public CTA when not logged in, owner dashboard with "my facilities" list after login.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/ProfileScreen.tsx
git commit -m "feat(mobile): implement ProfileScreen with public and owner states"
```

---
<!-- PART 4: Tasks 16-20 -->

## Task 16 — Backend: Auth Module (NestJS)

**Files:**
- Create: `backend/src/users/user.entity.ts`
- Create: `backend/src/users/users.service.ts`
- Create: `backend/src/users/users.module.ts`
- Create: `backend/src/auth/dto/register.dto.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/jwt.strategy.ts`
- Create: `backend/src/auth/jwt-auth.guard.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Install backend auth dependencies**

```bash
cd backend
npm install @nestjs/jwt@^10.2.0 @nestjs/passport@^10.0.3 passport@^0.7.0 passport-jwt@^4.0.1 bcrypt@^5.1.1
npm install --save-dev @types/passport-jwt@^4.0.1 @types/bcrypt@^5.0.2
```

- [ ] **Step 2: Create `backend/src/users/user.entity.ts`**

```ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true }) email: string
  @Column() passwordHash: string
  @CreateDateColumn() createdAt: Date
}
```

- [ ] **Step 3: Create `backend/src/users/users.service.ts`**

```ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = this.repo.create({ email, passwordHash })
    return this.repo.save(user)
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email })
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id })
  }
}
```

- [ ] **Step 4: Create `backend/src/users/users.module.ts`**

```ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'
import { UsersService } from './users.service'

@Module({ imports: [TypeOrmModule.forFeature([User])], providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
```

- [ ] **Step 5: Create `backend/src/auth/dto/register.dto.ts`**

```ts
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class RegisterDto {
  @IsEmail() email: string
  @IsString() @MinLength(8) password: string
  @IsUUID() @IsOptional() entityId?: string
}
```

- [ ] **Step 6: Create `backend/src/auth/dto/login.dto.ts`**

```ts
import { IsEmail, IsString } from 'class-validator'

export class LoginDto {
  @IsEmail() email: string
  @IsString() password: string
}
```

- [ ] **Step 7: Create `backend/src/auth/jwt.strategy.ts`**

```ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET', 'medinaa-secret'),
    })
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email }
  }
}
```

- [ ] **Step 8: Create `backend/src/auth/jwt-auth.guard.ts`**

```ts
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 9: Create `backend/src/auth/auth.service.ts`**

```ts
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email)
    if (existing) throw new ConflictException('Email already in use')
    const user = await this.users.create(email, password)
    return { token: this.sign(user.id, user.email), user: { id: user.id, email: user.email } }
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')
    return { token: this.sign(user.id, user.email), user: { id: user.id, email: user.email } }
  }

  private sign(userId: string, email: string) {
    return this.jwt.sign({ sub: userId, email })
  }
}
```

- [ ] **Step 10: Create `backend/src/auth/auth.controller.ts`**

```ts
import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password)
  }

  @Post('login') login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }
}
```

- [ ] **Step 11: Create `backend/src/auth/auth.module.ts`**

```ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { UsersModule } from '../users/users.module'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET', 'medinaa-secret'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 12: Register `AuthModule` and `UsersModule` in `backend/src/app.module.ts`**

Open `backend/src/app.module.ts` and add to the `imports` array:
```ts
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
// Add to @Module({ imports: [..., AuthModule, UsersModule] })
```

- [ ] **Step 13: Add `JWT_SECRET` to `backend/.env`**

```
JWT_SECRET=medinaa-jwt-secret-change-in-prod
```

- [ ] **Step 14: Restart backend and verify endpoints exist**

```bash
cd backend && npm run start:dev
# In another terminal:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```
Expected: `{"token":"...","user":{"id":"...","email":"test@test.com"}}`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```
Expected: same shape response.

- [ ] **Step 15: Commit**

```bash
cd ..
git add backend/src/auth/ backend/src/users/ backend/src/app.module.ts
git commit -m "feat(backend): add JWT auth module with register/login endpoints"
```

---

## Task 17 — Backend: Claim & owner endpoints

**Files:**
- Modify: `backend/src/medical-entity.entity.ts` (or wherever MedicalEntity is defined)
- Create: `backend/src/places/dto/update-place.dto.ts`
- Modify: `backend/src/places/places.service.ts`
- Modify: `backend/src/places/places.controller.ts`

> Note: check the actual path of `MedicalEntity` entity — from CLAUDE.md it is in the places module. Adjust paths accordingly.

- [ ] **Step 1: Add `ownerId` column to MedicalEntity entity**

Find `MedicalEntity` entity file (likely `backend/src/places/medical-entity.entity.ts`) and add:

```ts
import { Column } from 'typeorm'
// Inside the @Entity class, add:
@Column({ nullable: true }) ownerId: string | null
```

- [ ] **Step 2: Create `backend/src/places/dto/update-place.dto.ts`**

```ts
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdatePlaceDto {
  @IsString()  @IsOptional() name?: string
  @IsString()  @IsOptional() phone?: string
  @IsString()  @IsOptional() website?: string
  @IsString()  @IsOptional() openingHours?: string
  @IsString()  @IsOptional() addrStreet?: string
  @IsString()  @IsOptional() addrCity?: string
  @IsBoolean() @IsOptional() emergency?: boolean
  @IsNumber()  @IsOptional() beds?: number
}
```

- [ ] **Step 3: Add methods to `places.service.ts`**

Open `backend/src/places/places.service.ts` and add these methods to the `PlacesService` class:

```ts
async claimPlace(id: string, userId: string): Promise<MedicalEntity> {
  const entity = await this.repo.findOneByOrFail({ id })
  if (entity.ownerId) throw new ConflictException('Already claimed')
  entity.ownerId = userId
  return this.repo.save(entity)
}

async updateByOwner(id: string, userId: string, data: Partial<MedicalEntity>): Promise<MedicalEntity> {
  const entity = await this.repo.findOneByOrFail({ id })
  if (entity.ownerId !== userId) throw new ForbiddenException('Not the owner')
  Object.assign(entity, data)
  return this.repo.save(entity)
}

async getByOwner(userId: string): Promise<MedicalEntity[]> {
  return this.repo.findBy({ ownerId: userId })
}
```

Add missing imports at top of file:
```ts
import { ConflictException, ForbiddenException } from '@nestjs/common'
```

- [ ] **Step 4: Add routes to `places.controller.ts`**

Open `backend/src/places/places.controller.ts` and add:

```ts
import { Body, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UpdatePlaceDto } from './dto/update-place.dto'

// Add these methods inside the controller class:
@UseGuards(JwtAuthGuard)
@Post(':id/claim')
claim(@Param('id') id: string, @Request() req: any) {
  return this.placesService.claimPlace(id, req.user.id)
}

@UseGuards(JwtAuthGuard)
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdatePlaceDto, @Request() req: any) {
  return this.placesService.updateByOwner(id, req.user.id, dto)
}

@UseGuards(JwtAuthGuard)
@Get('me/places')
myPlaces(@Request() req: any) {
  return this.placesService.getByOwner(req.user.id)
}
```

- [ ] **Step 5: Restart backend, verify claim endpoint**

```bash
cd backend && npm run start:dev
# Get token first from Task 16 test, then:
TOKEN="<paste token from Task 16>"
ENTITY_ID="<paste any entity id from GET /api/places>"
curl -X POST http://localhost:3000/api/places/$ENTITY_ID/claim \
  -H "Authorization: Bearer $TOKEN"
```
Expected: entity JSON with `ownerId` set to user's id.

```bash
curl http://localhost:3000/api/me/places \
  -H "Authorization: Bearer $TOKEN"
```
Expected: array containing the claimed entity.

- [ ] **Step 6: Commit**

```bash
git add backend/src/places/
git commit -m "feat(backend): add claim, patch and me/places endpoints with JWT guard"
```

---

## Task 18 — Mobile: AuthStack + ClaimScreen

**Files:**
- Modify: `mobile/src/screens/auth/LoginScreen.tsx`
- Modify: `mobile/src/screens/auth/RegisterScreen.tsx`
- Modify: `mobile/src/screens/ClaimScreen.tsx`

- [ ] **Step 1: Implement `mobile/src/screens/auth/LoginScreen.tsx`**

```tsx
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import { useAuth } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function LoginScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigation.goBack()
    } catch (e: any) {
      setError(e.message ?? t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('auth.loginTitle')}</Text>
        <Input label={t('auth.email')} value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label={t('auth.password')} value={password} onChangeText={setPassword}
          secureTextEntry error={error ?? undefined} />
        <Button label={t('auth.loginButton')} onPress={handleLogin} loading={loading} fullWidth />
        <Button label={`${t('auth.noAccount')} ${t('profile.register')}`}
          variant="ghost" fullWidth onPress={() => navigation.navigate('Register', {})}
          style={{ marginTop: theme.spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xl },
})
```

- [ ] **Step 2: Implement `mobile/src/screens/auth/RegisterScreen.tsx`**

```tsx
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import { useAuth } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function RegisterScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<any>()
  const { register } = useAuth()
  const entityId: string | undefined = route.params?.entityId
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    setError(null)
    setLoading(true)
    try {
      await register(email.trim(), password, entityId)
      navigation.goBack()
    } catch (e: any) {
      setError(e.message ?? t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('auth.registerTitle')}</Text>
        <Input label={t('auth.email')} value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />
        <Input label={t('auth.password')} value={password} onChangeText={setPassword}
          secureTextEntry error={error ?? undefined} />
        <Button label={t('auth.registerButton')} onPress={handleRegister} loading={loading} fullWidth />
        <Button label={`${t('auth.hasAccount')} ${t('profile.login')}`}
          variant="ghost" fullWidth onPress={() => navigation.navigate('Login')}
          style={{ marginTop: theme.spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xl },
})
```

- [ ] **Step 3: Implement `mobile/src/screens/ClaimScreen.tsx`**

```tsx
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import TypeBadge from '@/components/entity/TypeBadge'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ClaimScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<any>()
  const { token } = useAuth()
  const { entityId } = route.params as { entityId: string }
  const qc = useQueryClient()

  const { data: entity } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => api.places.get(entityId),
  })

  const { mutate: claim, isPending } = useMutation({
    mutationFn: () => api.places.claim(entityId, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity', entityId] })
      qc.invalidateQueries({ queryKey: ['myPlaces'] })
      navigation.navigate('EditEntity', { entityId })
    },
  })

  if (!entity) return null

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('claim.title')}</Text>
        <Text style={styles.desc}>{t('claim.description')}</Text>

        <Card style={styles.entityCard}>
          <Text style={styles.entityName}>{entity.name ?? '(Sans nom)'}</Text>
          <TypeBadge type={entity.amenity ?? entity.healthcare} style={{ marginTop: theme.spacing.xs }} />
          {entity.addrCity && <Text style={styles.entityCity}>{entity.addrCity}</Text>}
        </Card>

        {!token ? (
          <>
            <Button label={t('profile.login')} onPress={() => navigation.navigate('Login')} fullWidth />
            <Button label={t('profile.register')}
              onPress={() => navigation.navigate('Register', { entityId })}
              variant="outline" fullWidth style={{ marginTop: theme.spacing.sm }} />
          </>
        ) : (
          <Button label={t('claim.submit')} onPress={() => claim()} loading={isPending} fullWidth />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  desc: { fontSize: theme.typography.fontSize.base, color: theme.colors.textSecondary, marginBottom: theme.spacing.xl },
  entityCard: { marginBottom: theme.spacing.xl },
  entityName: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text },
  entityCity: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
})
```

- [ ] **Step 4: Verify claim flow end-to-end on device**

1. Open any entity detail
2. Tap "Revendiquer cet établissement"
3. If not logged in → login/register CTA → after auth → claim submitted
4. Entity now shows "Établissement vérifié ✓"
5. Profile tab shows the entity under "Mes établissements"

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/auth/ mobile/src/screens/ClaimScreen.tsx
git commit -m "feat(mobile): implement LoginScreen, RegisterScreen and ClaimScreen"
```

---

## Task 19 — EditEntityScreen

**Files:**
- Modify: `mobile/src/screens/EditEntityScreen.tsx`

- [ ] **Step 1: Implement `mobile/src/screens/EditEntityScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import theme from '@/theme/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { RootStackParamList } from '@/navigation/RootNavigator'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function EditEntityScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<any>()
  const { token } = useAuth()
  const { entityId } = route.params as { entityId: string }
  const qc = useQueryClient()

  const { data: entity } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => api.places.get(entityId),
  })

  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    if (entity) {
      setPhone(entity.phone ?? '')
      setHours(entity.openingHours ?? '')
      setWebsite(entity.website ?? '')
    }
  }, [entity])

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.places.update(entityId, { phone, openingHours: hours, website }, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity', entityId] })
      qc.invalidateQueries({ queryKey: ['myPlaces'] })
      Alert.alert(t('common.save'), 'Informations mises à jour.')
      navigation.goBack()
    },
    onError: (e: any) => Alert.alert(t('common.error'), e.message),
  })

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('edit.title')}</Text>
        <Text style={styles.name}>{entity?.name ?? '(Sans nom)'}</Text>

        <Input label={t('edit.phone')} value={phone} onChangeText={setPhone}
          keyboardType="phone-pad" placeholder="+261 20 22 123 45" />
        <Input label={t('edit.hours')} value={hours} onChangeText={setHours}
          placeholder="Mo-Fr 08:00-17:00" autoCapitalize="none" />
        <Input label={t('edit.website')} value={website} onChangeText={setWebsite}
          keyboardType="url" autoCapitalize="none" placeholder="https://…" />

        <Button label={t('common.save')} onPress={() => save()} loading={isPending} fullWidth
          style={{ marginTop: theme.spacing.base }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => navigation.goBack()}
          fullWidth style={{ marginTop: theme.spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.base },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  name: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, marginBottom: theme.spacing.xl },
})
```

- [ ] **Step 2: Verify edit flow — owner can update phone/hours/website and changes persist**

```bash
npx expo run:android
# Claim an entity → navigate to EditEntity from ProfileScreen
# Change phone number → Save → go back to EntityDetailScreen → verify phone updated
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/EditEntityScreen.tsx
git commit -m "feat(mobile): implement EditEntityScreen for owners"
```

---

## Task 20 — Android local build configuration

**Files:**
- Modify: `mobile/android/app/build.gradle`
- Modify: `mobile/android/gradle.properties`

- [ ] **Step 1: Verify Android Studio and Java are installed**

```bash
java -version
# Expected: java version 17.x or higher
echo $ANDROID_HOME
# Expected: /home/<user>/Android/Sdk (or similar non-empty path)
```

If `ANDROID_HOME` is empty, add to `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```
Then `source ~/.zshrc`.

- [ ] **Step 2: Confirm NDK is installed (required by MapLibre and Reanimated)**

In Android Studio: SDK Manager → SDK Tools → NDK (Side by side) → install latest.

Or via CLI:
```bash
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "ndk;27.1.12297006"
```

- [ ] **Step 3: Enable Hermes (already default in RN 0.70+, verify in `android/app/build.gradle`)**

The file should already contain `hermesEnabled = true`. If not, add to `android/gradle.properties`:
```
hermesEnabled=true
```

- [ ] **Step 4: Build debug APK**

```bash
cd mobile/android
./gradlew assembleDebug
```
Expected output ends with: `BUILD SUCCESSFUL`
APK location: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] **Step 5: Install on connected device or emulator**

```bash
adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk
```
Expected: app installs and launches.

- [ ] **Step 6: Build release APK (unsigned, for testing only)**

```bash
cd mobile/android
./gradlew assembleRelease
```
Expected: `BUILD SUCCESSFUL`
APK: `mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`

> For a signed release APK (Play Store), generate a keystore and configure `signingConfigs` in `android/app/build.gradle`. Not required for local testing.

- [ ] **Step 7: Final smoke test on device**

Install the release APK and verify:
- [ ] Onboarding shows on first launch
- [ ] Language selection persists after restart
- [ ] Home categories grid loads
- [ ] Search returns results from backend
- [ ] Map loads with pins
- [ ] Entity detail shows mini-map for entities with coordinates
- [ ] Login/register/claim flow completes without error

- [ ] **Step 8: Commit**

```bash
cd ../..
git add mobile/android/
git commit -m "feat(mobile): configure Android local build + APK generation verified"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All sections from `docs/plan.md` covered — theme tokens (Task 2), i18n FR/MG/EN (Task 4), location context (Task 5), hybrid navigation (Task 6), categories grid + FAB (Task 11), debounced search (Task 12), entity detail + mini-map (Task 13), full-screen map + clustering (Task 14), claim/auth (Tasks 16–18), edit (Task 19), Android build (Task 20)
- [x] **Placeholders:** None — all steps include concrete commands or code
- [x] **Type consistency:** `MedicalEntity` interface defined in `api.ts` (Task 3) and used in `EntityCard`, `EntityDetailScreen`, `MapScreen`. `RootStackParamList` defined in `RootNavigator` (Task 6) and used in all screens. `MainTabParamList` defined in `MainTabNavigator` (Task 6).
- [x] **API method names:** `api.places.list/get/update/claim/myPlaces` + `api.auth.register/login` — consistent across `api.ts` (Task 3), `ClaimScreen` (Task 18), `EditEntityScreen` (Task 19)
- [x] **MapLibreGL.setAccessToken(null)** called in both `MiniMap.tsx` (Task 13) and `MapScreen.tsx` (Task 14)
- [x] **getTypeConfig** exported from `TypeBadge.tsx` (Task 8) and imported in `EntityMapPin.tsx` (Task 14) — consistent

