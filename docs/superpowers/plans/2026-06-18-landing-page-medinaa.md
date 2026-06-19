# Landing page Medinaa (medinaa.mg) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une landing page trilingue, animée et SEO-first sur `medinaa.mg` qui présente le projet Medinaa et convertit vers l'app web et l'app Android (Play Store).

**Architecture:** Next.js (App Router) en SSG/ISR avec `output: standalone` pour un VPS. Thème à 3 couleurs via variables CSS HSL (single source of truth) + dark mode. i18n FR/MG/EN avec `next-intl` (+ hreflang). 11 sections inspirées de Zocdoc (hero search-first) avec animations Framer Motion. Stats réelles tirées du backend NestJS au build (avec fallback). Analytics first-party (beacon → backend).

**Tech Stack:** Next.js, TypeScript, TailwindCSS, shadcn/ui, next-intl, next-themes, framer-motion, Vitest + Testing Library, Playwright, Lighthouse CI. Backend: NestJS + TypeORM (endpoint de collecte).

**Spec source:** `docs/superpowers/specs/2026-06-18-landing-page-medinaa-design.md`

---

## Conventions

- Tous les chemins sont relatifs à la racine du repo `medinaa/`. Le projet vit dans `landing/`.
- Commandes exécutées depuis `landing/` sauf mention contraire (`cd landing`).
- Commits fréquents (1 par tâche minimum). Préfixe : `feat(landing):`, `test(landing):`, `chore(landing):`, et `feat(backend):` pour la phase 7.
- TDD strict sur la **logique** (`lib/`, hooks, route handlers, service backend). Pour les **composants purement visuels**, un test de rendu/contenu (smoke) suffit — c'est le bon niveau de test pour du présentationnel (on ne teste pas des pixels).

---

## File Structure

```
landing/
  app/
    [locale]/
      layout.tsx              # html/body, providers, lang, JSON-LD org/website
      page.tsx                # assemble les 11 sections + beacon pageview
      opengraph-image.tsx     # image OG générée (next/og)
    api/
      track/route.ts          # forward du beacon analytics vers le backend
    sitemap.ts                # sitemap par locale
    robots.ts                 # robots.txt
  components/
    layout/Header.tsx
    layout/Footer.tsx
    layout/LangSwitcher.tsx
    layout/ThemeToggle.tsx
    layout/MobileNav.tsx
    sections/Hero.tsx
    sections/SearchBarMock.tsx
    sections/TrustBar.tsx
    sections/BentoStats.tsx
    sections/Features.tsx
    sections/HowItWorks.tsx
    sections/AppShowcase.tsx
    sections/DeviceMockup.tsx
    sections/MapCoverage.tsx
    sections/Faq.tsx
    sections/CtaSection.tsx
    cta/AppCtas.tsx           # CTA device-aware (web app + Play Store), réutilisé
    motion/MotionReveal.tsx
    stats/CountUp.tsx
    seo/JsonLd.tsx
    analytics/AnalyticsBeacon.tsx
    providers/ThemeProvider.tsx
    ui/                       # composants shadcn (button, card, accordion, sheet, dropdown-menu, badge, separator, tabs)
  i18n/
    routing.ts
    navigation.ts
    request.ts
  lib/
    env.ts                    # lecture typée des variables d'env
    cn.ts                     # util shadcn (clsx + tailwind-merge)
    device.ts                 # isAndroidUA + useIsAndroid
    stats.ts                  # getStats + FALLBACK_STATS
    analytics.ts              # buildEvent + track (sendBeacon)
    count.ts                  # clamp + easeOutCubic (pour CountUp)
    seo.ts                    # helpers metadata (alternates/hreflang)
  messages/
    fr.json                   # canonique
    en.json
    mg.json                   # à valider par l'équipe
  public/
    mockups/                  # placeholders (web + mobile)
  tests/                      # tests Vitest (*.test.ts/tsx)
  e2e/                        # tests Playwright
  globals.css                # variables HSL (light + .dark) + base Tailwind
  tailwind.config.ts
  next.config.mjs
  middleware.ts
  vitest.config.ts
  vitest.setup.ts
  playwright.config.ts
  lighthouserc.json
  Dockerfile
  Caddyfile
  .env.example
  components.json             # config shadcn

backend/src/analytics/        # phase 7 (NestJS)
  analytics-event.entity.ts
  analytics.service.ts
  analytics.controller.ts
  analytics.module.ts
```

---

# Phase 0 — Bootstrap & configuration

### Task 0.1 : Scaffolder le projet Next.js

**Files:**
- Create: `landing/` (via create-next-app)

- [ ] **Step 1: Générer le projet**

Run (depuis `medinaa/`):
```bash
npx create-next-app@latest landing --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```
Répondre « No » à Turbopack si demandé (on reste sur le bundler stable).
Expected: dossier `landing/` créé avec `app/`, `tailwind.config.ts`, `next.config.mjs`.

- [ ] **Step 2: Nettoyer le boilerplate**

Supprimer le contenu de démo et déplacer `globals.css` à la racine du projet (le layout l'importera via `@/globals.css`) :
```bash
cd landing && rm -f app/page.tsx app/favicon.ico && rm -rf app/fonts
git mv app/globals.css globals.css 2>/dev/null || mv app/globals.css globals.css
```
Le contenu de `globals.css` sera réécrit en Phase 1.

- [ ] **Step 3: Vérifier le démarrage**

Run: `cd landing && npm run dev`
Expected: serveur sur http://localhost:3001 (préciser le port plus bas), pas d'erreur. Arrêter (Ctrl-C).

- [ ] **Step 4: Fixer le port dev sur 3001** (le backend occupe 3000)

Modifier `landing/package.json` script `dev` :
```json
"dev": "next dev -p 3001",
```

- [ ] **Step 5: Commit**

```bash
cd landing && git add -A && git commit -m "chore(landing): scaffold Next.js App Router + Tailwind"
```

---

### Task 0.2 : `next.config.mjs` (standalone + images)

**Files:**
- Modify: `landing/next.config.mjs`

- [ ] **Step 1: Écrire la config**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
};

export default nextConfig;
```
(Le plugin next-intl sera ajouté en Task 2.1.)

- [ ] **Step 2: Commit**

```bash
git add next.config.mjs && git commit -m "chore(landing): output standalone + image formats"
```

---

### Task 0.3 : Outillage de test (Vitest + RTL + jsdom)

**Files:**
- Create: `landing/vitest.config.ts`, `landing/vitest.setup.ts`, `landing/tests/smoke.test.ts`
- Modify: `landing/package.json`

- [ ] **Step 1: Installer les deps**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
```

- [ ] **Step 3: `vitest.setup.ts`** (jest-dom + mocks jsdom requis par next-themes & framer-motion)

```ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// matchMedia — utilisé par next-themes et framer-motion (useReducedMotion)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// IntersectionObserver — utilisé par framer-motion (useInView / whileInView)
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal('IntersectionObserver', IO);
```

- [ ] **Step 4: Scripts**

Ajouter à `package.json` :
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Test de fumée (vérifie l'infra)** — `tests/smoke.test.ts`

```ts
import { describe, it, expect } from 'vitest';

describe('infra', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Lancer**

Run: `npm test`
Expected: 1 test passé.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "test(landing): setup Vitest + Testing Library"
```

---

### Task 0.4 : Config d'environnement typée

**Files:**
- Create: `landing/lib/env.ts`, `landing/.env.example`, `landing/.env.local`

- [ ] **Step 1: `.env.example`**

```
# URL serveur du backend NestJS (utilisée au build pour les stats + forward analytics)
BACKEND_API_URL=http://localhost:3000
# URL publique de l'app web client
NEXT_PUBLIC_WEB_APP_URL=https://app.medinaa.mg
# URL de la fiche Play Store (à remplir au lancement)
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=mg.medinaa
# URL canonique du site
NEXT_PUBLIC_SITE_URL=https://medinaa.mg
```

- [ ] **Step 2: `.env.local`** (copie locale, non commitée — déjà gitignored par Next)

Mêmes clés que `.env.example` avec les valeurs dev.

- [ ] **Step 3: `lib/env.ts`**

```ts
export const env = {
  backendApiUrl: process.env.BACKEND_API_URL ?? '',
  webAppUrl: process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'https://app.medinaa.mg',
  playStoreUrl:
    process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
    'https://play.google.com/store/apps/details?id=mg.medinaa',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://medinaa.mg',
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add lib/env.ts .env.example && git commit -m "chore(landing): typed env config"
```

---

# Phase 1 — Design system (thème 3 couleurs)

### Task 1.1 : Variables HSL + Tailwind (light + dark)

**Files:**
- Modify: `landing/globals.css`, `landing/tailwind.config.ts`
- Create: `landing/lib/cn.ts`

- [ ] **Step 1: `lib/cn.ts`** (util shadcn)

```bash
npm i clsx tailwind-merge
```
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: `globals.css` — variables + base**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --primary: 207 85% 41%;        /* #1070C0 */
    --primary-foreground: 0 0% 100%;
    --secondary: 160 84% 34%;      /* #0E9F6E */
    --secondary-foreground: 0 0% 100%;
    --tertiary: 38 92% 50%;        /* #F59E0B */
    --tertiary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 207 85% 41%;
    --radius: 0.75rem;
  }
  .dark {
    --background: 222 47% 7%;
    --foreground: 210 40% 98%;
    --card: 222 47% 10%;
    --card-foreground: 210 40% 98%;
    --primary: 207 85% 58%;
    --primary-foreground: 222 47% 9%;
    --secondary: 160 70% 45%;
    --secondary-foreground: 222 47% 9%;
    --tertiary: 38 92% 55%;
    --tertiary-foreground: 222 47% 9%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --border: 217 33% 20%;
    --input: 217 33% 20%;
    --ring: 207 85% 58%;
  }
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
  :focus-visible { @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background; }
}
```

- [ ] **Step 3: `tailwind.config.ts` — mapper les vars avec `<alpha-value>`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary) / <alpha-value>)',
          foreground: 'hsl(var(--tertiary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
```
```bash
npm i -D tailwindcss-animate
```

