# RecruiterGuideFab — design spec

**Date :** 2026-05-04
**Projet :** loto-frontend (Angular 21, Material 3)
**Référence :** `TechnoPark/front/src/components/recruiter/RecruiterGuideFab.jsx`

## Objectif

Reproduire en Angular le dispositif d'accueil recruteur déjà utilisé dans le projet TechnoPark : un bouton flottant (FAB) « Recruteurs — lisez-moi » toujours visible en bas à droite, qui ouvre une modale de présentation du projet Lotofolio. Le but est qu'un recruteur arrivant sur le site comprenne en 5 minutes ce qu'il regarde, ce qui a été réalisé côté front et côté back, et comment tester, sans avoir à lire un README.

Le projet n'étant pas terminé, la modale doit présenter honnêtement l'avancement actuel en mettant en valeur les bonnes pratiques techniques mises en place (auth, intercepteurs, store, sécurité back, infra) plutôt que de surpromettre des fonctionnalités à venir.

## Architecture

Trois composants standalone dans `src/app/shared/components/recruiter-guide/` :

### `RecruiterGuideFab` (`recruiter-guide-fab.ts` / `.html` / `.scss`)
- Bouton `<button mat-fab extended>` positionné en `position: fixed` bas-droit.
- Au clic : `MatDialog.open(RecruiterGuideDialog, options)`.
- Calcule la config du dialog (`fullScreen` mobile vs desktop) via `BreakpointObserver` (`Breakpoints.XSmall`).
- Aucun état métier propre. Pas d'effet au mount.
- Monté dans `src/app/app.html` après `<router-outlet>` → visible sur toutes les pages, y compris `/login`.

