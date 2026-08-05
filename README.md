# POS Boutique Informatique

Application de caisse digitale (POS) complète pour une boutique de produits informatiques : gestion du catalogue, du stock, des ventes (espèces, prix négocié, Wave), reçus PDF, notifications email, exports Excel/CSV et tableau de bord administrateur.

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, TailwindCSS, shadcn/ui, React Query, React Hook Form, Zod, Axios, React Router |
| Backend | Node.js, Express, TypeScript |
| Base de données | PostgreSQL (via Prisma ORM) |
| Auth | JWT (access + refresh avec rotation), RBAC (Admin / Vendeur) |
| Paiement | Wave Checkout API (webhook signé) |
| PDF / Email / Excel | PDFKit, Nodemailer, ExcelJS, qrcode |

## Structure du monorepo

```
pos-boutique/
├── client/    # Application React (Vite)
├── server/    # API Express + Prisma
└── shared/    # Schémas Zod et types partagés entre client et serveur
```

## Prérequis

- Node.js ≥ 20
- Docker (pour PostgreSQL en local) ou un PostgreSQL existant (ex: Supabase)
- Un compte marchand Wave avec accès API (clé API + secret de webhook), pour le paiement Wave

## Installation

```bash
git clone <url-du-repo>
cd pos-boutique
npm install
```

`npm install` build automatiquement le package `shared` (hook `postinstall`). Si vous modifiez `shared/` pendant le développement, relancez `npm run dev:shared` dans un terminal séparé (mode watch) ou `npm run build:shared` ponctuellement.

## Configuration

Copiez les fichiers d'exemple et renseignez vos valeurs :

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Variables d'environnement serveur (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `PORT` | Port d'écoute du serveur (défaut 4000) |
| `CORS_ORIGIN` | URL autorisée pour les requêtes CORS (l'URL du frontend) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secrets de signature JWT — générez des chaînes aléatoires longues, distinctes l'une de l'autre |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Durées de validité des tokens (ex: `15m`, `7d`) |
| `WAVE_API_KEY` | Clé API Wave (Bearer token) |
| `WAVE_API_BASE_URL` | Base URL de l'API Wave (`https://api.wave.com/v1`) |
| `WAVE_WEBHOOK_SECRET` | Secret de signature des webhooks Wave (obtenu dans le dashboard marchand Wave) |
| `WAVE_SUCCESS_URL` / `WAVE_ERROR_URL` | URLs de redirection après paiement |
| `SMTP_*` | Configuration du serveur d'envoi d'emails (Nodemailer) |
| `OWNER_EMAIL` | Adresse recevant les notifications de vente |
| `SHOP_NAME` / `SHOP_ADDRESS` / `SHOP_PHONE` | Informations affichées sur les reçus |

### Variables d'environnement client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API (ex: `http://localhost:4000/api/v1`) |

## Lancement en local

```bash
# 1. Démarrer PostgreSQL local
docker-compose up -d

# 2. Appliquer le schéma et peupler les données de démo
npx prisma migrate dev --name init --schema=server/prisma/schema.prisma
npx prisma db seed --schema=server/prisma/schema.prisma

# 3. Lancer le backend (terminal 1)
npm run dev:server

# 4. Lancer le frontend (terminal 2)
npm run dev:client
```

L'application est accessible sur `http://localhost:5173`.

### Comptes de démonstration (créés par le seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@boutique.com | ChangeMoi123! |
| Vendeur | vendeur@boutique.com | ChangeMoi123! |

⚠️ **Changez ces mots de passe avant toute mise en production.**

## Tests

```bash
npm run test:server   # tests backend (Vitest + Supertest)
npm run test:client   # tests composants/store frontend (Vitest + Testing Library)
npm test               # les deux
```

Les tests backend mockent Prisma pour s'exécuter sans base de données réelle. Pour des tests d'intégration avec une vraie base PostgreSQL de test, créez une base dédiée et adaptez `DATABASE_URL` dans un fichier `server/.env.test`.

## Paiement Wave — points d'attention

Le webhook (`POST /api/v1/payments/wave/webhook`) vérifie la signature `Wave-Signature: t=...,v1=...` conformément à la documentation officielle Wave. Avant la mise en production :

1. Configurez l'URL du webhook dans le dashboard marchand Wave : `https://votre-domaine.com/api/v1/payments/wave/webhook`
2. Renseignez `WAVE_WEBHOOK_SECRET` avec le secret affiché dans ce même dashboard
3. Testez en sandbox Wave avant de basculer en production

## Déploiement

### Vue d'ensemble

| Composant | Plateforme |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Base de données | Supabase PostgreSQL |

### 1. Base de données — Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Dans **Project Settings → Database**, copiez la connection string (mode "Transaction" recommandé pour Prisma avec pooling)
3. Gardez cette URL pour `DATABASE_URL` côté Railway

### 2. Backend — Railway

⚠️ **Important** : ce projet est un monorepo avec npm workspaces. `@pos/shared` doit être résolu via `npm install` à la **racine du monorepo**, pas depuis `server/` isolément — sinon Railway ne trouvera pas le package `@pos/shared`.

1. Créez un nouveau projet sur [railway.app](https://railway.app), connecté à votre repo Git
2. **Ne définissez pas** de "Root Directory" différent de la racine du repo (laissez-le vide / racine)
3. Build command : `npm install && npm run build:shared && npx prisma generate --schema=server/prisma/schema.prisma && npm run build:server`
4. Start command : `npx prisma migrate deploy --schema=server/prisma/schema.prisma && npm run start --workspace=server`
5. Renseignez toutes les variables d'environnement listées plus haut dans l'onglet **Variables**
6. Déployez. Notez l'URL publique générée (ex: `https://votre-projet.up.railway.app`)

### 3. Frontend — Vercel

⚠️ Même remarque que pour Railway : `@pos/shared` doit être résolu via npm workspaces.

1. Créez un nouveau projet sur [vercel.com](https://vercel.com), connecté à votre repo Git
2. **Root Directory** : laissez la racine du repo (ne pas mettre `client`)
3. Build command : `npm install && npm run build:shared && npm run build:client`
4. Output directory : `client/dist`
5. Variable d'environnement : `VITE_API_URL` = URL Railway + `/api/v1` (ex: `https://votre-projet.up.railway.app/api/v1`)
6. Déployez

### 4. Finalisation

1. Mettez à jour `CORS_ORIGIN` côté Railway avec l'URL Vercel finale
2. Mettez à jour `WAVE_SUCCESS_URL` / `WAVE_ERROR_URL` avec les vraies URLs de production
3. Configurez l'URL de webhook dans le dashboard Wave avec l'URL Railway finale
4. Changez les mots de passe des comptes de démonstration

## Licence

Projet propriétaire — usage interne à la boutique.