- [ ] **Step 4: Commit**

```bash
git add globals.css tailwind.config.ts lib/cn.ts package.json && git commit -m "feat(landing): theme system (3 HSL colors + dark mode)"
```

---

### Task 1.2 : Polices (next/font)

**Files:**
- Create: `landing/lib/fonts.ts`

- [ ] **Step 1: `lib/fonts.ts`**

```ts
import { Figtree } from 'next/font/google';

export const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
```
(Police display optionnelle à ajouter plus tard via ui-ux-pro-max ; Figtree couvre titres + texte au lancement.)

- [ ] **Step 2: Étendre la font dans Tailwind**

Dans `tailwind.config.ts`, sous `theme.extend`, ajouter :
```ts
fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
```

- [ ] **Step 3: Commit**

```bash
git add lib/fonts.ts tailwind.config.ts && git commit -m "feat(landing): Figtree via next/font"
```

---

### Task 1.3 : ThemeProvider + ThemeToggle

**Files:**
- Create: `landing/components/providers/ThemeProvider.tsx`, `landing/components/layout/ThemeToggle.tsx`, `landing/tests/theme-toggle.test.tsx`

- [ ] **Step 1: Installer next-themes + icônes**

```bash
npm i next-themes lucide-react
```

- [ ] **Step 2: `ThemeProvider.tsx`**

```tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

- [ ] **Step 3: Test (TDD)** — `tests/theme-toggle.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const setTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme, resolvedTheme: 'light' }),
}));

