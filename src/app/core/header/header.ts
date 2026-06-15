import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { Auth } from '../services/auth';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly authService = inject(Auth);

  protected readonly menuOpen = signal(false);
  protected readonly dropdownOpen = signal(false);

  protected readonly userInitials = computed(() => {
    const user = this.authService.user();
    if (!user) return '?';

    // Priorité : firstName + lastName (LF-51)
    const first = user.firstName?.trim();
    const last = user.lastName?.trim();
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first) return first.slice(0, 2).toUpperCase();

    // Fallback : username
    const username = user.username?.trim() ?? '';
    if (!username) return '?';
    const parts = username.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return username.slice(0, 2).toUpperCase();
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('app-header') && this.menuOpen()) {
      this.closeMenu();
    }

    // Ferme le dropdown si le clic est en dehors du .user-dropdown
    // (pas de stopPropagation sur le bouton avatar — les events se propagent normalement)
    if (this.dropdownOpen() && !target.closest('.user-dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
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

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.closeMenu();
    // authService.logout() purge le localStorage et redirige vers /login
    this.authService.logout();
  }
}
