import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Games } from './features/games/games';
import { Layout } from './core/layout/layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'jeux', pathMatch: 'full' },
      { path: 'jeux', component: Games },
    ],
  },
  { path: '**', redirectTo: '/jeux' },
];
