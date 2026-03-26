import { LoginRequest, LoginResponse, User } from '../../shared/models/user.model';
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = 'http://localhost:3000/api/auth';

  user = signal<User | null>(null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Le backend renvoie : { user: {...}, token: "abc123" }

          // 📝 ÉTAPE 1 : Sauvegarder le TOKEN dans localStorage
          localStorage.setItem('token', response.token);
          // → Pourquoi ? Pour le renvoyer au backend dans les prochaines requêtes

          // 📝 ÉTAPE 2 : Sauvegarder l'USER dans localStorage
          localStorage.setItem('user', JSON.stringify(response.user));
          // → JSON.stringify() transforme l'objet en texte
          // → Pourquoi ? Pour le récupérer au prochain démarrage de l'app

          // 📝 ÉTAPE 3 : Mettre l'user dans le signal
          this.user.set(response.user);
          // → Pourquoi ? Pour l'afficher immédiatement dans les composants
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 🗑️ ÉTAPE 2 : Vider le signal
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
