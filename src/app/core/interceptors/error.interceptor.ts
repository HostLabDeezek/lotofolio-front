import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, ApiErrorDetail } from '../errors/api-error';

/** Corps d'erreur possibles renvoyés par le back (cf. MEMO LF-31 §2). */
interface ErrorBody {
  code?: string;
  message?: string;
  error?: string;
  details?: ApiErrorDetail[];
}

/**
 * Normalise toute erreur HTTP en `ApiError` (status + code + message + details).
 * Le `message` reste résolu comme avant (`message` métier, sinon `error`, sinon
 * fallback) pour rester rétrocompatible avec les écrans qui ne lisent que lui.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const body: ErrorBody = (err.error as ErrorBody) ?? {};
      const message = body.message ?? body.error ?? 'Une erreur est survenue';
      const code = body.code ?? null;
      const details = body.details ?? null;
      return throwError(() => new ApiError(err.status, code, message, details));
    }),
  );
};
