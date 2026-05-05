# Lotofolio — Frontend

Application web Angular 21 de gestion de jeux de loterie (FDJ). Ce dépôt est la partie front d'un projet portfolio démontrant une architecture moderne : composants standalone, signals, NgRx Signal Store, SSR et authentification JWT.

> 🔗 Backend associé : [lotofolio-back](https://github.com/HostLabDeezek/lotofolio-back) (Express + Prisma + PostgreSQL)

---

## Sommaire

- [Démo](#démo)
- [Stack technique](#stack-technique)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Sécurité](#sécurité)
- [Lancer en local](#lancer-en-local)
- [Routes & écrans](#routes--écrans)
- [Choix techniques justifiés](#choix-techniques-justifiés)
- [Roadmap](#roadmap)
- [À propos](#à-propos)

---

## Démo

| Environnement | URL                                                        | Statut       |
|---------------|------------------------------------------------------------|--------------|
| Production    | https://lotofolio-front.vercel.app                         | ✅ en ligne   |
| API Backend   | https://lotofolio-back.onrender.com/api                    | ✅ en ligne   |

**Compte de démo** (recruteurs) :
- Email : `user@lotofolio.fr`
- Mot de passe : `Password1!`

Un bouton flottant `?` (en bas à droite) ouvre un guide pas-à-pas pour les recruteurs avec les identifiants pré-remplis.

---

## Stack technique

### Cœur

| Outil                | Rôle                                              |
|----------------------|---------------------------------------------------|
| **Angular 21**       | Framework — composants standalone, control flow (`@if`, `@for`) |
| **TypeScript 5.9**   | Mode strict + `strictTemplates`                   |
| **Angular Signals**  | État local réactif des composants                 |
| **@ngrx/signals 21** | Signal Store pour l'état global (jeux)            |
| **RxJS 7.8**         | Flux HTTP, conversion en Promises via `firstValueFrom()` |
| **Angular SSR**      | Rendu côté serveur via Express (mode hybride : prerender + client) |

### UI

| Outil                | Rôle                                              |
|----------------------|---------------------------------------------------|
| **Angular Material** | Dialog, FAB, Chips, Card pour le guide recruteur  |
| **Angular CDK**      | `BreakpointObserver` pour la responsive           |
| **SCSS**             | Styles avec préprocesseur, scoping par composant  |

### Sécurité & DX

| Outil                  | Rôle                                          |
|------------------------|-----------------------------------------------|
| **@auth0/angular-jwt** | Manipulation des tokens JWT côté client       |
| **HTTP Interceptors**  | Injection automatique du Bearer token + gestion 401 |
| **Karma + Jasmine**    | Tests unitaires (composants, services, guards)|
| **Prettier**           | Formatage : 100 caractères, single quotes     |

---

## Fonctionnalités

### ✅ Implémentées

- 🔐 **Authentification JWT** — login, persistance via `localStorage`, logout
- 🛡️ **Protection des routes** — `authGuard` redirige vers `/login` si non authentifié
- 🌐 **Intercepteurs HTTP** — injection du token + déconnexion automatique sur `401`
- 🎲 **Liste des jeux** — chargement et affichage via Signal Store
- 🖥️ **SSR (Server-Side Rendering)** — page login en prerender, reste en mode client
- 📱 **Responsive** — adaptation mobile/desktop, dialog plein écran sur petits écrans
- 🎯 **Guide recruteur** — bouton flottant + modal avec identifiants de démo
- 🌍 **Multi-environnements** — `dev` / `staging` / `prod` avec URL d'API distinctes

### 🚧 Planifiées

- 📝 Inscription utilisateur
- 🎰 Génération aléatoire de grilles (Loto, Euromillions, etc.)
- 💾 Sauvegarde des grilles favorites par utilisateur
- 📊 Historique des tirages
- 👤 Profil utilisateur (édition, mot de passe)
- 🎨 Thème sombre

---

## Architecture

L'application suit un découpage **par couches + par features**, séparant le _core_ (transverse) du _shared_ (réutilisable) et des _features_ (métier).

```
┌────────────────────────────────────────────────────────────┐
│                     src/app                                │
│                                                            │
│  ┌────────────┐   ┌───────────────┐   ┌────────────────┐   │
│  │  features  │   │     core      │   │     shared     │   │
│  │            │   │               │   │                │   │
│  │  • auth/   │   │ • guards/     │   │ • components/  │   │
│  │    login   │   │ • interceptors│   │ • models/      │   │
│  │            │   │ • services/   │   │ • services/    │   │
│  │            │   │ • header/     │   │ • stores/      │   │
│  │            │   │ • layout/     │   │                │   │
│  └────────────┘   └───────────────┘   └────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
        │                  │                    │
        ▼                  ▼                    ▼
   Pages métier      Infra transverse    Réutilisable inter-features
```

**Pourquoi ce découpage ?**

- `core/` regroupe ce qui ne peut exister qu'une fois (auth service, guards, interceptors, layout principal). Importé une seule fois au démarrage.
- `features/` isole chaque fonctionnalité métier. Une feature peut être supprimée sans impacter les autres.
- `shared/` héberge ce qui est consommé par plusieurs features (composants UI, modèles, stores).

### Flux d'une requête authentifiée

```
Composant
   │ inject(JeuStore).loadJeux()
   ▼
JeuStore (NgRx Signal Store)
   │ jeuService.getJeux()
   ▼
JeuService ────► HttpClient.get(...)
                       │
                       ▼
              authInterceptor
              (ajoute Bearer token)
                       │
                       ▼
              errorInterceptor
              (uniformise les erreurs)
                       │
                       ▼
                  Backend API
```

### Routage

```
/login        → Login (sans layout)
/             → Layout (header + footer + recruiter FAB)
                │ canActivate: authGuard
                └── /  → HomePage
/**           → redirige vers /
```

---

## Modèle de données

Types TypeScript miroirs des entités backend.

### `User`

| Champ   | Type                  | Description                |
|---------|-----------------------|----------------------------|
| `id`    | `number`              | Identifiant unique         |
| `name`  | `string`              | Nom affiché                |
| `email` | `string`              | Email (unique)             |
| `role`  | `'USER' \| 'ADMIN'`   | Rôle pour l'autorisation   |

### `Jeu`

| Champ                   | Type             | Description                                    |
|-------------------------|------------------|------------------------------------------------|
| `id`                    | `number`         | Identifiant unique                             |
| `nom`                   | `string`         | Nom du jeu (Loto, Euromillions...)             |
| `description`           | `string \| null` | Description marketing                          |
| `regle`                 | `string \| null` | Règles détaillées                              |
| `intervalNumero`        | `number`         | Nombre max des numéros principaux              |
| `intervalNumeroChance`  | `number`         | Nombre max des numéros chance                  |
| `nbNumerosATirer`       | `number`         | Combien de numéros principaux choisir          |
| `nbNumeroChanceATirer`  | `number`         | Combien de numéros chance choisir              |

### State du `JeuStore`

```ts
{
  jeux: Jeu[];           // Liste des jeux disponibles
  selectedJeu: Jeu | null; // Jeu actuellement sélectionné
  loading: boolean;      // Indicateur de chargement
  error: string | null;  // Message d'erreur API
}
```

---

## Sécurité

| Menace                              | Mesure                                                                              |
|-------------------------------------|-------------------------------------------------------------------------------------|
| Vol de token via XSS                | JWT en `localStorage` avec accès lecture-seule via `Auth.getToken()` (à durcir : voir Roadmap) |
| Accès aux pages privées sans login  | `authGuard` (`canActivate`) redirige vers `/login` si pas de token                  |
| Token expiré ou invalide            | `authInterceptor` capte le `401`, déclenche `auth.logout()` et redirige             |
| Fuite du token vers domaines tiers  | Le token n'est injecté **que** si `req.url.startsWith(environment.apiUrl)`          |
| Erreurs API exposant la stack       | `errorInterceptor` uniformise : `err.error?.error ?? 'Une erreur est survenue'`     |
| Crash SSR sur `localStorage`        | Garde `isPlatformBrowser(this.platformId)` avant tout accès au storage              |
| Injection HTML dans templates       | Angular échappe par défaut (sanitization automatique)                               |
| Submit de formulaire invalide       | `loginForm.invalid` + `markAllAsTouched()` avant tout appel API                     |

---

## Lancer en local

### Prérequis

- **Node.js** ≥ 20
- **npm** ≥ 10
- Le **backend** doit tourner sur `http://localhost:3000` (voir [lotofolio-back](https://github.com/HostLabDeezek/lotofolio-back))

### Étapes

1. **Cloner le projet**
   ```bash
   git clone https://github.com/HostLabDeezek/loto-frontend.git
   cd loto-frontend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Vérifier la configuration de l'environnement**

   Le fichier `src/environments/environment.ts` est utilisé en mode dev :
   ```ts
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api',
   };
   ```

4. **Démarrer le serveur de dev**
   ```bash
   npm start
   ```
   → L'application est disponible sur `http://localhost:4200`.

### Autres commandes

| Commande                            | Description                                  |
|-------------------------------------|----------------------------------------------|
| `npm start`                         | Dev server (env `development`)               |
| `npm run start:staging`             | Dev server pointant sur le backend staging   |
| `npm run build`                     | Build de production (avec SSR)               |
| `npm test`                          | Tests Karma/Jasmine en mode watch            |
| `npm run serve:ssr:loto-frontend`   | Lance le serveur Express SSR (port `4000`)   |

Lancer un seul fichier de test :
```bash
npx karma start --single-run --include="**/auth.spec.ts"
```

---

## Routes & écrans

| Route     | Composant   | Auth requise | Layout | Description                                        |
|-----------|-------------|--------------|--------|----------------------------------------------------|
| `/login`  | `Login`     | ❌           | ❌     | Formulaire de connexion (reactive forms + signals) |
| `/`       | `HomePage`  | ✅           | ✅     | Liste des jeux disponibles (cards)                 |
| `/**`     | _redirect_  | —            | —      | Toute autre URL → `/`                              |

### Comportement SSR

Configuré dans `src/app/app.routes.server.ts` :
- `/login` → **Prerender** (HTML statique généré au build, performance maximale)
- Reste → **Client** (rendu navigateur, dépend de `localStorage`)

---

## Choix techniques justifiés

### Pourquoi Angular 21 et les composants standalone ?

Le repo utilise exclusivement la **nouvelle API standalone** (pas de `NgModule`). Avantages :
- Imports explicites par composant → plus facile à raisonner
- Tree-shaking plus agressif → bundles plus légers
- Onboarding accéléré pour les développeurs venant de React/Vue

### Pourquoi `@ngrx/signals` plutôt que NgRx classique ?

NgRx classique (Store + Effects + Reducers) est très verbeux pour des projets de cette taille. **Signal Store** offre :
- API minimaliste (`withState`, `withMethods`, `patchState`)
- Réactivité native via les signals d'Angular (pas besoin de `select` + `async pipe`)
- Tests plus simples (pas de mock du Store global)

### Pourquoi des intercepteurs plutôt qu'une logique d'auth dans chaque service ?

Centraliser l'injection du token et la gestion des `401` dans `authInterceptor` permet :
- **Single source of truth** pour l'auth HTTP
- Aucun service métier ne doit connaître `localStorage` ou les tokens
- Une seule ligne à modifier pour ajouter du logging, du retry, etc.

L'intercepteur **vérifie l'origine** (`req.url.startsWith(environment.apiUrl)`) pour ne **jamais** envoyer le token vers un domaine tiers.

### Pourquoi le SSR ?

- **SEO** : les bots voient le HTML pré-rendu
- **First Contentful Paint** plus rapide sur les connexions lentes
- La page `/login` est **prerendée** : zéro délai au premier affichage

L'auth service utilise systématiquement `isPlatformBrowser()` avant tout accès à `localStorage` pour éviter les crashs côté serveur.

### Pourquoi un fichier `environment.staging.ts` ?

Avoir un environnement intermédiaire permet de :
- Tester l'intégration avec le backend déployé sans builder en mode `production`
- Valider les URL d'API et les CORS avant la mise en production
- Démontrer une vraie maîtrise des pipelines déploiement (3 stages = standard industriel)

### Pourquoi un guide recruteur intégré à l'app ?

Un bouton flottant `?` ouvre un dialogue avec les identifiants de démo et un parcours guidé. Cela montre que l'application est conçue **pour son audience cible** (recruteurs) et pas seulement pour son utilisateur final.

---

## Roadmap

- [x] Déployer sur Vercel — https://lotofolio-front.vercel.app
- [ ] Ajouter une page d'inscription
- [ ] Implémenter la génération de grilles aléatoires
- [ ] Sauvegarder les grilles favorites côté backend
- [ ] Refresh token + auto-renew côté intercepteur
- [ ] Migrer le stockage du token vers un cookie `httpOnly` (anti-XSS)
- [ ] Ajouter les tests E2E (Playwright ou Cypress)
- [ ] Mettre en place un workflow CI (GitHub Actions) : lint + test + build

---

## À propos

Projet portfolio développé par **Simon Péré**, développeur fullstack JavaScript / TypeScript.

- 📧 [simon.pere@live.fr](mailto:simon.pere@live.fr)
- 💼 [LinkedIn](https://www.linkedin.com/in/simon-pere-6430331b8/)
- 🐙 [GitHub](https://github.com/HostLabDeezek/)

Ce dépôt et son backend ([lotofolio-back](https://github.com/HostLabDeezek/lotofolio-back)) constituent un cas d'étude complet : modélisation de données, API REST sécurisée, SPA Angular avec SSR, et déploiement multi-environnements.
