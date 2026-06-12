/**
 * Codes métier renvoyés par le backend dans le champ `code` des réponses d'erreur.
 * Comparer sur le code évite le couplage fragile sur les messages localisés.
 */
export const ApiErrorCode = {
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TIRAGE_NOT_FOUND: 'TIRAGE_NOT_FOUND',
  PARTIE_NOT_FOUND: 'PARTIE_NOT_FOUND',
  CUTOFF_PASSED: 'CUTOFF_PASSED',
  INVALID_GRILLE: 'INVALID_GRILLE',
} as const;

/** Détail de validation renvoyé par le back pour `INVALID_PAYLOAD` (Zod). */
export interface ApiErrorDetail {
  field: string;
  message: string;
}

/**
 * Erreur HTTP normalisée par l'`errorInterceptor`.
 *
 * Le back renvoie trois formes de corps d'erreur (cf. MEMO LF-31 §2) :
 *  - métier : `{ code, message }`
 *  - payload invalide (Zod) : `{ code: 'INVALID_PAYLOAD', details: [...] }`
 *  - serveur / auth : `{ error: '...' }`
 *
 * `ApiError` expose les trois sous une forme unique : `status` (HTTP),
 * `code` (métier, ou `null`), `details` (Zod, ou `null`) et un `message`
 * lisible. Les consommateurs qui ne lisent que `message` restent compatibles.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
    readonly details: ApiErrorDetail[] | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
