import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
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

  readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    const first = u.firstName?.trim();
    const last = u.lastName?.trim();
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    return u.username;
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

  get f() {
    return this.passwordForm.controls;
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.authService
      .changePassword({ currentPassword, newPassword })
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
