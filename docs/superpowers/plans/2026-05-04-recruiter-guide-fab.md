# RecruiterGuideFab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Recruteurs — lisez-moi" floating action button visible on every page that opens a presentation modal describing the Lotofolio project, demo account, technical highlights (front + back), and contact info.

**Architecture:** Three standalone Angular 21 components in `src/app/shared/components/recruiter-guide/`: a thin FAB component mounted at app root that calls `MatDialog.open()`, a dialog content component that lazy-loads on click, and a small reusable `RecruiterStep` for numbered list items. No HTTP, no state — pure presentation.

**Tech Stack:** Angular 21 standalone components, Angular Material 21 (Material 3 azure theme already configured), Angular CDK 21 (`BreakpointObserver`), Material Icons (already loaded in `index.html`).

**Spec reference:** `docs/superpowers/specs/2026-05-04-recruiter-guide-fab-design.md`

**Note on testing:** This project has no existing component tests for presentational components and no Karma test for the existing layout/header beyond defaults. Adding TDD scaffolding for a pure presentation component would be out of scope and out of pattern. Each task ends with a manual verification step (visual check in the browser via `npm start`) instead of a unit test. The `simplify` skill should be invoked at the very end to review the diff for quality.

---

## File Structure

**Created:**
- `src/app/shared/components/recruiter-guide/recruiter-step.ts` — small standalone component, template inline, ~40 lines.
- `src/app/shared/components/recruiter-guide/recruiter-step.scss`
- `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.ts` — standalone dialog content component.
- `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.html` — full modal markup (~250 lines).
- `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.scss`
- `src/app/shared/components/recruiter-guide/recruiter-guide-fab.ts` — standalone FAB component.
- `src/app/shared/components/recruiter-guide/recruiter-guide-fab.html`
- `src/app/shared/components/recruiter-guide/recruiter-guide-fab.scss`

**Modified:**
- `src/app/app.ts` — import `RecruiterGuideFab` into the standalone component's `imports`.
- `src/app/app.html` — add `<app-recruiter-guide-fab />` after `<router-outlet>`.
- `src/styles.scss` — add the `.recruiter-dialog-fullscreen` panelClass at the end of the file (the panelClass on `MatDialog` is applied to a CDK overlay sibling outside Angular's view encapsulation, so it MUST live in global styles, not in the component scss).

---

## Task 1: Create the `RecruiterStep` component

**Files:**
- Create: `src/app/shared/components/recruiter-guide/recruiter-step.ts`
- Create: `src/app/shared/components/recruiter-guide/recruiter-step.scss`

- [ ] **Step 1: Create `recruiter-step.scss`**

```scss
:host {
  display: block;
  margin-bottom: 1.5rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step__number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
}

.step__body {
  flex: 1;
  min-width: 0;
}

.step__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  margin: 0 0 0.35rem 0;
  font: var(--mat-sys-title-medium);
}

.step__title mat-icon {
  font-size: 1.1rem;
  width: 1.1rem;
  height: 1.1rem;
}

.step__description {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
}

.step__description ::ng-deep p {
  margin: 0 0 0.5rem 0;
}

.step__description ::ng-deep p:last-child {
  margin-bottom: 0;
}

.step__description ::ng-deep ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
}

.step__description ::ng-deep code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  background-color: var(--mat-sys-surface-container-high);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-size: 0.85em;
}
```

- [ ] **Step 2: Create `recruiter-step.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recruiter-step',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './recruiter-step.scss',
  template: `
    <div class="step">
      <div class="step__number" aria-hidden="true">{{ number() }}</div>
      <div class="step__body">
        <div class="step__title">
          <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
          <span>{{ title() }}</span>
        </div>
        <div class="step__description">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class RecruiterStep {
  number = input.required<string>();
  icon = input.required<string>();
  title = input.required<string>();
}
```

- [ ] **Step 3: Verify the file compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: no error related to `recruiter-step.ts`. (Pre-existing project errors, if any, can be ignored — only new ones matter.)

---

## Task 2: Create the `RecruiterGuideDialog` skeleton + scss

**Files:**
- Create: `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.ts`
- Create: `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.html` (empty placeholder for now)
- Create: `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.scss`

- [ ] **Step 1: Create `recruiter-guide-dialog.scss`**

```scss
:host {
  display: block;
}

.dialog__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-right: 3rem;
}

