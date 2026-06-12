import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ApiError } from '../../../core/errors/api-error';

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

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  registerForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  /** Raccourci typé pour accéder aux contrôles dans le template. */
  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { email, username, password } = this.registerForm.value as {
      email: string;
      username: string;
      password: string;
    };

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register({ email, username, password }).subscribe({
      next: () => {
        // La session est persistée par auth.register() via persistSession()
        this.isLoading.set(false);
        void this.router.navigate(['/jeux']);
      },
      error: (err: ApiError) => {
        this.isLoading.set(false);
        if (err.message === 'Cet email est déjà utilisé') {
          this.errorMessage.set('Cet email est déjà associé à un compte.');
        } else {
          this.errorMessage.set(err.message || 'Une erreur est survenue. Veuillez réessayer.');
        }
      },
    });
  }
}
