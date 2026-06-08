import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'jeux', pathMatch: 'full' },
      { path: 'jeux', loadComponent: () => import('./features/games/games').then(m => m.Games) },
      {
        path: 'jeux/:id/grille',
        loadComponent: () => import('./features/grille/grille').then(m => m.Grille),
      },
    ],
  },
  { path: '**', redirectTo: '/jeux' },
];
