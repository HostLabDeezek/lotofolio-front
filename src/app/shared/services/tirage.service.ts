import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Tirage } from '../models/grille.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TirageService {
  private apiUrl = `${environment.apiUrl}/jeux`;
  private http = inject(HttpClient);

  /**
   * Récupère le tirage en cours pour un jeu.
   * Renvoie `null` quand aucun tirage n'est exploitable :
   * 404 (`NO_CURRENT_TIRAGE`, `JEU_NOT_FOUND`) ou 400 (`INVALID_JEU_ID`).
   * Les autres erreurs sont propagées.
   */
  async getCurrentTirage(jeuId: number): Promise<Tirage | null> {
    try {
      const tirage = await firstValueFrom(
        this.http.get<Tirage>(`${this.apiUrl}/${jeuId}/current-tirage`),
      );
      return tirage ?? null;
    } catch (error) {
      if (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400)) {
        return null;
      }
      throw error;
    }
  }
}