.dialog__title-text h2 {
  margin: 0;
  font: var(--mat-sys-title-large);
  font-weight: 700;
  line-height: 1.2;
}

.dialog__title-text small {
  display: block;
  margin-top: 0.15rem;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

.dialog__close {
  position: absolute;
  top: 8px;
  right: 8px;
}

.dialog__intro p {
  margin: 0 0 0.85rem 0;
  font: var(--mat-sys-body-large);
}

.callout {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  margin: 0.5rem 0 1.5rem 0;
  background-color: var(--mat-sys-surface-container-high);
}

.callout__icon {
  flex-shrink: 0;
  color: var(--mat-sys-primary);
  margin-top: 0.15rem;
}

.callout__title {
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  font: var(--mat-sys-title-small);
}

.callout__body {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
}

.demo-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.demo-table th,
.demo-table td {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--mat-sys-outline-variant);
  font: var(--mat-sys-body-medium);
}

.demo-table th {
  font-weight: 700;
  background-color: var(--mat-sys-surface-container-low);
}

.demo-table td.mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 0.85rem;
}

.demo-table-wrapper {
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.chip-mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-weight: 700;
}

.section-title {
  font: var(--mat-sys-title-medium);
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.section-lead {
  color: var(--mat-sys-on-surface-variant);
  margin: 0 0 1rem 0;
  font: var(--mat-sys-body-medium);
}

.parcours-card {
  border-left: 4px solid var(--mat-sys-primary);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.parcours-card__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  font: var(--mat-sys-title-small);
}

.parcours-card__body {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
}

.parcours-card__body ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
}

.tech-list {
  margin: 0 0 1.5rem 0;
  padding-left: 1.25rem;
}

.tech-list li {
  margin-bottom: 0.4rem;
  font: var(--mat-sys-body-medium);
}

.tech-list li strong {
  font-weight: 700;
}

.tech-list--limits li {
  font-style: italic;
  color: var(--mat-sys-on-surface-variant);
}

.contact {
  margin-top: 1rem;
}

.contact__lead {
  margin: 0 0 1rem 0;
  font: var(--mat-sys-body-medium);
}

.contact__buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.divider {
  border: 0;
  border-top: 1px solid var(--mat-sys-outline-variant);
  margin: 1.5rem 0;
}

mat-dialog-content code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  background-color: var(--mat-sys-surface-container-high);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-size: 0.85em;
}
```

- [ ] **Step 2: Create `recruiter-guide-dialog.html` (empty placeholder)**

```html
<!-- Dialog content filled in Task 3 -->
<h2 mat-dialog-title>Bienvenue sur Lotofolio</h2>
<mat-dialog-content>Loading…</mat-dialog-content>
<mat-dialog-actions>
  <button mat-flat-button (click)="close()">Fermer</button>
</mat-dialog-actions>
```

- [ ] **Step 3: Create `recruiter-guide-dialog.ts`**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { RecruiterStep } from './recruiter-step';

interface DemoAccount {
  role: string;
  email: string;
  username: string;
}

@Component({
  selector: 'app-recruiter-guide-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    RecruiterStep,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recruiter-guide-dialog.html',
  styleUrl: './recruiter-guide-dialog.scss',
})
export class RecruiterGuideDialog {
  private readonly dialogRef = inject(MatDialogRef<RecruiterGuideDialog>);

  protected readonly demoAccount: DemoAccount = {
    role: 'USER',
    email: 'user@lotofolio.fr',
    username: 'Maxime Dupuis',
  };

  protected readonly demoPassword = 'Password1!';

  protected readonly contact = {
    email: 'simon.pere@live.fr',
    linkedin: 'https://www.linkedin.com/in/simon-pere-6430331b8/',
    githubFront: 'https://github.com/HostLabDeezek/lotofolio-front',
    githubBack: 'https://github.com/HostLabDeezek/lotofolio-back',
  };

  close(): void {
    this.dialogRef.close();
  }
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: no new errors related to these files.

---

## Task 3: Fill the dialog HTML with the full content

**Files:**
- Modify: `src/app/shared/components/recruiter-guide/recruiter-guide-dialog.html`

- [ ] **Step 1: Replace the placeholder with the full template**

Replace the entire file contents with:

```html
<h2 mat-dialog-title class="dialog__title">
  <mat-icon aria-hidden="true" color="primary">waving_hand</mat-icon>
  <div class="dialog__title-text">
    <h2>Bienvenue sur Lotofolio</h2>
    <small>Guide rapide pour explorer le projet en 5 minutes</small>
  </div>
  <button
    mat-icon-button
    class="dialog__close"
    aria-label="Fermer"
    (click)="close()"
  >
    <mat-icon>close</mat-icon>
  </button>
