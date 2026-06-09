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

  /** Liste lue par le composant d'affichage. */
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  /** Retire manuellement un toast (clic sur la croix). */
  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, kind, message }]);
    // `setTimeout` n'existe pas côté serveur de rendu ; les toasts sont de
    // toute façon déclenchés par une interaction, donc côté navigateur.
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => this.dismiss(id), ToastService.DISMISS_MS);
    }
  }
}
