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
 * `HttpClient` complète toujours son observable (succès ou erreur) — on
 * n'utilise donc pas de `defaultValue` dans `firstValueFrom`, ce qui permet
 * aux erreurs (`ApiError`) de remonter proprement jusqu'à l'appelant.
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

  /**
   * GET /api/parties/:id — retourne le détail complet de la partie.
   *
   * @throws `Error` immédiatement si `partieId` n'est pas un entier positif,
   *         sans émettre de requête HTTP.
   * @throws `ApiError` (via errorInterceptor) sur 403 FORBIDDEN, 404 PARTIE_NOT_FOUND, etc.
   */
  async getPartieDetail(partieId: number): Promise<PartieDetail> {
    if (!Number.isInteger(partieId) || partieId <= 0) {
      return Promise.reject(new Error(`partieId invalide : ${partieId}`));
    }
    return firstValueFrom(
      this.http.get<PartieDetail>(`${this.apiUrl}/${partieId}`),
    );
  }
}