</h2>

<mat-dialog-content>
  <!-- Intro -->
  <div class="dialog__intro">
    <p>
      Bonjour, et merci de prendre le temps de regarder mon travail. Lotofolio est un
      <strong>projet personnel full-stack</strong> que je développe pour continuer à
      coder en Angular en dehors de mes projets pro et garder la main sur la stack.
    </p>
    <p>
      J'ai développé à la fois le <strong>back</strong> (Node.js + Express 5 +
      TypeScript strict + Prisma + PostgreSQL, hébergé sur Render) et le
      <strong>front</strong> (Angular 21 standalone components, signals,
      <code>&#64;ngrx/signals</code>, Material 3). Le projet n'est pas terminé : les
      fondations sont en place (auth, store, intercepteurs, sécurité back), les
      écrans métier (jeu de grille, tirage, résultats) arrivent.
    </p>
    <p>
      Les données de démo sont déjà chargées en base. Allez-y, vous ne casserez rien.
    </p>
  </div>

  <!-- À savoir avant de commencer -->
  <div class="callout">
    <mat-icon class="callout__icon" aria-hidden="true">info</mat-icon>
    <div>
      <p class="callout__title">À savoir avant de commencer</p>
      <p class="callout__body">
        Le back est hébergé sur le plan gratuit de Render, qui met le serveur en
        veille après ~15 minutes d'inactivité. La
        <strong>première requête peut prendre 30 à 60 secondes</strong> (cold start),
        ensuite tout est instantané. Si la page de connexion semble figée au premier
        essai, laissez-lui ce petit délai. Côté périmètre, seuls les endpoints
        <code>/auth</code> et <code>GET /jeux</code> sont actifs aujourd'hui — les
        routes Grilles, Tirages, Parties, Resultats sont à venir (modèles Prisma déjà
        en place).
      </p>
    </div>
  </div>

  <hr class="divider" />

  <!-- Compte de démo -->
  <h3 class="section-title">Compte de démonstration</h3>
  <p class="section-lead">
    Le mot de passe :
    <mat-chip class="chip-mono">{{ demoPassword }}</mat-chip>
  </p>
  <div class="demo-table-wrapper">
    <table class="demo-table">
      <thead>
        <tr>
          <th>Rôle</th>
          <th>Email</th>
          <th>Username</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ demoAccount.role }}</td>
          <td class="mono">{{ demoAccount.email }}</td>
          <td>{{ demoAccount.username }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <hr class="divider" />

  <!-- Parcours -->
  <h3 class="section-title">Parcours pas-à-pas</h3>
  <p class="section-lead">
    Voici ce que vous pouvez faire aujourd'hui pour valider le bon fonctionnement de
    l'application telle qu'elle est à ce stade :
  </p>

  <app-recruiter-step number="1" icon="login" title="Se connecter">
    <p>
      Cliquez sur « Connexion », saisissez les credentials du compte de démo
      ci-dessus. Le back renvoie un <strong>JWT</strong> qui est stocké en
      <code>localStorage</code>. Toutes les requêtes suivantes ajoutent
      automatiquement l'en-tête <code>Authorization: Bearer …</code> via un
      <strong>HTTP interceptor</strong>.
    </p>
  </app-recruiter-step>

  <app-recruiter-step number="2" icon="dns" title="Arriver sur le home">
    <p>
      Une fois loggué, vous arrivez sur la page d'accueil protégée par un
      <code>authGuard</code>. Le composant déclenche
      <code>JeuStore.loadJeux()</code> — un <strong>signal store</strong>
      <code>&#64;ngrx/signals</code> qui charge la liste des jeux et expose
      <code>loading</code>, <code>error</code> et <code>jeux</code> en signaux
      réactifs.
    </p>
  </app-recruiter-step>

  <app-recruiter-step
    number="3"
    icon="construction"
    title="Suite à venir (en cours de développement)"
  >
    <p>
      Les écrans pour <strong>composer une grille</strong>,
      <strong>déclencher un tirage</strong> et
      <strong>consulter les résultats</strong> sont la prochaine étape. Côté back, les
      modèles Prisma <code>Grille</code>, <code>Tirage</code>, <code>Partie</code> et
      <code>Resultat</code> sont déjà en place avec leurs relations — il reste à
      câbler les routes et les services.
    </p>
  </app-recruiter-step>

  <hr class="divider" />

  <!-- Encart parcours utilisateur -->
  <h3 class="section-title">Côté utilisateur</h3>
  <mat-card appearance="outlined" class="parcours-card">
    <p class="parcours-card__title">
      <mat-icon aria-hidden="true" color="primary">person</mat-icon>
      Ce que voit un utilisateur connecté
    </p>
    <div class="parcours-card__body">
      <p>
        Aujourd'hui, l'utilisateur connecté accède au header (avec son nom + bouton de
        déconnexion) et à la liste des jeux disponibles. Le bouton de déconnexion
        purge le token, vide le signal <code>user</code> du <code>AuthService</code>
        et redirige vers <code>/login</code>. Toute requête HTTP qui revient en
        <strong>401</strong> (token expiré, par exemple) déclenche le même flux
        automatiquement via l'<code>authInterceptor</code>.
      </p>
    </div>
  </mat-card>

  <hr class="divider" />

  <!-- Pour aller plus loin -->
  <h3 class="section-title">Pour aller plus loin (optionnel)</h3>

  <app-recruiter-step
    number="4"
    icon="bug_report"
    title="Inspecter les requêtes dans les DevTools"
  >
    <p>
      Ouvrez l'onglet <strong>Réseau</strong>, faites une action quelconque. Vous
      verrez l'en-tête <code>Authorization: Bearer …</code> ajouté automatiquement
      sur toutes les requêtes vers l'API. Si vous supprimez le token de
      <code>localStorage</code> et faites une requête, l'<code>errorInterceptor</code>
      normalise le message et l'<code>authInterceptor</code> vous redirige vers
      <code>/login</code>.
    </p>
  </app-recruiter-step>

  <app-recruiter-step
    number="5"
    icon="shield"
    title="Tester le rate-limit du back"
  >
    <p>
      Faites 6 tentatives de login en moins de 15 minutes avec un mauvais mot de
      passe. La 6ᵉ renvoie un <strong>HTTP 429</strong>. Le rate-limit est ciblé
      uniquement sur <code>/auth/login</code> (5 / 15 min) et <code>/auth/register</code>
      (3 / heure) — pas un rate-limit global naïf qui pénaliserait les vraies
      requêtes.
    </p>
  </app-recruiter-step>

  <app-recruiter-step number="6" icon="code" title="Lire le code (les repos sont publics)">
    <p>Les deux dépôts GitHub sont publics et documentés.</p>
    <p>
      <a [href]="contact.githubFront" target="_blank" rel="noopener noreferrer">
        github.com/HostLabDeezek/lotofolio-front
      </a>
      <br />
      <a [href]="contact.githubBack" target="_blank" rel="noopener noreferrer">
        github.com/HostLabDeezek/lotofolio-back
      </a>
    </p>
  </app-recruiter-step>

  <hr class="divider" />

  <!-- Points techniques -->
  <h3 class="section-title">Points techniques à noter</h3>

  <p class="section-lead"><strong>Front (ce que je voulais montrer en Angular)</strong></p>
  <ul class="tech-list">
    <li>
      <strong>Angular 21 standalone</strong> partout (zéro NgModule), <code>inject()</code>
      au lieu des constructeurs DI.
    </li>
    <li>
      <strong>Signals + <code>&#64;ngrx/signals</code></strong> pour le state global
      (<code>JeuStore</code>) — modèle réactif moderne, fini les Observables passés
      aux <code>async pipe</code>.
    </li>
    <li>
      <strong>Auth JWT</strong> : <code>AuthService</code> avec un signal
      <code>user</code>, garde de route <code>authGuard</code> sur l'arbre protégé.
    </li>
    <li>
      <strong>Deux HTTP interceptors</strong> :
      <code>authInterceptor</code> (Bearer auto + auto-logout sur 401) et
      <code>errorInterceptor</code> (normalisation des messages d'erreur API en une
      forme unique côté UI).
    </li>
    <li>
      <strong>SSR-safe</strong> : tous les accès <code>localStorage</code> sont
      protégés par <code>isPlatformBrowser(PLATFORM_ID)</code>, l'app peut tourner en
      Angular SSR sans planter au render initial.
    </li>
    <li>
      <strong>TypeScript strict</strong> + <code>strictTemplates</code> activés —
      pas de <code>any</code> implicite, les erreurs de type dans les templates
      cassent le build.
    </li>
    <li>
      <strong>Material 3</strong> avec theming via <code>mat.theme()</code> et CSS
      variables système (<code>var(--mat-sys-…)</code>) plutôt que des couleurs en
      dur.
    </li>
  </ul>

  <p class="section-lead"><strong>Back</strong></p>
  <ul class="tech-list">
    <li>
      <strong>Node 20 + Express 5 + TypeScript strict</strong> (ESM natif), Prisma 7
      + PostgreSQL 16.
    </li>
    <li>
      <strong>Validation des variables d'env au démarrage</strong> avec Zod : le
      process refuse de booter si <code>JWT_SECRET</code> &lt; 32 chars ou si
      <code>DATABASE_URL</code> est invalide. <em>Fail fast</em> plutôt qu'API mal
      configurée en prod.
    </li>
    <li>
      <strong>Liveness <code>/health</code> vs readiness <code>/ready</code></strong>
      : seul <code>/ready</code> tape la BDD (<code>SELECT 1</code>), évite les
      redémarrages intempestifs sur un hoquet réseau Postgres.
    </li>
    <li>
      <strong>Rate-limit ciblé</strong> par endpoint sensible (5 logins / 15 min, 3
      registers / heure) au lieu d'un rate-limit global.
    </li>
    <li>
      <strong>CORS en whitelist explicite</strong> lue depuis l'env (multi-origines
      via <code>,</code>), <code>helmet</code>, mots de passe hashés en bcrypt 10
      rounds.
    </li>
    <li>
      <strong>Graceful shutdown</strong> sur SIGINT / SIGTERM avec
      <code>prisma.$disconnect()</code> et timeout 10 s — important pour les
      déploiements zero-downtime sur Render.
    </li>
    <li>
      <strong>Infra as Code</strong> via <code>render.yaml</code> : déploiement
      reproductible, <code>JWT_SECRET</code> généré côté Render, jamais en clair.
    </li>
    <li>
      <strong>Logs structurés</strong> Winston (JSON en prod, coloré en dev).
    </li>
    <li>
      <strong>Validation Zod par route</strong>, format d'erreur standardisé
      <code>{{ '{' }} error, details? {{ '}' }}</code>.
    </li>
  </ul>

  <p class="section-lead"><strong>Limites assumées</strong></p>
  <ul class="tech-list tech-list--limits">
    <li>Pas de tests automatisés (front et back) — le plus gros gap, conscient.</li>
    <li>Pas de refresh token (JWT 7 jours unique, pas de révocation côté serveur).</li>
    <li>RBAC pas encore actif (enum <code>Role</code> prêt en base, middleware à venir).</li>
    <li>Pas de CI (pas de GitHub Actions configuré).</li>
    <li>Endpoints Grilles / Tirages / Parties / Resultats à implémenter.</li>
  </ul>

  <hr class="divider" />

  <!-- Contact -->
  <div class="contact">
    <p class="contact__lead">
      Merci encore pour votre temps. Si vous avez la moindre question sur un choix
      technique, un arbitrage ou une partie du code, je serai ravi d'en discuter.
    </p>
    <div class="contact__buttons">
      <a
        mat-stroked-button
        [href]="'mailto:' + contact.email"
      >
        <mat-icon>email</mat-icon>
        {{ contact.email }}
      </a>
      <a
        mat-stroked-button
        [href]="contact.linkedin"
        target="_blank"
        rel="noopener noreferrer"
      >
        <mat-icon>link</mat-icon>
        LinkedIn
      </a>
      <a
        mat-stroked-button
        [href]="contact.githubFront"
        target="_blank"
        rel="noopener noreferrer"
      >
        <mat-icon>code</mat-icon>
        Repo front
      </a>
      <a
        mat-stroked-button
        [href]="contact.githubBack"
        target="_blank"
        rel="noopener noreferrer"
      >
        <mat-icon>code</mat-icon>
        Repo back
      </a>
    </div>
  </div>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-flat-button (click)="close()">J'ai lu, explorons le site</button>