### `RecruiterGuideDialog` (`recruiter-guide-dialog.ts` / `.html` / `.scss`)
- Composant standalone qui contient l'intégralité du markup de la modale.
- Reçoit le `MatDialogRef` injecté pour la fermeture (croix + bouton CTA).
- Pur affichage (pas d'appel API, pas d'état réactif). Le tableau des comptes de démo et la liste des étapes sont des constantes locales.
- Structure (dans cet ordre) :
  1. `MatDialogTitle` : icône `waving_hand` + « Bienvenue sur Lotofolio » + sous-titre + bouton croix absolu.
  2. `MatDialogContent` (scroll="paper" équivalent — c'est le défaut Material) :
     - **Intro** : 3 paragraphes (projet perso pour continuer Angular, full-stack, données seedées sans risque).
     - **Encart cold start** : `mat-card appearance="outlined"` avec icône `info`, prévient des ~30-60s de cold start Render.
     - **Compte de démo** : table simple HTML stylée (1 ligne) : rôle / email mono / username / chip mot de passe.
     - **Parcours pas-à-pas** : 3 `RecruiterStep` (connexion → JWT, home → JeuStore, suite à venir).
     - **Encart parcours utilisateur** : `mat-card` avec `border-left` primary, décrit le parcours actuel.
     - **Pour aller plus loin (optionnel)** : 3 `RecruiterStep` (DevTools / rate-limit / lire le code avec boutons GitHub).
     - **Points techniques à noter** : 3 listes — Front, Back, Limites assumées (en italique).
     - **Mot de remerciement** + 4 boutons contact : email, LinkedIn, GitHub front, GitHub back (`mat-stroked-button` avec icônes).
  3. `MatDialogActions` : bouton `mat-flat-button` « J'ai lu, explorons le site » qui ferme.

### `RecruiterStep` (`recruiter-step.ts`)
- Composant standalone réutilisable, équivalent du `<Step>` React.
- Inputs (signal-based) : `number: string`, `icon: string` (nom Material), `title: string`.
- Slot `<ng-content>` pour la description (peut contenir du HTML riche, des liens, des listes).
- Layout : flex avec un cercle 40×40 `bgcolor: primary` à gauche affichant le numéro, à droite titre + icône en gras puis description en `text.secondary`.

## Mapping React/MUI → Angular Material

| React / MUI | Angular Material |
|---|---|
| `Fab variant="extended"` | `<button mat-fab extended>` |
| `Dialog` + `useMediaQuery` | `MatDialog.open()` + `BreakpointObserver` du CDK |
| `Paper variant="outlined"` | `<mat-card appearance="outlined">` |
| `Chip` monospace | `<mat-chip>` + classe utilitaire mono |
| `Table` MUI | Simple `<table>` HTML stylée (1 ligne, `mat-table` overkill) |
| Icônes (`HelpOutlineIcon`…) | `<mat-icon>` avec noms Material : `help_outline`, `close`, `waving_hand`, `info`, `lock`, `groups`, `event_available`, `admin_panel_settings`, `code`, `cloud`, `shield`, `bolt`, `dns`, `verified_user`, `email`, `link` |
| `Button startIcon` | `<button mat-stroked-button>` + `<mat-icon>` enfant |

Material Icons est déjà chargé dans `src/index.html`. Aucune dépendance à ajouter.

## Contenu factuel de la modale

### Compte de démo (1 ligne)
- email : `user@lotofolio.fr`
- mot de passe : `Password1!` (chip monospace)
- rôle : USER
- username : Maxime Dupuis

### Encart « À savoir avant de commencer »
- Cold start Render free : ~30-60s sur la première requête après inactivité.
- Projet en cours : seuls les endpoints `/auth` et `GET /jeux` sont exposés. Les routes Grilles, Tirages, Parties, Resultats sont à venir (modèles Prisma déjà en place).

### Points techniques — Front
- Angular 21 standalone components, signals + `@ngrx/signals` pour le state global (`JeuStore`).
- Auth JWT : `AuthService` avec signal `user`, garde `authGuard` sur les routes protégées.
- Deux intercepteurs HTTP : `authInterceptor` (Bearer auto + auto-logout sur 401) + `errorInterceptor` (normalise les messages d'erreur API).
- SSR-safe : `isPlatformBrowser` autour des accès `localStorage`.
- TypeScript strict + `strictTemplates`.
- Je veux montrer que je sais développer en Angular 

### Points techniques — Back
- Node.js 20 + Express 5 + TypeScript strict (ESM natif), Prisma 7 + PostgreSQL 16.
- Validation des variables d'env au boot avec Zod → fail fast si `JWT_SECRET < 32 chars` ou `DATABASE_URL` invalide.
- Liveness `/health` vs readiness `/ready` (le `SELECT 1` n'est que sur readiness, évite les redémarrages intempestifs).
- Rate-limit ciblé : 5 logins / 15 min, 3 registers / heure (pas de rate-limit global naïf).
- CORS en whitelist explicite (multi-origines via env), `helmet`, bcrypt 10 rounds.
- Graceful shutdown SIGINT/SIGTERM avec `prisma.$disconnect()` + timeout 10s.
- Infra as Code via `render.yaml`, `JWT_SECRET` généré côté Render (jamais en clair).
- Logs structurés Winston (JSON en prod).
- Validation Zod par route, format d'erreur standardisé `{ error, details? }`.

### Limites assumées (en italique, ton honnête)
- Pas de tests automatisés (front et back).
- Pas de refresh token (JWT 7 jours unique).
- RBAC pas encore actif (enum `Role` prêt en base, middleware à venir).
- Pas de CI (pas de GitHub Actions au moment de la rédaction).
- Endpoints Grilles / Tirages / Parties / Resultats non encore implémentés.

### Contact
- Email : `simon.pere@live.fr`
- LinkedIn : `https://www.linkedin.com/in/simon-pere-6430331b8/`
- GitHub front : `https://github.com/HostLabDeezek/lotofolio-front`
- GitHub back : `https://github.com/HostLabDeezek/lotofolio-back`

## Style du FAB (à respecter pour cohérence inter-projets)

- Position : `position: fixed`, `bottom: 16px / right: 16px` mobile, `bottom: 24px / right: 24px` desktop (≥ 600px).
- Z-index : au-dessus du tooltip Material → valeur `9999` (Material ne définit pas de z-index custom élevé sur ses composants ambient ; le dialog gère son propre overlay donc le FAB ne lutte pas avec lui).
- Variant : `mat-fab extended` (FAB allongé avec texte, pas juste une icône).
- Texte exact : « Recruteurs — lisez-moi » (avec tiret cadratin).
- Icône `help_outline` à gauche du texte.
- `box-shadow` Material par défaut (le `mat-fab` la gère).
- Couleur primary du theme (azure palette définie dans `styles.scss`).

## Comportement de la modale

- `MatDialog.open()` avec `maxWidth: '900px'` (équivalent MUI `md`), `width: '100%'`.
- Sur mobile (`Breakpoints.XSmall` via `BreakpointObserver`) : `panelClass: 'recruiter-dialog-fullscreen'` qui force `width: 100vw`, `height: 100vh`, `max-width: none`.
- Bouton croix en haut à droite (`position: absolute`).
- Bouton CTA en bas (`MatDialogActions`) « J'ai lu, explorons le site » qui appelle `dialogRef.close()`.
- Fermeture par click outside et touche Escape : laissées par défaut (comportement Material standard, sans surprise pour l'utilisateur).

## Responsive et accessibilité

- `BreakpointObserver.observe(Breakpoints.XSmall)` dans `RecruiterGuideFab` pour switcher fullscreen.
- A11y :
  - FAB : `aria-label="Guide pour recruteurs"`.
  - Dialog : `aria-labelledby` géré automatiquement par Material via `MatDialogTitle`.
  - Bouton croix : `aria-label="Fermer"`.
  - Liens contact : `target="_blank" rel="noopener noreferrer"`.

## SSR

- Le FAB s'affiche au render initial (pur HTML statique, pas d'accès `window` / `document` / `localStorage`).
- `MatDialog.open()` n'est appelé qu'au clic utilisateur, donc jamais pendant le rendu serveur.
- `BreakpointObserver` est SSR-safe côté Angular CDK (retourne une valeur par défaut côté serveur).

## Fichiers impactés

**Créés :**
- `src/app/shared/components/recruiter-guide/recruiter-guide-fab.ts`
- `src/app/shared/components/recruiter-guide/recruiter-guide-fab.html`
- `src/app/shared/components/recruiter-guide/recruiter-guide-fab.scss`
- `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.ts`
- `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.html`
- `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.scss`
- `src/app/shared/components/recruiter-guide/recruiter-step.ts` (template inline, pas de fichier .html séparé pour ce petit composant)
- `src/app/shared/components/recruiter-guide/recruiter-step.scss`

**Modifiés :**
- `src/app/app.html` — ajout de `<app-recruiter-guide-fab />` après `<router-outlet>`.
- `src/app/app.ts` — import de `RecruiterGuideFab` dans le tableau `imports`.

**Aucune modification :**
- `package.json` (Angular Material 21 et CDK 21 déjà présents).
- `src/styles.scss` (le theme Material 3 azure est déjà configuré).
- `src/index.html` (Material Icons et Roboto déjà chargés).

## Hors scope

- Pas de tests pour ce composant (cohérent avec l'état actuel du projet, qui n'a pas de suite de tests pour les composants présentationnels).
- Pas d'i18n (modale en français uniquement, comme le reste de l'app).
- Pas de variante dark mode dédiée (le theme Material 3 gère le `color-scheme` via `styles.scss`, le composant utilise les variables système).
- Pas de tracking analytics du clic FAB.
