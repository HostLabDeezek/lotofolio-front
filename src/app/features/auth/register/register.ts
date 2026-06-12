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
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../../../core/services/auth';
import { ApiError, ApiErrorCode } from '../../../core/errors/api-error';

/** Validateur de groupe : vérifie que `password` et `confirmPassword` sont identiques. */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  /**
   * Formulaire typé (Angular Typed Forms — Angular 14+).
   * `fb.nonNullable` garantit des valeurs `string` (pas `string | null`),
   * éliminant les assertions non-null dans `onSubmit`.
   */
  readonly registerForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  /** Accès typé aux contrôles dans le template — pas de cast `as any`. */
  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { email, username, password } = this.registerForm.getRawValue();

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .register({ email, username, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // persistSession() est appelée dans auth.register() via tap()
          this.isLoading.set(false);
          void this.router.navigate(['/jeux']);
        },
        error: (err: ApiError) => {
          this.isLoading.set(false);
          if (err.code === ApiErrorCode.EMAIL_TAKEN) {
            this.errorMessage.set('Cet email est déjà associé à un compte.');
          } else {
            this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
          }
        },
      });
  }
}
