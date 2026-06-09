import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/**
 * File de notifications éphémères (LF-31). Service signal sans dépendance DOM :
 * le composant `ToastHost` s'abonne à `toasts()` et les rend. Chaque toast se
 * retire tout seul après `DISMISS_MS`.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Durée d'affichage avant disparition automatique (ms). */
  private static readonly DISMISS_MS = 4000;

  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);

  /** Timers de disparition automatique, indexés par id, pour les annuler au dismiss. */
  private readonly _timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Liste lue par le composant d'affichage. */
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  /** Retire manuellement un toast (clic sur la croix) et annule son timer. */
  dismiss(id: number): void {
    const timer = this._timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this._timers.delete(id);
    }
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, kind, message }]);
    // `setTimeout` n'existe pas côté serveur de rendu ; les toasts sont de
    // toute façon déclenchés par une interaction, donc côté navigateur. On garde
    // une référence au timer pour le purger si l'utilisateur ferme avant l'échéance.
    if (typeof setTimeout !== 'undefined') {
      this._timers.set(
        id,
        setTimeout(() => this.dismiss(id), ToastService.DISMISS_MS),
      );
    }
  }
}
