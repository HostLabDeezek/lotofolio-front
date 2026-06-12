import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, NEVER, throwError } from 'rxjs';
import { ApiError, ApiErrorDetail } from '../errors/api-error';
import { Auth } from '../services/auth';

/** Corps d'erreur possibles renvoyés par le back (cf. MEMO LF-31 §2). */
interface ErrorBody {
  code?: string;
  message?: string;
  error?: string;
  details?: ApiErrorDetail[];
}

/**
 * Normalise toute erreur HTTP en `ApiError` (status + code + message + details).
 *
 * Sur une réponse 401 (token expiré ou invalide) :
 * - Appelle auth.logout() (idempotent grâce au flag loggingOut) qui purge la
 *   session et redirige vers /login.
 * - Retourne NEVER pour que les composants ne reçoivent pas d'erreur parasite
 *   (la navigation va de toute façon les détruire).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        return NEVER;
      }

      const body: ErrorBody = (err.error as ErrorBody) ?? {};
      const message = body.message ?? body.error ?? 'Une erreur est survenue';
      const code = body.code ?? null;
      const details = body.details ?? null;
      return throwError(() => new ApiError(err.status, code, message, details));
    }),
  );
};
