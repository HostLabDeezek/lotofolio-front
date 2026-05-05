import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { HomePage } from './home-page/home-page';
import { Layout } from './core/layout/layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomePage },
    ],
  },
  { path: '**', redirectTo: '' },
];