</mat-dialog-actions>
```

- [ ] **Step 2: Verify the template compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: no new errors. Angular's `strictTemplates` will catch typos in the bound expressions.

---

## Task 4: Create the `RecruiterGuideFab` component

**Files:**
- Create: `src/app/shared/components/recruiter-guide/recruiter-guide-fab.ts`
- Create: `src/app/shared/components/recruiter-guide/recruiter-guide-fab.html`
- Create: `src/app/shared/components/recruiter-guide/recruiter-guide-fab.scss`

- [ ] **Step 1: Create `recruiter-guide-fab.scss`**

```scss
:host {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
}

@media (min-width: 600px) {
  :host {
    bottom: 24px;
    right: 24px;
  }
}

button[mat-fab] {
  text-transform: none;
  font-weight: 600;
}

button[mat-fab] mat-icon {
  margin-right: 0.5rem;
}
```

- [ ] **Step 2: Create `recruiter-guide-fab.html`**

```html
<button
  mat-fab
  extended
  color="primary"
  aria-label="Guide pour recruteurs"
  (click)="openDialog()"
>
  <mat-icon>help_outline</mat-icon>
  Recruteurs — lisez-moi
</button>
```

- [ ] **Step 3: Create `recruiter-guide-fab.ts`**

```typescript
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { RecruiterGuideDialog } from './recruiter-guide-dialog';

