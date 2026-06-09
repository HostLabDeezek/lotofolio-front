import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Jeu } from '../models/jeu.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JeuService {

  private apiUrl = `${environment.apiUrl}/jeux`;
  private http = inject(HttpClient);

  getJeux(): Promise<Jeu[]> {
    return firstValueFrom(this.http.get<Jeu[]>(this.apiUrl));
  }
}
