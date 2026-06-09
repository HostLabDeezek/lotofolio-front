import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PartieDetail, PartieHistoriqueItem } from '../models/historique.model';
import { environment } from '../../../environments/environment';

/**
 * Accès à l'historique des parties de l'utilisateur (LF-38 / LF-39).
 *
 * - `getHistory()` : liste des parties jouées sur les 30 derniers jours.
 * - `getPartieDetail(id)` : détail complet d'une partie (tirage + grilles).
 *
 * Les erreurs remontent en `ApiError` via l'errorInterceptor — l'appelant
 * est responsable du mapping vers un message utilisateur.
 */
@Injectable({ providedIn: 'root' })
export class HistoriqueService {
  private readonly apiUrl = `${environment.apiUrl}/parties`;
  private readonly http = inject(HttpClient);

  /** GET /api/parties/history — retourne [] si aucune partie dans la fenêtre. */
  async getHistory(): Promise<PartieHistoriqueItem[]> {
    return firstValueFrom(
      this.http.get<PartieHistoriqueItem[]>(`${this.apiUrl}/history`),
    );
  }

  /** GET /api/parties/:id — retourne le détail complet de la partie. */
  async getPartieDetail(partieId: number): Promise<PartieDetail> {
    return firstValueFrom(
      this.http.get<PartieDetail>(`${this.apiUrl}/${partieId}`),
    );
  }
}
