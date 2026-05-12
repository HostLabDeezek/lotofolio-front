<<<<<<< Updated upstream
import { Component, inject } from '@angular/core';
=======
import { Component, HostListener, inject, signal } from '@angular/core';
>>>>>>> Stashed changes
import { Auth } from '../services/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
<<<<<<< Updated upstream

  readonly authService = inject(Auth);
  readonly router = inject(Router);

  logout() {
=======
  protected readonly authService = inject(Auth);
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-header') && this.menuOpen()) {
      this.closeMenu();
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
>>>>>>> Stashed changes
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
