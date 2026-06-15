import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.Register) },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'jeux', pathMatch: 'full' },
      { path: 'jeux', loadComponent: () => import('./features/games/games').then(m => m.Games) },
      {
        path: 'parametres',
        loadComponent: () => import('./features/settings/settings').then(m => m.Settings),
      },
      {
        path: 'jeux/:id/grille',
        loadComponent: () => import('./features/grille/grille').then(m => m.Grille),
      },
      {
        path: 'historique',
        loadComponent: () =>
          import('./features/historique/historique-list/historique-list').then(
            m => m.HistoriqueList,
          ),
      },
      {
        path: 'historique/:id',
        loadComponent: () =>
          import('./features/historique/historique-detail/historique-detail').then(
            m => m.HistoriqueDetail,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '/jeux' },
];
