import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PlayPayload } from '../models/grille.model';
import { environment } from '../../../environments/environment';

/**
 * Soumission des grilles d'un tirage (LF-31). Appelle `POST /api/parties` avec
 * `{ tirageId, grilles }`. Le back répond `201` sans body — la méthode renvoie
 * donc `void`. Les erreurs remontent en `ApiError` (via l'errorInterceptor) et
 * sont mappées par l'appelant.
 */
@Injectable({ providedIn: 'root' })
export class PartieService {
  private readonly apiUrl = `${environment.apiUrl}/parties`;
  private readonly http = inject(HttpClient);

  async playGrilles(payload: PlayPayload): Promise<void> {
    // Réponse `201` au corps vide : HttpClient (responseType json par défaut)
    // la résout en `null` sans lever d'erreur. On garde le json pour que les
    // corps d'erreur restent parsés et exploitables par l'errorInterceptor.
    await firstValueFrom(this.http.post<void>(this.apiUrl, payload));
  }
}
