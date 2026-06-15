import {
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type { AbstractControl } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../../core/services/auth';
import { ApiError } from '../../core/errors/api-error';
import { ChangePasswordRequest } from '../../shared/models/user.model';

/** Vérifie que newPassword === confirmPassword. */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPwd = group.get('newPassword')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  return newPwd === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.user;

  /** Rôle affiché en clair pour l'utilisateur. */
  readonly displayRole = computed(() => {
    const role = this.user()?.role;
    const labels: Record<string, string> = { USER: 'Utilisateur', ADMIN: 'Administrateur' };
    return role ? (labels[role] ?? role) : '—';
  });

  readonly isLoading = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  /** Contrôles exposés au template avec typage strict. */
  protected readonly controls = this.passwordForm.controls;

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    // Type check firewall : si ChangePasswordRequest évolue, TypeScript alertera ici.
    const payload: ChangePasswordRequest = { currentPassword, newPassword };

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.authService
      .changePassword(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Mot de passe mis à jour avec succès.');
          this.passwordForm.reset();
        },
        error: (err: ApiError) => {
          this.isLoading.set(false);
          if (err.status === 401) {
            this.errorMessage.set('Mot de passe actuel incorrect.');
          } else {
            this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
          }
        },
      });
  }
}
