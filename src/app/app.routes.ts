import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { HomePage } from './home-page/home-page';
import { Layout } from './core/layout/layout';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
   {
    path: '',
    component: Layout,
    children: [
      { path: '', component: HomePage },
    ]
  },

  // Redirection des routes inconnues
  { path: '**', redirectTo: '' }
];