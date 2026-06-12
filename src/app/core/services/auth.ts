import { LoginRequest, LoginResponse, RegisterRequest, User } from '../../shared/models/user.model';
import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  user = signal<User | null>(null);

  /**
   * Flag d'idempotence : empêche les appels multiples simultanés à logout()
   * (ex : plusieurs requêtes HTTP en vol qui reçoivent toutes un 401).
   * Remis à false lors d'une nouvelle connexion.
   */
  private loggingOut = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed: unknown = JSON.parse(savedUser);
          if (this.isValidUser(parsed)) {
            this.user.set(parsed);
          } else {
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('user');
        }
      }
    }
  }

  /**
   * Valide explicitement la forme de l'objet issu du localStorage.
   * Évite d'accepter des données malformées ou manipulées (XSS, extension tierce).
   */
  private isValidUser(data: unknown): data is User {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as Record<string, unknown>)['id'] === 'number' &&
      typeof (data as Record<string, unknown>)['username'] === 'string' &&
      typeof (data as Record<string, unknown>)['email'] === 'string' &&
      ['USER', 'ADMIN'].includes((data as Record<string, unknown>)['role'] as string)
    );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.persistSession(response)),
    );
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.persistSession(response)),
    );
  }

  /**
   * Persiste le token et l'utilisateur après login ou register.
   * Réinitialise le flag `loggingOut` pour éviter un faux-positif d'idempotence.
   */
  private persistSession(response: LoginResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    this.user.set(response.user);
    this.loggingOut = false;
  }

  logout(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('token');
  }
}