describe('ThemeToggle', () => {
  it('bascule en sombre au clic', async () => {
    render(<ThemeToggle label="Changer de thème" />);
    await userEvent.click(screen.getByRole('button', { name: 'Changer de thème' }));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
```

- [ ] **Step 4: Run (doit échouer)**

Run: `npm test -- theme-toggle`
Expected: FAIL (module `ThemeToggle` introuvable).

- [ ] **Step 5: `ThemeToggle.tsx`**

```tsx
'use client';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted"
    >
      {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
```

- [ ] **Step 6: Run (doit passer)**

Run: `npm test -- theme-toggle`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(landing): theme provider + toggle (light default)"
```

---

# Phase 2 — Internationalisation (FR / MG / EN)

### Task 2.1 : Config next-intl + middleware + plugin

**Files:**
- Create: `landing/i18n/routing.ts`, `landing/i18n/navigation.ts`, `landing/i18n/request.ts`, `landing/middleware.ts`
- Modify: `landing/next.config.mjs`

- [ ] **Step 1: Installer**

```bash
npm i next-intl
```

- [ ] **Step 2: `i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'mg', 'en'],
  defaultLocale: 'fr',
});
```

- [ ] **Step 3: `i18n/navigation.ts`**

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 4: `i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: `middleware.ts`**

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 6: Brancher le plugin dans `next.config.mjs`**

```js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { formats: ['image/avif', 'image/webp'] },
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Commit**

```bash
git add i18n middleware.ts next.config.mjs package.json && git commit -m "feat(landing): next-intl routing + middleware (fr/mg/en)"
```

---

### Task 2.2 : Dictionnaires de messages

**Files:**
- Create: `landing/messages/fr.json`, `landing/messages/en.json`, `landing/messages/mg.json`

- [ ] **Step 1: `messages/fr.json`** (canonique)

```json
{
  "Meta": {
    "title": "Medinaa — L'annuaire santé de Madagascar",
    "description": "L'annuaire des établissements de santé de Madagascar — gratuit, géolocalisé : hôpitaux, pharmacies, médecins, dispensaires et CSB sur une carte.",
    "tagline": "Toute la santé de Madagascar, sur une carte."
  },
  "Nav": {
    "features": "Fonctionnalités",
    "how": "Comment ça marche",
    "coverage": "Couverture",
    "faq": "FAQ",
    "openWebApp": "Ouvrir l'app web",
    "themeToggle": "Changer de thème",
    "menu": "Menu"
  },
  "Hero": {
    "title": "Trouvez les soins dont vous avez besoin, où que vous soyez à Madagascar.",
    "subtitle": "Hôpitaux, pharmacies, médecins, dispensaires, CSB… {count}+ établissements géolocalisés, gratuitement. Sur le web et sur Android.",
    "searchPlaceholderType": "Hôpital, pharmacie, médecin…",
    "searchPlaceholderCity": "Ville ou commune",
    "searchButton": "Rechercher"
  },
  "Cta": {
    "webApp": "Ouvrir l'app web",
    "playStore": "Disponible sur Google Play",
    "androidHint": "Sur Android ? Profitez de l'app native.",
    "finalTitle": "Trouvez un établissement de santé maintenant.",
    "finalSubtitle": "Gratuit, sans compte, partout à Madagascar."
  },
  "Trust": {
    "osm": "Données ouvertes OpenStreetMap",
    "national": "Couverture nationale",
    "free": "100 % gratuit",
    "noAccount": "Sans compte"
  },
  "Stats": {
    "title": "Une base de données qui couvre tout le pays",
    "total": "établissements référencés",
    "cities": "villes & communes",
    "withPhone": "avec un numéro de téléphone",
    "withHours": "avec des horaires d'ouverture",
    "byType": "Par type d'établissement"
  },
  "Features": {
    "title": "Pourquoi Medinaa",
    "searchTitle": "Recherche & filtres",
    "searchBody": "Filtrez par type : hôpital, pharmacie, médecin, dispensaire, CSB…",
    "nearMeTitle": "Près de moi",
    "nearMeBody": "Géolocalisez les établissements les plus proches en un tap.",
    "mapTitle": "Carte interactive",
    "mapBody": "Explorez tout Madagascar sur une carte fluide.",
    "detailsTitle": "Fiches détaillées",
    "detailsBody": "Téléphone, horaires, adresse et lien OpenStreetMap.",
    "routeTitle": "Itinéraire",
    "routeBody": "Calculez votre trajet avec un point de départ personnalisable.",
    "i18nTitle": "Multilingue",
    "i18nBody": "Disponible en français, malgache et anglais."
  },
  "How": {
    "title": "Comment ça marche",
    "step1Title": "Cherchez",
    "step1Body": "Indiquez un type d'établissement et un lieu.",
    "step2Title": "Explorez",
    "step2Body": "Parcourez la carte et la liste des résultats.",
    "step3Title": "Contactez",
    "step3Body": "Appelez l'établissement ou lancez l'itinéraire."
  },
  "Showcase": {
    "title": "Sur le web et dans votre poche",
    "body": "La même base de données, sur l'app web et sur Android.",
    "webAlt": "Aperçu de l'app web Medinaa",
    "mobileAlt": "Aperçu de l'app mobile Medinaa"
  },
  "Coverage": {
    "title": "Toute l'île couverte",
    "body": "Des grandes villes aux communes rurales, partout à Madagascar."
  },
  "Faq": {
    "title": "Questions fréquentes",
    "q1": "Medinaa est-il gratuit ?",
    "a1": "Oui, Medinaa est 100 % gratuit et ne nécessite aucun compte.",
    "q2": "D'où viennent les données ?",
    "a2": "Les données proviennent d'OpenStreetMap, une base cartographique ouverte et collaborative.",
    "q3": "Existe-t-il une app iOS ?",
    "a3": "Pour l'instant l'app native est sur Android. Sur iPhone, utilisez l'app web qui fonctionne dans le navigateur.",
    "q4": "Comment signaler une erreur sur un établissement ?",
    "a4": "Vous pouvez contribuer directement sur OpenStreetMap ou nous contacter.",
    "q5": "Quelle différence entre l'app web et l'app mobile ?",
    "a5": "L'app web marche partout sans installation ; l'app Android offre une expérience native (géolocalisation, hors-ligne, notifications)."
  },
  "Footer": {
    "about": "À propos",
    "contact": "Contact",
    "legal": "Mentions légales",
    "privacy": "Confidentialité",
    "osmAttribution": "Données © contributeurs OpenStreetMap (licence ODbL)",
    "rights": "Tous droits réservés."
  }
}
```

- [ ] **Step 2: `messages/en.json`** (traduction complète)

Reproduire la même structure de clés que `fr.json` avec les valeurs anglaises. Exemples clés :
```json
{
  "Meta": {
    "title": "Medinaa — Madagascar's healthcare directory",
    "description": "Madagascar's healthcare directory — free and geolocated: hospitals, pharmacies, doctors, health posts and CSBs on one map.",
    "tagline": "All of Madagascar's healthcare, on one map."
  },
  "Hero": {
    "title": "Find the care you need, wherever you are in Madagascar.",
    "subtitle": "Hospitals, pharmacies, doctors, health posts, CSBs… {count}+ geolocated facilities, for free. On the web and on Android.",
    "searchPlaceholderType": "Hospital, pharmacy, doctor…",
    "searchPlaceholderCity": "City or town",
    "searchButton": "Search"
  }
}
```
> ⚠️ Compléter **toutes** les clés présentes dans `fr.json` (Nav, Cta, Trust, Stats, Features, How, Showcase, Coverage, Faq, Footer). Aucune clé manquante (next-intl lèvera une erreur en strict).

- [ ] **Step 3: `messages/mg.json`** (placeholder structuré — à valider par l'équipe)

Copier `fr.json` à l'identique comme base, puis remplacer les valeurs par les traductions malgaches. **Marqueur en tête de fichier impossible en JSON** → créer un fichier `messages/mg.TODO.md` :
```md
# Traductions MG à valider
Le fichier messages/mg.json contient pour l'instant une copie du FR.
À faire relire/traduire par un locuteur natif avant mise en prod.
Clés prioritaires : Meta.*, Hero.*, Cta.*, Nav.*.
```
Et `messages/mg.json` = copie de `fr.json` (évite les clés manquantes) en attendant la validation.

- [ ] **Step 4: Commit**

```bash
git add messages && git commit -m "feat(landing): i18n message catalogs (fr canonical, en, mg-todo)"
```

---

### Task 2.3 : Layout localisé + page squelette

**Files:**
- Create: `landing/app/[locale]/layout.tsx`, `landing/app/[locale]/page.tsx`
- Create: `landing/tests/locale-page.test.tsx`

- [ ] **Step 1: `app/[locale]/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { figtree } from '@/lib/fonts';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import '@/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={figtree.variable}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```
> Supprimer `app/layout.tsx` racine s'il existe encore (le layout est par locale).

- [ ] **Step 2: `app/[locale]/page.tsx` (squelette)**

```tsx
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Hero');
  return (
    <main>
      <h1>{t('title')}</h1>
    </main>
  );
}
```

- [ ] **Step 3: Test (TDD)** — `tests/locale-page.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import messages from '@/messages/fr.json';

function Title() {
  return <h1>{messages.Hero.title}</h1>;
}

describe('localized title', () => {
  it('rend le titre FR du hero', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Title />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole('heading', { name: messages.Hero.title }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run + vérifier rendu dev**

Run: `npm test -- locale-page` → PASS.
Run: `npm run dev` puis ouvrir `http://localhost:3001/fr`, `/en`, `/mg`. Expected: titre traduit, pas d'erreur console.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): localized layout + skeleton home page"
```

---

### Task 2.4 : LangSwitcher

**Files:**
- Create: `landing/components/layout/LangSwitcher.tsx`, `landing/components/ui/dropdown-menu.tsx` (shadcn)
- Test: `landing/tests/lang-switcher.test.tsx`

- [ ] **Step 1: Config shadcn (manuelle, pour ne pas écraser notre thème) + dropdown-menu**

Créer `landing/components.json` (l'alias `utils` pointe vers notre `lib/cn.ts`) :
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components/ui"
  },
  "iconLibrary": "lucide"
}
```
Puis ajouter le composant (NE PAS lancer `init`, qui écraserait `globals.css`/`tailwind.config.ts`) :
```bash
npx shadcn@latest add dropdown-menu
```
shadcn génère `components/ui/dropdown-menu.tsx` important `cn` depuis `@/lib/cn` (grâce à l'alias `utils`) et installe les deps Radix. Si la commande propose d'écraser `globals.css`/`tailwind.config.ts`, refuser ; au besoin `git checkout -- globals.css tailwind.config.ts`.

- [ ] **Step 2: Test (TDD)** — `tests/lang-switcher.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LangSwitcher } from '@/components/layout/LangSwitcher';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('LangSwitcher', () => {
  it('liste les 3 langues', () => {
    render(<LangSwitcher current="fr" />);
    expect(screen.getByText('FR')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run (échec attendu)** → `npm test -- lang-switcher` : FAIL.

- [ ] **Step 4: `LangSwitcher.tsx`**

```tsx
'use client';
import { Globe } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALES = [
  { code: 'fr', label: 'FR' },
  { code: 'mg', label: 'MG' },
  { code: 'en', label: 'EN' },
] as const;

export function LangSwitcher({ current }: { current: string }) {
  const pathname = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2 text-sm hover:bg-muted">
        <Globe className="h-4 w-4" />
        {LOCALES.find((l) => l.code === current)?.label ?? 'FR'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l.code} asChild>
            <Link href={pathname} locale={l.code}>
              {l.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 5: Run** → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(landing): language switcher (fr/mg/en)"
```

---

# Phase 3 — Logique cœur (TDD)

### Task 3.1 : Détection Android

**Files:**
- Create: `landing/lib/device.ts`, `landing/tests/device.test.ts`

- [ ] **Step 1: Test (TDD)** — `tests/device.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { isAndroidUA } from '@/lib/device';

describe('isAndroidUA', () => {
  it('détecte Android', () => {
    expect(isAndroidUA('Mozilla/5.0 (Linux; Android 13; Pixel 7)')).toBe(true);
  });
  it('exclut Windows Phone', () => {
    expect(isAndroidUA('Mozilla/5.0 (Windows Phone 10; Android)')).toBe(false);
  });
  it('renvoie false sur iPhone', () => {
    expect(isAndroidUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe(false);
  });
});
```

- [ ] **Step 2: Run (échec)** → `npm test -- device` : FAIL.

- [ ] **Step 3: `lib/device.ts`**

```ts
export function isAndroidUA(ua: string): boolean {
  return /android/i.test(ua) && !/windows phone/i.test(ua);
}

import { useEffect, useState } from 'react';
export function useIsAndroid(): boolean {
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => {
    setIsAndroid(isAndroidUA(navigator.userAgent));
  }, []);
  return isAndroid;
}
```
> Note: le hook est `'use client'` côté consommateur ; garder le fichier importable côté test (la fonction pure n'utilise pas React).

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): android detection (pure fn + hook)"
```

---

### Task 3.2 : Récupération des stats (avec fallback)

**Files:**
- Create: `landing/lib/stats.ts`, `landing/tests/stats.test.ts`

- [ ] **Step 1: Test (TDD)** — `tests/stats.test.ts`

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getStats, FALLBACK_STATS } from '@/lib/stats';

afterEach(() => vi.restoreAllMocks());

describe('getStats', () => {
  it('fusionne la réponse backend avec le fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total: 2500, withPhone: 800 }),
      }),
    );
    const s = await getStats('http://backend');
    expect(s.total).toBe(2500);
    expect(s.withPhone).toBe(800);
    expect(s.byType).toEqual(FALLBACK_STATS.byType); // champ absent => fallback
  });

  it('renvoie le fallback si la requête échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    const s = await getStats('http://backend');
    expect(s).toEqual(FALLBACK_STATS);
  });

  it('renvoie le fallback si pas d’URL', async () => {
    const s = await getStats('');
    expect(s).toEqual(FALLBACK_STATS);
  });
});
```

- [ ] **Step 2: Run (échec)** → `npm test -- stats` : FAIL.

- [ ] **Step 3: `lib/stats.ts`**

```ts
export interface MedinaaStats {
  total: number;
  byType: Record<string, number>;
  withPhone: number;
  withHours: number;
  cities: number;
}

export const FALLBACK_STATS: MedinaaStats = {
  total: 2173,
  byType: {
    hospital: 320,
    pharmacy: 540,
    doctors: 410,
    clinic: 180,
    dentist: 90,
    health_post: 260,
    dispensary: 173,
  },
  withPhone: 610,
  withHours: 430,
  cities: 220,
};

export async function getStats(
  backendUrl: string = process.env.BACKEND_API_URL ?? '',
): Promise<MedinaaStats> {
  if (!backendUrl) return FALLBACK_STATS;
  try {
    const res = await fetch(`${backendUrl}/api/places/stats`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return FALLBACK_STATS;
    const data = await res.json();
    return { ...FALLBACK_STATS, ...data };
  } catch {
    return FALLBACK_STATS;
  }
}
```
> Si le backend renvoie `byType` comme tableau `[{type,count}]`, ajouter une normalisation ici. Vérifier le format réel via `GET /api/places/stats` avant impl (cf. spec backend).

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): stats fetch with robust fallback"
```

---

### Task 3.3 : Analytics client (buildEvent + track)

**Files:**
- Create: `landing/lib/analytics.ts`, `landing/tests/analytics.test.ts`

- [ ] **Step 1: Test (TDD)** — `tests/analytics.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { buildEvent, track } from '@/lib/analytics';

describe('buildEvent', () => {
  it('construit un event normalisé', () => {
    const e = buildEvent({ name: 'cta_click', locale: 'fr', path: '/fr', meta: { target: 'web_app' } });
    expect(e).toMatchObject({ name: 'cta_click', locale: 'fr', path: '/fr' });
    expect(e.meta).toEqual({ target: 'web_app' });
  });
});

describe('track', () => {
  it('utilise sendBeacon vers /api/track', () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { sendBeacon });
    track({ name: 'pageview', locale: 'fr', path: '/fr' });
    expect(sendBeacon).toHaveBeenCalledWith('/api/track', expect.anything());
  });
});
```

- [ ] **Step 2: Run (échec)** → `npm test -- analytics` : FAIL.

- [ ] **Step 3: `lib/analytics.ts`**

```ts
export type TrackEventName = 'pageview' | 'cta_click';

export interface TrackEvent {
  name: TrackEventName;
  locale: string;
  path: string;
  referrer?: string;
  device?: string;
  meta?: Record<string, unknown>;
}

export function buildEvent(input: TrackEvent): TrackEvent {
  return {
    name: input.name,
    locale: input.locale,
    path: input.path,
    referrer: input.referrer,
    device: input.device,
    meta: input.meta,
  };
}

export function track(input: TrackEvent): void {
  if (typeof navigator === 'undefined') return;
  const body = JSON.stringify(buildEvent(input));
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/track', {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    }).catch(() => {});
  }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): first-party analytics client (sendBeacon)"
```

---

### Task 3.4 : Route handler `/api/track` (forward backend)

**Files:**
- Create: `landing/app/api/track/route.ts`, `landing/tests/track-route.test.ts`

- [ ] **Step 1: Test (TDD)** — `tests/track-route.test.ts`

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/track/route';

afterEach(() => vi.restoreAllMocks());

function req(body: unknown) {
  return new Request('http://localhost/api/track', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/track', () => {
  it('forward vers le backend et renvoie 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('BACKEND_API_URL', 'http://backend');
    const res = await POST(req({ name: 'pageview', locale: 'fr', path: '/fr' }));
    expect(res.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend/api/analytics/events',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('renvoie 204 même sans backend configuré', async () => {
    vi.stubEnv('BACKEND_API_URL', '');
    const res = await POST(req({ name: 'pageview', locale: 'fr', path: '/fr' }));
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run (échec)** → `npm test -- track-route` : FAIL.

- [ ] **Step 3: `app/api/track/route.ts`**

```ts
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
  const backendUrl = process.env.BACKEND_API_URL ?? '';
  const body = await request.text();
  if (backendUrl) {
    try {
      await fetch(`${backendUrl}/api/analytics/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
    } catch {
      // silencieux : l'analytics ne doit jamais casser l'UX
    }
  }
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): /api/track route forwarding to backend"
```

---

### Task 3.5 : MotionReveal (Framer Motion, reduced-motion aware)

**Files:**
- Create: `landing/components/motion/MotionReveal.tsx`, `landing/tests/motion-reveal.test.tsx`

- [ ] **Step 1: Installer**

```bash
npm i framer-motion
```

- [ ] **Step 2: Test (TDD)** — `tests/motion-reveal.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MotionReveal } from '@/components/motion/MotionReveal';

describe('MotionReveal', () => {
  it('rend ses enfants', () => {
    render(<MotionReveal><p>contenu</p></MotionReveal>);
    expect(screen.getByText('contenu')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run (échec)** → FAIL.

- [ ] **Step 4: `MotionReveal.tsx`**

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function MotionReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Run** → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(landing): MotionReveal scroll animation (reduced-motion safe)"
```

---

### Task 3.6 : CountUp (compteur animé)

**Files:**
- Create: `landing/lib/count.ts`, `landing/components/stats/CountUp.tsx`, `landing/tests/count.test.ts`

- [ ] **Step 1: Test (TDD)** — `tests/count.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { clamp, easeOutCubic } from '@/lib/count';

describe('count helpers', () => {
  it('clamp borne la valeur', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(42, 0, 100)).toBe(42);
  });
  it('easeOutCubic démarre à 0 et finit à 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `lib/count.ts`**

```ts
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: `components/stats/CountUp.tsx`**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { easeOutCubic } from '@/lib/count';

export function CountUp({
  to,
  duration = 1500,
  suffix = '',
}: {
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = (now - start) / duration;
      setValue(Math.round(easeOutCubic(progress) * to));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(landing): animated CountUp + easing helpers"
```

---

# Phase 4 — Layout (header / footer)

### Task 4.1 : AppCtas (CTA device-aware réutilisable)

**Files:**
- Create: `landing/components/cta/AppCtas.tsx`, `landing/tests/app-ctas.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/app-ctas.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { AppCtas } from '@/components/cta/AppCtas';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

function wrap(ui: React.ReactNode) {
  return <NextIntlClientProvider locale="fr" messages={messages}>{ui}</NextIntlClientProvider>;
}

describe('AppCtas', () => {
  it('affiche les deux CTA avec les bonnes URLs', () => {
    render(wrap(<AppCtas locale="fr" />));
    const web = screen.getByRole('link', { name: messages.Cta.webApp });
    expect(web).toHaveAttribute('href', expect.stringContaining('app.medinaa.mg'));
    const play = screen.getByRole('link', { name: messages.Cta.playStore });
    expect(play).toHaveAttribute('href', expect.stringContaining('play.google.com'));
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/cta/AppCtas.tsx`**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { useIsAndroid } from '@/lib/device';
import { track } from '@/lib/analytics';

export function AppCtas({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const t = useTranslations('Cta');
  const isAndroid = useIsAndroid();

  const web = (
    <a
      key="web"
      href={env.webAppUrl}
      onClick={() => track({ name: 'cta_click', locale, path: location.pathname, device: isAndroid ? 'android' : 'other', meta: { target: 'web_app' } })}
      className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
    >
      {t('webApp')}
    </a>
  );

  const play = (
    <a
      key="play"
      href={env.playStoreUrl}
      onClick={() => track({ name: 'cta_click', locale, path: location.pathname, device: isAndroid ? 'android' : 'other', meta: { target: 'play_store' } })}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-6 font-semibold transition hover:bg-muted"
    >
      {t('playStore')}
    </a>
  );

  // Android : Play Store mis en avant (priorité visuelle inversée)
  const order = isAndroid ? [play, web] : [web, play];

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      {order}
    </div>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): device-aware app CTAs"
```

---

### Task 4.2 : Header + MobileNav

**Files:**
- Create: `landing/components/layout/Header.tsx`, `landing/components/layout/MobileNav.tsx`
- Create: `landing/components/ui/sheet.tsx` (shadcn)
- Test: `landing/tests/header.test.tsx`

- [ ] **Step 1: Ajouter shadcn sheet**

```bash
npx shadcn@latest add sheet
```

- [ ] **Step 2: Test (TDD)** — `tests/header.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Header } from '@/components/layout/Header';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }) }));
vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

describe('Header', () => {
  it('affiche les liens de navigation', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Header locale="fr" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.Nav.features)).toBeInTheDocument();
    expect(screen.getByText(messages.Nav.faq)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run (échec)** → FAIL.

- [ ] **Step 4: `components/layout/Header.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { MobileNav } from './MobileNav';

const ANCHORS = [
  { id: 'features', key: 'features' },
  { id: 'how', key: 'how' },
  { id: 'coverage', key: 'coverage' },
  { id: 'faq', key: 'faq' },
] as const;

export function Header({ locale }: { locale: string }) {
  const t = useTranslations('Nav');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors',
        scrolled ? 'border-b border-border bg-background/80 backdrop-blur' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href={`/${locale}`} className="text-lg font-bold tracking-tight text-primary">
          Medinaa
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {ANCHORS.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="text-sm text-muted-foreground hover:text-foreground">
              {t(a.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitcher current={locale} />
          <ThemeToggle label={t('themeToggle')} />
          <a
            href={env.webAppUrl}
            className="hidden h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:inline-flex"
          >
            {t('openWebApp')}
          </a>
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: `components/layout/MobileNav.tsx`**

```tsx
'use client';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { env } from '@/lib/env';
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from '@/components/ui/sheet';

const ANCHORS = ['features', 'how', 'coverage', 'faq'] as const;

export function MobileNav({ locale }: { locale: string }) {
  const t = useTranslations('Nav');
  return (
    <Sheet>
      <SheetTrigger aria-label={t('menu')} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden">
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
        <nav className="mt-8 flex flex-col gap-4">
          {ANCHORS.map((a) => (
            <a key={a} href={`#${a}`} className="text-base">{t(a)}</a>
          ))}
          <a href={env.webAppUrl} className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
            {t('openWebApp')}
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 6: Run** → PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(landing): sticky header + mobile nav"
```

---

### Task 4.3 : Footer

**Files:**
- Create: `landing/components/layout/Footer.tsx`, `landing/tests/footer.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/footer.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  it('affiche l’attribution OpenStreetMap', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Footer locale="fr" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.Footer.osmAttribution)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/layout/Footer.tsx`**

```tsx
import { useTranslations } from 'next-intl';
import { LangSwitcher } from './LangSwitcher';

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations('Footer');
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="text-lg font-bold text-primary">Medinaa</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t('osmAttribution')}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <a href={`/${locale}/about`} className="hover:text-primary">{t('about')}</a>
            <a href={`/${locale}/contact`} className="hover:text-primary">{t('contact')}</a>
            <a href={`/${locale}/legal`} className="hover:text-primary">{t('legal')}</a>
            <a href={`/${locale}/privacy`} className="hover:text-primary">{t('privacy')}</a>
          </nav>
          <LangSwitcher current={locale} />
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Medinaa. {t('rights')}
        </p>
      </div>
    </footer>
  );
}
```
> Les pages `about/contact/legal/privacy` sont des stubs (Task 6.5) — liens prêts dès maintenant.

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): footer + OSM attribution"
```

---

# Phase 5 — Sections

> Pour chaque section : composant complet + test de rendu (smoke) qui vérifie un contenu clé. Toutes les sections enveloppent leurs blocs dans `MotionReveal`. Les `id` correspondent aux ancres du header.

### Task 5.1 : SearchBarMock

**Files:**
- Create: `landing/components/sections/SearchBarMock.tsx`, `landing/tests/search-bar.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/search-bar.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { SearchBarMock } from '@/components/sections/SearchBarMock';

describe('SearchBarMock', () => {
  it('construit un lien deep-link vers l’app web avec la requête', async () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <SearchBarMock locale="fr" />
      </NextIntlClientProvider>,
    );
    await userEvent.type(screen.getByPlaceholderText(messages.Hero.searchPlaceholderType), 'pharmacie');
    const link = screen.getByRole('link', { name: messages.Hero.searchButton });
    expect(link.getAttribute('href')).toContain('q=pharmacie');
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/sections/SearchBarMock.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { env } from '@/lib/env';

export function SearchBarMock({ locale }: { locale: string }) {
  const t = useTranslations('Hero');
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (city) params.set('city', city);
  const href = `${env.webAppUrl}/?${params.toString()}`;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row">
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholderType')}
          className="h-12 w-full bg-transparent outline-none"
          aria-label={t('searchPlaceholderType')}
        />
      </div>
      <div className="flex flex-1 items-center gap-2 border-border px-3 sm:border-l">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('searchPlaceholderCity')}
          className="h-12 w-full bg-transparent outline-none"
          aria-label={t('searchPlaceholderCity')}
        />
      </div>
      <a
        href={href}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-tertiary px-6 font-semibold text-tertiary-foreground hover:bg-tertiary/90"
      >
        {t('searchButton')}
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(landing): hero search bar (deep-link to web app)"`

---

### Task 5.2 : Hero

**Files:**
- Create: `landing/components/sections/Hero.tsx`, `landing/tests/hero.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/hero.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Hero } from '@/components/sections/Hero';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

describe('Hero', () => {
  it('rend le titre et le compte d’établissements', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Hero locale="fr" total={2173} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: messages.Hero.title })).toBeInTheDocument();
    expect(screen.getByText(/2\s?173/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/sections/Hero.tsx`**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { AppCtas } from '@/components/cta/AppCtas';
import { SearchBarMock } from './SearchBarMock';

export function Hero({ locale, total }: { locale: string; total: number }) {
  const t = useTranslations('Hero');
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <MotionReveal>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
        </MotionReveal>
        <MotionReveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            {t('subtitle', { count: total.toLocaleString('fr-FR') })}
          </p>
        </MotionReveal>
        <MotionReveal delay={0.2}>
          <div className="mt-8 max-w-2xl">
            <SearchBarMock locale={locale} />
          </div>
        </MotionReveal>
        <MotionReveal delay={0.3}>
          <AppCtas locale={locale} className="mt-6" />
        </MotionReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(landing): hero section"`

---

### Task 5.3 : TrustBar

**Files:**
- Create: `landing/components/sections/TrustBar.tsx`, `landing/tests/trust-bar.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/trust-bar.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { TrustBar } from '@/components/sections/TrustBar';

describe('TrustBar', () => {
  it('affiche les 4 signaux de confiance', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><TrustBar /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Trust.osm)).toBeInTheDocument();
    expect(screen.getByText(messages.Trust.free)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/sections/TrustBar.tsx`**

```tsx
import { useTranslations } from 'next-intl';
import { Map, ShieldCheck, Gift, UserX } from 'lucide-react';

export function TrustBar() {
  const t = useTranslations('Trust');
  const items = [
    { icon: Map, label: t('osm') },
    { icon: ShieldCheck, label: t('national') },
    { icon: Gift, label: t('free') },
    { icon: UserX, label: t('noAccount') },
  ];
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-secondary" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(landing): trust bar"`

---

### Task 5.4 : BentoStats

**Files:**
- Create: `landing/components/sections/BentoStats.tsx`, `landing/tests/bento-stats.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/bento-stats.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { BentoStats } from '@/components/sections/BentoStats';
import { FALLBACK_STATS } from '@/lib/stats';

describe('BentoStats', () => {
  it('affiche le titre de section et les libellés', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <BentoStats stats={FALLBACK_STATS} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.Stats.title)).toBeInTheDocument();
    expect(screen.getByText(messages.Stats.total)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/sections/BentoStats.tsx`**

```tsx
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { CountUp } from '@/components/stats/CountUp';
import type { MedinaaStats } from '@/lib/stats';

export function BentoStats({ stats }: { stats: MedinaaStats }) {
  const t = useTranslations('Stats');
  const types = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <MotionReveal>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </MotionReveal>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionReveal className="col-span-2 rounded-2xl bg-primary p-8 text-primary-foreground lg:col-span-2 lg:row-span-2">
          <div className="text-5xl font-extrabold"><CountUp to={stats.total} suffix="+" /></div>
          <p className="mt-2 text-primary-foreground/80">{t('total')}</p>
        </MotionReveal>
        <MotionReveal delay={0.05} className="rounded-2xl border border-border bg-card p-6">
          <div className="text-3xl font-bold text-secondary"><CountUp to={stats.cities} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('cities')}</p>
        </MotionReveal>
        <MotionReveal delay={0.1} className="rounded-2xl border border-border bg-card p-6">
          <div className="text-3xl font-bold text-secondary"><CountUp to={stats.withPhone} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('withPhone')}</p>
        </MotionReveal>
        <MotionReveal delay={0.15} className="col-span-2 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">{t('byType')}</p>
          <ul className="mt-3 space-y-2">
            {types.slice(0, 5).map(([type, count]) => (
              <li key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{type}</span>
                <span className="font-semibold">{count.toLocaleString('fr-FR')}</span>
              </li>
            ))}
          </ul>
        </MotionReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(landing): bento stats section"`

---

### Task 5.5 : Features

**Files:**
- Create: `landing/components/sections/Features.tsx`, `landing/tests/features.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/features.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Features } from '@/components/sections/Features';

describe('Features', () => {
  it('rend les cartes fonctionnalités', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><Features /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Features.searchTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.Features.nearMeTitle)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/sections/Features.tsx`**

```tsx
import { useTranslations } from 'next-intl';
import { Filter, LocateFixed, Map, FileText, Route, Languages } from 'lucide-react';
import { MotionReveal } from '@/components/motion/MotionReveal';

export function Features() {
  const t = useTranslations('Features');
  const items = [
    { icon: Filter, title: t('searchTitle'), body: t('searchBody') },
    { icon: LocateFixed, title: t('nearMeTitle'), body: t('nearMeBody') },
    { icon: Map, title: t('mapTitle'), body: t('mapBody') },
    { icon: FileText, title: t('detailsTitle'), body: t('detailsBody') },
    { icon: Route, title: t('routeTitle'), body: t('routeBody') },
    { icon: Languages, title: t('i18nTitle'), body: t('i18nBody') },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <MotionReveal>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </MotionReveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body }, i) => (
          <MotionReveal key={title} delay={i * 0.05}>
            <div className="h-full rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          </MotionReveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(landing): features section"`

---

### Task 5.6 : HowItWorks

**Files:**
- Create: `landing/components/sections/HowItWorks.tsx`, `landing/tests/how.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/how.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { HowItWorks } from '@/components/sections/HowItWorks';

describe('HowItWorks', () => {
  it('rend les 3 étapes', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><HowItWorks /></NextIntlClientProvider>);
    expect(screen.getByText(messages.How.step1Title)).toBeInTheDocument();
    expect(screen.getByText(messages.How.step3Title)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/sections/HowItWorks.tsx`**

```tsx
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';

export function HowItWorks() {
  const t = useTranslations('How');
  const steps = [
    { n: 1, title: t('step1Title'), body: t('step1Body') },
    { n: 2, title: t('step2Title'), body: t('step2Body') },
    { n: 3, title: t('step3Title'), body: t('step3Body') },
  ];
  return (
    <section id="how" className="bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        </MotionReveal>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <MotionReveal key={s.n} delay={i * 0.1}>
              <div className="flex flex-col items-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(landing): how-it-works section"`

---

### Task 5.7 : DeviceMockup + AppShowcase

**Files:**
- Create: `landing/components/sections/DeviceMockup.tsx`, `landing/components/sections/AppShowcase.tsx`
- Create: `landing/public/mockups/web.svg`, `landing/public/mockups/mobile.svg`
- Test: `landing/tests/app-showcase.test.tsx`

- [ ] **Step 1: Placeholders SVG** — `public/mockups/web.svg` et `public/mockups/mobile.svg`

```xml
<!-- web.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
  <rect width="1200" height="750" fill="#E8F0FA"/>
  <rect x="0" y="0" width="1200" height="56" fill="#1070C0"/>
  <text x="40" y="36" font-family="sans-serif" font-size="24" fill="#fff">Medinaa — app web (placeholder)</text>
  <circle cx="600" cy="400" r="36" fill="#0E9F6E"/>
</svg>
```
```xml
<!-- mobile.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
  <rect width="390" height="844" rx="40" fill="#E8F0FA"/>
  <rect x="0" y="0" width="390" height="80" fill="#1070C0"/>
  <text x="24" y="48" font-family="sans-serif" font-size="20" fill="#fff">Medinaa</text>
  <circle cx="195" cy="420" r="28" fill="#0E9F6E"/>
</svg>
```

- [ ] **Step 2: Test (TDD)** — `tests/app-showcase.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { AppShowcase } from '@/components/sections/AppShowcase';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));
vi.mock('next/image', () => ({ default: (p: any) => <img alt={p.alt} src={p.src} /> }));

describe('AppShowcase', () => {
  it('rend le titre + les deux mockups (alt)', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><AppShowcase locale="fr" /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Showcase.title)).toBeInTheDocument();
    expect(screen.getByAltText(messages.Showcase.webAlt)).toBeInTheDocument();
    expect(screen.getByAltText(messages.Showcase.mobileAlt)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run (échec)** → FAIL.

- [ ] **Step 4: `components/sections/DeviceMockup.tsx`**

```tsx
import Image from 'next/image';
import { cn } from '@/lib/cn';

export function DeviceMockup({
  variant, src, alt, className,
}: {
  variant: 'browser' | 'phone';
  src: string;
  alt: string;
  className?: string;
}) {
  if (variant === 'phone') {
    return (
      <div className={cn('overflow-hidden rounded-[2.5rem] border-8 border-foreground/90 bg-foreground/90 shadow-2xl', className)}>
        <Image src={src} alt={alt} width={390} height={844} className="h-auto w-full" />
      </div>
    );
  }
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-2xl', className)}>
      <div className="flex h-8 items-center gap-1.5 border-b border-border bg-muted px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-tertiary" />
        <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
      </div>
      <Image src={src} alt={alt} width={1200} height={750} className="h-auto w-full" />
    </div>
  );
}
```

- [ ] **Step 5: `components/sections/AppShowcase.tsx`**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { AppCtas } from '@/components/cta/AppCtas';
import { DeviceMockup } from './DeviceMockup';

export function AppShowcase({ locale }: { locale: string }) {
  const t = useTranslations('Showcase');
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('body')}</p>
          <AppCtas locale={locale} className="mt-8" />
        </MotionReveal>
        <MotionReveal delay={0.1}>
          <div className="relative">
            <DeviceMockup variant="browser" src="/mockups/web.svg" alt={t('webAlt')} />
            <DeviceMockup
              variant="phone"
              src="/mockups/mobile.svg"
              alt={t('mobileAlt')}
              className="absolute -bottom-8 -right-2 w-28 sm:w-36"
            />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Run** → PASS.

- [ ] **Step 7: Commit** → `git add -A && git commit -m "feat(landing): app showcase + device mockups (placeholders)"`

---

### Task 5.8 : MapCoverage

**Files:**
- Create: `landing/components/sections/MapCoverage.tsx`, `landing/public/mockups/madagascar.svg`, `landing/tests/coverage.test.tsx`

- [ ] **Step 1: Placeholder carte** — `public/mockups/madagascar.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <path d="M200 20 C260 80 300 200 280 340 C270 460 220 560 180 580 C150 520 120 420 130 320 C140 200 150 90 200 20 Z" fill="#0E9F6E" opacity="0.15" stroke="#0E9F6E"/>
  <circle cx="190" cy="120" r="6" fill="#1070C0"/>
  <circle cx="220" cy="260" r="6" fill="#1070C0"/>
  <circle cx="180" cy="400" r="6" fill="#1070C0"/>
  <circle cx="160" cy="500" r="6" fill="#F59E0B"/>
</svg>
```

- [ ] **Step 2: Test (TDD)** — `tests/coverage.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { MapCoverage } from '@/components/sections/MapCoverage';

vi.mock('next/image', () => ({ default: (p: any) => <img alt={p.alt} src={p.src} /> }));

describe('MapCoverage', () => {
  it('rend le titre de couverture', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><MapCoverage /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Coverage.title)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run (échec)** → FAIL.

- [ ] **Step 4: `components/sections/MapCoverage.tsx`**

```tsx
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';

export function MapCoverage() {
  const t = useTranslations('Coverage');
  return (
    <section id="coverage" className="bg-muted/30">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('body')}</p>
        </MotionReveal>
        <MotionReveal delay={0.1} className="flex justify-center">
          <Image src="/mockups/madagascar.svg" alt={t('title')} width={400} height={600} className="h-auto w-64" />
        </MotionReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run** → PASS.

- [ ] **Step 6: Commit** → `git add -A && git commit -m "feat(landing): national coverage section"`

---

### Task 5.9 : FAQ (+ accordion shadcn)

**Files:**
- Create: `landing/components/sections/Faq.tsx`, `landing/components/ui/accordion.tsx` (shadcn)
- Test: `landing/tests/faq.test.tsx`

- [ ] **Step 1: Ajouter accordion**

```bash
npx shadcn@latest add accordion
```

- [ ] **Step 2: Test (TDD)** — `tests/faq.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Faq } from '@/components/sections/Faq';

describe('Faq', () => {
  it('rend les questions', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><Faq /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Faq.q1)).toBeInTheDocument();
    expect(screen.getByText(messages.Faq.q5)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run (échec)** → FAIL.

- [ ] **Step 4: `components/sections/Faq.tsx`**

```tsx
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

const QA = [
  { q: 'q1', a: 'a1' }, { q: 'q2', a: 'a2' }, { q: 'q3', a: 'a3' },
  { q: 'q4', a: 'a4' }, { q: 'q5', a: 'a5' },
] as const;

export function Faq() {
  const t = useTranslations('Faq');
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
      <MotionReveal>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </MotionReveal>
      <MotionReveal delay={0.1}>
        <Accordion type="single" collapsible className="mt-8">
          {QA.map(({ q, a }) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{t(q)}</AccordionTrigger>
              <AccordionContent>{t(a)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </MotionReveal>
    </section>
  );
}
```

- [ ] **Step 5: Run** → PASS.

- [ ] **Step 6: Commit** → `git add -A && git commit -m "feat(landing): FAQ section (accordion)"`

---

### Task 5.10 : CtaSection (bande finale)

**Files:**
- Create: `landing/components/sections/CtaSection.tsx`, `landing/tests/cta-section.test.tsx`

- [ ] **Step 1: Test (TDD)** — `tests/cta-section.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { CtaSection } from '@/components/sections/CtaSection';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

describe('CtaSection', () => {
  it('rend le titre final', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><CtaSection locale="fr" /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Cta.finalTitle)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (échec)** → FAIL.

- [ ] **Step 3: `components/sections/CtaSection.tsx`**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { AppCtas } from '@/components/cta/AppCtas';

export function CtaSection({ locale }: { locale: string }) {
  const t = useTranslations('Cta');
  return (
    <section className="bg-gradient-to-br from-primary to-secondary">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {t('finalTitle')}
          </h2>
          <p className="mt-4 text-primary-foreground/80">{t('finalSubtitle')}</p>
          <div className="mt-8 flex justify-center">
            <AppCtas locale={locale} />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(landing): final CTA section"`

---

### Task 5.11 : AnalyticsBeacon + assemblage de la page

**Files:**
- Create: `landing/components/analytics/AnalyticsBeacon.tsx`
- Modify: `landing/app/[locale]/page.tsx`

- [ ] **Step 1: `components/analytics/AnalyticsBeacon.tsx`**

```tsx
'use client';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { isAndroidUA } from '@/lib/device';

export function AnalyticsBeacon({ locale }: { locale: string }) {
  useEffect(() => {
    track({
      name: 'pageview',
      locale,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      device: isAndroidUA(navigator.userAgent) ? 'android' : 'other',
    });
  }, [locale]);
  return null;
}
```

- [ ] **Step 2: Assembler `app/[locale]/page.tsx`**

```tsx
import { setRequestLocale } from 'next-intl/server';
import { getStats } from '@/lib/stats';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { TrustBar } from '@/components/sections/TrustBar';
import { BentoStats } from '@/components/sections/BentoStats';
import { Features } from '@/components/sections/Features';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { AppShowcase } from '@/components/sections/AppShowcase';
import { MapCoverage } from '@/components/sections/MapCoverage';
import { Faq } from '@/components/sections/Faq';
import { CtaSection } from '@/components/sections/CtaSection';
import { AnalyticsBeacon } from '@/components/analytics/AnalyticsBeacon';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const stats = await getStats();

  return (
    <>
      <Header locale={locale} />
      <main>
        <Hero locale={locale} total={stats.total} />
        <TrustBar />
        <BentoStats stats={stats} />
        <Features />
        <HowItWorks />
        <AppShowcase locale={locale} />
        <MapCoverage />
        <Faq />
        <CtaSection locale={locale} />
      </main>
      <Footer locale={locale} />
      <AnalyticsBeacon locale={locale} />
    </>
  );
}
```

- [ ] **Step 3: Vérifier dev**

Run: `npm run dev` → ouvrir `/fr`, `/en`, `/mg`. Expected: page complète, animations au scroll, toggle thème, switch langue, CTA, 0 erreur console.

- [ ] **Step 4: Lancer toute la suite**

Run: `npm test` → tous les tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(landing): assemble full landing page + pageview beacon"
```

---

# Phase 6 — SEO

### Task 6.1 : Metadata par locale (hreflang)

**Files:**
- Create: `landing/lib/seo.ts`
- Modify: `landing/app/[locale]/layout.tsx`

- [ ] **Step 1: `lib/seo.ts`**

```ts
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';

export async function buildMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Meta' });
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${env.siteUrl}/${l}`]),
  );
  return {
    metadataBase: new URL(env.siteUrl),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${env.siteUrl}/${locale}`,
      languages: { ...languages, 'x-default': `${env.siteUrl}/${routing.defaultLocale}` },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${env.siteUrl}/${locale}`,
      siteName: 'Medinaa',
      locale,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
  };
}
```

- [ ] **Step 2: Brancher dans `layout.tsx`**

Ajouter en haut du fichier :
```tsx
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata(locale);
}
```

- [ ] **Step 3: Vérifier**

Run: `npm run build && npm run start -- -p 3001` puis `curl -s http://localhost:3001/fr | grep -i hreflang` → balises `alternate` présentes.

- [ ] **Step 4: Commit** → `git add -A && git commit -m "feat(landing): per-locale metadata + hreflang"`

---

### Task 6.2 : JSON-LD (Organization, WebSite, MobileApplication)

**Files:**
- Create: `landing/components/seo/JsonLd.tsx`
- Modify: `landing/app/[locale]/page.tsx`

- [ ] **Step 1: `components/seo/JsonLd.tsx`**

```tsx
import { env } from '@/lib/env';

export function JsonLd({ locale }: { locale: string }) {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Medinaa',
      url: env.siteUrl,
      logo: `${env.siteUrl}/logo.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Medinaa',
      url: `${env.siteUrl}/${locale}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Medinaa',
      operatingSystem: 'ANDROID',
      applicationCategory: 'MedicalApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'MGA' },
      installUrl: env.playStoreUrl,
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: Ajouter `<JsonLd locale={locale} />`** au début du fragment retourné par `page.tsx` (avant `<Header />`).

- [ ] **Step 3: Vérifier** : `curl -s http://localhost:3001/fr | grep -i 'application/ld+json'` → présent.

- [ ] **Step 4: Commit** → `git add -A && git commit -m "feat(landing): JSON-LD structured data"`

---

### Task 6.3 : FAQ JSON-LD

**Files:**
- Modify: `landing/components/sections/Faq.tsx`

- [ ] **Step 1: Ajouter le bloc FAQPage dans `Faq.tsx`**

Avant le `return`, construire :
```tsx
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: QA.map(({ q, a }) => ({
    '@type': 'Question',
    name: t(q),
    acceptedAnswer: { '@type': 'Answer', text: t(a) },
  })),
};
```
Puis, juste après l'ouverture de `<section …>` :
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
```

- [ ] **Step 2: Vérifier** : le test `faq.test.tsx` passe toujours (`npm test -- faq`).

- [ ] **Step 3: Commit** → `git add -A && git commit -m "feat(landing): FAQ structured data"`

---

### Task 6.4 : Sitemap + robots

**Files:**
- Create: `landing/app/sitemap.ts`, `landing/app/robots.ts`

- [ ] **Step 1: `app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: `${env.siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${env.siteUrl}/${l}`]),
      ),
    },
  }));
}
```

- [ ] **Step 2: `app/robots.ts`**

```ts
import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Vérifier** : `npm run build && npm run start -- -p 3001`, puis `curl -s http://localhost:3001/sitemap.xml` et `/robots.txt`.

- [ ] **Step 4: Commit** → `git add -A && git commit -m "feat(landing): sitemap + robots"`

---

### Task 6.5 : Image OG + pages légales stubs

**Files:**
- Create: `landing/app/[locale]/opengraph-image.tsx`
- Create: `landing/app/[locale]/legal/page.tsx`, `.../privacy/page.tsx`, `.../about/page.tsx`, `.../contact/page.tsx`

- [ ] **Step 1: `app/[locale]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Og({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#1070C0', color: '#fff', padding: 80, justifyContent: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 800 }}>Medinaa</div>
        <div style={{ fontSize: 36, marginTop: 16 }}>{t('tagline')}</div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 2: 4 pages stubs légales** (même patron, adapter le namespace de clé)

`app/[locale]/legal/page.tsx` :
```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Footer');
  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-3xl font-bold">{t('legal')}</h1>
        <p className="mt-4 text-muted-foreground">{t('osmAttribution')}</p>
      </main>
      <Footer locale={locale} />
    </>
  );
}
```
Dupliquer pour `privacy` (titre `t('privacy')`), `about` (`t('about')`), `contact` (`t('contact')`).

- [ ] **Step 3: Vérifier** : `/fr/legal`, `/fr/privacy`, `/fr/about`, `/fr/contact` rendent ; `/fr/opengraph-image` renvoie une image.

- [ ] **Step 4: Commit** → `git add -A && git commit -m "feat(landing): OG image + legal stub pages"`

---

# Phase 7 — Backend NestJS : endpoint de collecte analytics

> Touche le projet `backend/`. Préfixe commit `feat(backend):`. Requis pour que le beacon ait un destinataire.

### Task 7.1 : Entité AnalyticsEvent

**Files:**
- Create: `backend/src/analytics/analytics-event.entity.ts`

- [ ] **Step 1: Entité**

```ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  locale?: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ nullable: true })
  device?: string;

  @Column({ nullable: true })
  referrer?: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, unknown>;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 2: Commit** → `cd backend && git add -A && git commit -m "feat(backend): AnalyticsEvent entity"`

