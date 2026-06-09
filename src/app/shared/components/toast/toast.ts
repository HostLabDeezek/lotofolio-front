import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

/**
 * Affiche la pile de toasts (LF-31). Monté une seule fois dans le `Layout`.
 * `role="status"` + `aria-live="polite"` pour l'annonce aux lecteurs d'écran.
 */
@Component({
  selector: 'app-toast-host',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHost {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
