// services/jeu.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Jeu } from '../shared/models/jeu.model';

@Injectable({ providedIn: 'root' })
export class JeuService {

  private apiUrl = 'http://localhost:3000/api/jeux';

  constructor(private http: HttpClient) {}

  getJeux(): Promise<Jeu[]> {
    return firstValueFrom(this.http.get<Jeu[]>(this.apiUrl));
  }

  getJeu(id: number): Promise<Jeu> {
    return firstValueFrom(this.http.get<Jeu>(`${this.apiUrl}/${id}`));
  }
}