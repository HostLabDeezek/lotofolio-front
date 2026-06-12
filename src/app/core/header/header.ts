import { Component, computed, HostListener, inject, signal } from '@angular/core';
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
  protected readonly authService = inject(Auth);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly dropdownOpen = signal(false);

  readonly userInitials = computed(() => {
    const username = this.authService.user()?.username ?? '';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-header') && this.menuOpen()) {
      this.closeMenu();
    }
    // Le bouton avatar utilise stopPropagation, donc ce handler
    // ne se déclenche que pour les clics en dehors du dropdown.
    if (this.dropdownOpen()) {
      this.dropdownOpen.set(false);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.closeMenu();
    this.authService.logout();
  }
}