@Component({
  selector: 'app-recruiter-guide-fab',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recruiter-guide-fab.html',
  styleUrl: './recruiter-guide-fab.scss',
})
export class RecruiterGuideFab {
  private readonly dialog = inject(MatDialog);
  private readonly breakpoints = inject(BreakpointObserver);

  async openDialog(): Promise<void> {
    const isXSmall = (await firstValueFrom(this.breakpoints.observe(Breakpoints.XSmall))).matches;

    this.dialog.open(RecruiterGuideDialog, {
      maxWidth: isXSmall ? '100vw' : '900px',
      width: '100%',
      panelClass: isXSmall ? 'recruiter-dialog-fullscreen' : '',
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }
}
```

- [ ] **Step 4: Add the global panelClass to `src/styles.scss`**

The panelClass on `MatDialog` is applied to a CDK overlay sibling outside Angular's view encapsulation. It MUST live in global styles to take effect.

Append to the end of `src/styles.scss`:

```scss
.recruiter-dialog-fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: none !important;
  max-height: none !important;

  .mat-mdc-dialog-container {
    border-radius: 0;
    height: 100vh;
  }
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: no new errors related to the recruiter-guide files.

---

## Task 5: Mount the FAB in the app shell

**Files:**
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`

- [ ] **Step 1: Update `src/app/app.ts` to import the FAB component**

Replace the file contents with:

```typescript
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RecruiterGuideFab } from './shared/components/recruiter-guide/recruiter-guide-fab';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RecruiterGuideFab],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('loto-frontend');
}
```

(Removed the unused `inject` import.)

- [ ] **Step 2: Update `src/app/app.html`**

Replace the file contents with:

```html
<router-outlet></router-outlet>
<app-recruiter-guide-fab />
```

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build`
Expected: Successful build. No new errors. Bundle size warning is acceptable (Material adds weight).

