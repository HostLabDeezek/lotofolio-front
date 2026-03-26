# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:4200
npm run build      # Production build
npm test           # Run all tests (Karma/Jasmine)
npm run serve:ssr:loto-frontend  # SSR server
```

Run a single test file by passing the spec path:
```bash
npx karma start --single-run --include="**/auth.spec.ts"
```

## Architecture

**Angular 21** app using standalone components (no NgModules), Angular signals, and `@ngrx/signals` for state management. SSR is enabled via Express.

### Routing

```
''        → redirect to /login
/login    → Login (standalone, no layout)
/form     → SignalProductForm (standalone, no layout)
''        → Layout (header wrapper)
  └── ''  → HomePage
**        → redirect to ''
```

The `Layout` component wraps authenticated routes; unauthenticated routes (login, form) render without it.

### State Management

`JeuStore` (`src/app/shared/stores/jeu.store.ts`) is the primary NgRx signal store. It holds the list of lottery games (`Jeu[]`), selection state, loading, and error. It calls `JeuService` which talks to `http://localhost:3000/api/`.

### Auth

`AuthService` (`src/app/core/services/auth.ts`) stores a JWT in `localStorage` and exposes user state as a signal. Login POSTs to `http://localhost:3000/api/auth/login`. No route guards are currently implemented.

### Key Patterns

- All components are `standalone: true`; use `inject()` for DI
- New Angular control flow syntax: `@if`, `@for`, `@else`
- Signals for local component state; `@ngrx/signals` for shared state
- HTTP calls use `firstValueFrom()` to convert Observables to Promises
- Strict TypeScript (`strict: true`, `strictTemplates: true`)
- Prettier configured: 100-char line width, single quotes