---

### Task 7.2 : Service + controller (TDD)

**Files:**
- Create: `backend/src/analytics/analytics.service.ts`, `.../analytics.controller.ts`, `.../dto/create-event.dto.ts`, `.../analytics.service.spec.ts`

- [ ] **Step 1: DTO** — `dto/create-event.dto.ts`

```ts
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsIn(['pageview', 'cta_click'])
  name: 'pageview' | 'cta_click';

  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() path?: string;
  @IsOptional() @IsString() device?: string;
  @IsOptional() @IsString() referrer?: string;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
}
```

- [ ] **Step 2: Test service (TDD)** — `analytics.service.spec.ts`

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './analytics-event.entity';

describe('AnalyticsService', () => {
  it('persiste un event', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'x' });
    const repo = { create: (d: any) => d, save };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: repo },
      ],
    }).compile();
    const service = moduleRef.get(AnalyticsService);
    await service.record({ name: 'pageview', locale: 'fr' });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'pageview' }));
  });
});
```

- [ ] **Step 3: Run (échec)** → `cd backend && npm test -- analytics.service` : FAIL.

- [ ] **Step 4: Service** — `analytics.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './analytics-event.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly repo: Repository<AnalyticsEvent>,
  ) {}

  record(dto: CreateEventDto): Promise<AnalyticsEvent> {
    return this.repo.save(this.repo.create(dto));
  }
}
```

- [ ] **Step 5: Controller** — `analytics.controller.ts`

```ts
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Post('events')
  @HttpCode(204)
  async create(@Body() dto: CreateEventDto): Promise<void> {
    await this.service.record(dto);
  }
}
```

- [ ] **Step 6: Run** → PASS.

- [ ] **Step 7: Commit** → `git add -A && git commit -m "feat(backend): analytics collect endpoint (POST /api/analytics/events)"`

---

### Task 7.3 : Module + enregistrement + CORS

**Files:**
- Create: `backend/src/analytics/analytics.module.ts`
- Modify: `backend/src/app.module.ts`, `backend/src/main.ts`

- [ ] **Step 1: Module** — `analytics.module.ts`

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './analytics-event.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
```