---

## Task 6: Manual verification in the browser

**Files:**
- None (manual verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm start`
Expected: server up on `http://localhost:4200`.

- [ ] **Step 2: Verify on the login page**

Open `http://localhost:4200/login` in a browser.
Expected:
- The « Recruteurs — lisez-moi » FAB is visible in the bottom-right corner.
- It has the primary color of the theme, the help icon, and a slight shadow.

- [ ] **Step 3: Open the modal**

Click the FAB.
Expected:
- The dialog opens, max-width ~900px, centered.
- The title shows the waving hand icon + « Bienvenue sur Lotofolio » + sub-title.
- The close (×) button sits in the top-right.
- All sections render: intro, cold start callout, demo account table, 6 numbered steps, parcours card, 3 tech lists (Front / Back / Limits), 4 contact buttons.
- The `code`, `chip`, and links are styled correctly.
- Scroll inside the dialog works; the page underneath does not scroll.

- [ ] **Step 4: Close the modal three ways**

Test each:
- Click the × in the top-right.
- Click the « J'ai lu, explorons le site » button.
- Press the Escape key.
Expected: dialog closes cleanly each time.

- [ ] **Step 5: Verify it works on a protected route**

Log in with `user@lotofolio.fr` / `Password1!` (handle the cold start if needed).
Expected:
- After login, the FAB is still visible on the home page.
- Clicking it opens the same dialog.

- [ ] **Step 6: Check responsive (mobile width)**

Open Chrome DevTools, switch to a mobile viewport (e.g. iPhone SE, 375px wide). Reload.
Expected:
- FAB sits at bottom-right with smaller offsets (16px instead of 24px).
- Click it → dialog opens fullscreen (covers the entire viewport, no rounded corners, no margin).
- Scroll inside the dialog works.

- [ ] **Step 7: Accessibility quick check**

With the dev server running and the page focused, press Tab repeatedly until the FAB is focused. Press Enter.
Expected:
- The FAB receives a visible focus ring.
- Enter opens the dialog.
- Focus moves into the dialog.
- After closing, focus returns to the FAB (Material's `restoreFocus: true` handles this).

- [ ] **Step 8: Check the browser console**

Expected:
- No errors related to MatDialog, RecruiterStep, or BreakpointObserver in the console at any point during the above steps.

---

## Task 7: Final code review with the `simplify` skill

- [ ] **Step 1: Invoke the `simplify` skill**

Use the `Skill` tool with `simplify` to have the changed files reviewed for unused code, redundant imports, dead CSS, and quality issues.

- [ ] **Step 2: Apply any reasonable suggestions**

Skill output is advisory — apply suggestions that genuinely simplify or improve, ignore those that fight the design intent (e.g. don't merge the FAB and Dialog into one file just to "reduce file count" — the separation is intentional for lazy-loading the dialog content).

---

## Self-review notes

- **Spec coverage:** Architecture (3 components) → Tasks 1, 2, 4. Mapping React/MUI → Angular Material → applied throughout Tasks 2, 3, 4. Content factuel (compte démo, encarts, contact) → Task 3. Style FAB (position fixed, z-index, extended variant, texte exact, icône) → Task 4. Comportement modale (maxWidth, fullscreen mobile, croix, CTA, Escape) → Task 4 + Task 6 verification. Responsive + a11y → Task 4 + Task 6. SSR-safe → no `window`/`document`/`localStorage` access in any of the new files; verified by inspection.
- **Placeholder scan:** No TBDs. All code blocks are complete and self-contained.
- **Type consistency:** `RecruiterGuideDialog` is referenced from `RecruiterGuideFab` with the same name. `RecruiterStep` exposes `number`, `icon`, `title` as inputs and is consumed in the template with the same attribute names. `demoAccount.role`, `demoAccount.email`, `demoAccount.username` and `demoPassword`, `contact.email`, `contact.linkedin`, `contact.githubFront`, `contact.githubBack` are defined in Task 2 and consumed in Task 3 with matching names.
