# Medinaa — Landing page

Landing page trilingue (FR / MG / EN) pour [medinaa.mg](https://medinaa.mg).
Next.js App Router, SSG/ISR, sortie standalone pour VPS.

---

## Prérequis

- **Node.js 20+** (`node --version`)
- Variables d'environnement (voir `.env.example`) :

| Variable | Rôle | Exemple |
|---|---|---|
| `BACKEND_API_URL` | URL serveur NestJS (build-time + runtime) | `http://localhost:3000` |
| `NEXT_PUBLIC_WEB_APP_URL` | URL de l'app web | `https://app.medinaa.mg` |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Lien fiche Play Store | `https://play.google.com/store/apps/details?id=mg.medinaa` |
| `NEXT_PUBLIC_SITE_URL` | URL canonique du site | `https://medinaa.mg` |

Copier `.env.example` en `.env.local` pour le dev local :

```bash
cp .env.example .env.local
```

---

## Développement

```bash
npm install
npm run dev          # http://localhost:3001 (HMR)
```

---

## Tests

```bash
npm test             # Vitest (unit + composants)
npm run test:watch   # Vitest en mode watch

npm run e2e          # Playwright smoke (build + serve sur :3101)

npm run lhci         # Lighthouse CI (perf ≥ 0.9, SEO/a11y ≥ 0.95)
```

---

## Build de production

```bash
npm run build        # génère .next/standalone/
```

---

## Déploiement VPS (Docker + Caddy)

### 1. Appliquer la migration analytics avant le premier lancement

Sur le serveur, avant de démarrer le backend NestJS pour la première fois :

```bash
PGPASSWORD=<password> psql -h localhost -U medinaa -d medinaa \
  -f backend/src/migrations/010_analytics_events.sql
```

### 2. Build de l'image Docker

Depuis la racine du dépôt (`medinaa/`) :

```bash
docker build landing/ \
  --build-arg NEXT_PUBLIC_SITE_URL=https://medinaa.mg \
  --build-arg NEXT_PUBLIC_WEB_APP_URL=https://app.medinaa.mg \
  --build-arg NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=mg.medinaa \
  -t medinaa-landing
```

### 3. Lancer le conteneur

```bash
docker run -d \
  --name medinaa-landing \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e NODE_ENV=production \
  -e BACKEND_API_URL=http://localhost:3000 \
  medinaa-landing
```

Le serveur standalone écoute sur le port 3000 à l'intérieur du conteneur, exposé uniquement sur `127.0.0.1:3000` de l'hôte. Caddy s'y connecte en reverse proxy.

### 4. Configurer Caddy

Copier `Caddyfile` dans le dossier de configuration Caddy du serveur (ex. `/etc/caddy/Caddyfile`) puis :

```bash
sudo caddy reload
```

Caddy gère automatiquement les certificats TLS via Let's Encrypt pour `medinaa.mg` et `www.medinaa.mg`.

---

## Notes de lancement

- **Mockups** : `public/mockups/` contient des placeholders. Remplacer par de vraies captures d'écran de l'app web et mobile avant la mise en prod.
- **Traductions malgaches** : `messages/mg.json` est une copie du FR en attente de validation. Faire relire par un locuteur natif (voir `messages/mg.TODO.md`).
- **Play Store URL** : définir la vraie valeur de `NEXT_PUBLIC_PLAY_STORE_URL` quand l'app est publiée sur le Play Store.
- **Migration analytics** : appliquer `backend/src/migrations/010_analytics_events.sql` avant le premier démarrage du backend pour créer la table `analytics_events`.