- [ ] **Step 2: Importer `AnalyticsModule`** dans `app.module.ts` (liste `imports`).

- [ ] **Step 3: CORS** — dans `main.ts`, autoriser l'origine de la landing :

```ts
app.enableCors({
  origin: [process.env.LANDING_ORIGIN ?? 'http://localhost:3001', 'https://medinaa.mg'],
});
```
(Le forward passe par `/api/track` côté serveur Next, donc CORS optionnel ; le configurer reste sain pour appels directs.)

- [ ] **Step 4: Vérifier de bout en bout**

Démarrer backend (`npm run start:dev`) + landing (`npm run dev`). Charger `/fr`, vérifier en DB :
```bash
PGPASSWORD=medinaa psql -h localhost -U medinaa -d medinaa -c "SELECT name, locale, path FROM analytics_events ORDER BY created_at DESC LIMIT 5;"
```
Expected: au moins une ligne `pageview`.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "feat(backend): wire AnalyticsModule + CORS"`

---

# Phase 8 — Qualité (E2E, perf, a11y)

### Task 8.1 : Playwright smoke (3 locales + CTA)

**Files:**
- Create: `landing/playwright.config.ts`, `landing/e2e/smoke.spec.ts`
- Modify: `landing/package.json`

- [ ] **Step 1: Installer**

```bash
npm i -D @playwright/test && npx playwright install --with-deps chromium
```

- [ ] **Step 2: `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npm run start -- -p 3101',
    url: 'http://localhost:3101/fr',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:3101' },
});
```

- [ ] **Step 3: `e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

for (const locale of ['fr', 'mg', 'en']) {
  test(`charge /${locale} sans erreur console`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`/${locale}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('le CTA app web pointe vers le bon domaine', async ({ page }) => {
  await page.goto('/fr');
  const cta = page.getByRole('link', { name: /app web/i }).first();
  await expect(cta).toHaveAttribute('href', /medinaa\.mg|app\./);
});
```

- [ ] **Step 4: Script + run**

`package.json` : `"e2e": "playwright test"`.
Run: `npm run e2e` → tous verts.

- [ ] **Step 5: Commit** → `git add -A && git commit -m "test(landing): Playwright smoke (locales + CTA)"`

---

### Task 8.2 : Lighthouse CI (budget perf/SEO)

**Files:**
- Create: `landing/lighthouserc.json`
- Modify: `landing/package.json`

- [ ] **Step 1: Installer**

```bash
npm i -D @lhci/cli
```

- [ ] **Step 2: `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start -- -p 3201",
      "url": ["http://localhost:3201/fr"],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }]
      }
    }
  }
}
```

- [ ] **Step 3: Script + run**

`package.json` : `"lhci": "npm run build && lhci autorun"`.
Run: `npm run lhci`. Corriger jusqu'à respecter le budget (images dimensionnées, `alt`, contrastes, métas présentes).

- [ ] **Step 4: Commit** → `git add -A && git commit -m "test(landing): Lighthouse CI budget (perf/SEO/a11y)"`

---

# Phase 9 — Déploiement VPS

### Task 9.1 : Dockerfile (standalone)

**Files:**
- Create: `landing/Dockerfile`, `landing/.dockerignore`

- [ ] **Step 1: `.dockerignore`**

```
node_modules
.next
.git
e2e
tests
```

- [ ] **Step 2: `Dockerfile`** (multi-stage, sortie standalone)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WEB_APP_URL
ARG NEXT_PUBLIC_PLAY_STORE_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 3: Build local de vérification**

Run: `docker build -t medinaa-landing landing/` → build OK.

- [ ] **Step 4: Commit** → `git add -A && git commit -m "chore(landing): Dockerfile (standalone build)"`

---

### Task 9.2 : Caddyfile (reverse proxy + TLS auto)

**Files:**
- Create: `landing/Caddyfile`

- [ ] **Step 1: `Caddyfile`**

```
medinaa.mg, www.medinaa.mg {
  encode gzip zstd
  reverse_proxy localhost:3000
}
```
(Caddy gère le TLS automatiquement. Le conteneur landing écoute sur 3000 en interne ; mapper `-p 127.0.0.1:3000:3000` au `docker run`.)

- [ ] **Step 2: Commit** → `git add -A && git commit -m "chore(landing): Caddy reverse-proxy config"`

---

### Task 9.3 : README de run/déploiement

**Files:**
- Create: `landing/README.md`

- [ ] **Step 1: README** — documenter :
  - prérequis (Node 20, variables d'env)
  - `npm run dev` (port 3001), `npm test`, `npm run e2e`, `npm run lhci`
  - build/déploiement VPS : `docker build`, `docker run -e BACKEND_API_URL=… -e NEXT_PUBLIC_*=… -p 127.0.0.1:3000:3000`, Caddy
  - note : remplacer les mockups `public/mockups/*` par de vraies captures quand dispo
  - note : faire valider `messages/mg.json` (cf. `messages/mg.TODO.md`)

- [ ] **Step 2: Commit** → `git add -A && git commit -m "docs(landing): run & deploy README"`

---

## Récapitulatif de couverture (spec → tâches)

| Exigence spec | Tâche(s) |
|---|---|
| Next.js App Router SSG/ISR standalone (VPS) | 0.1, 0.2, 9.1 |
| `/landing` dans le monorepo | 0.1 |
| Thème 3 couleurs HSL + dark toggle | 1.1, 1.3 |
| i18n FR/MG/EN + hreflang | 2.1–2.4, 6.1 |
| 11 sections (hero search-first, bento, etc.) | 4.1–4.3, 5.1–5.11 |
| CTA device-aware (web + Play Store) | 3.1, 4.1 |
| Stats depuis backend + fallback | 3.2, 5.4 |
| Search deep-link app web | 5.1 |
| Animations Framer Motion + reduced-motion | 3.5, 3.6, sections |
| SEO JSON-LD + sitemap + OG | 6.1–6.5 |
| Analytics first-party (beacon → backend) | 3.3, 3.4, 5.11, 7.1–7.3 |
| Attribution OSM (ODbL) | 4.3, 6.5 |
| Tests Vitest + Playwright + Lighthouse CI | 0.3, sections, 8.1, 8.2 |
| Pages légales / confidentialité | 6.5 |
| Déploiement VPS (Docker + Caddy) | 9.1–9.3 |
