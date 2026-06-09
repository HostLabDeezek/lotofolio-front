import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { HistoriqueService } from '../../../shared/services/historique.service';
import { PartieHistoriqueItem } from '../../../shared/models/historique.model';

/**
 * Page « Mon historique » — liste des parties jouées sur les 30 derniers jours
 * (LF-41). Charge la liste via HistoriqueService et navigue vers
 * HistoriqueDetail au clic.
 */
@Component({
  selector: 'app-historique-list',
  imports: [],
  templateUrl: './historique-list.html',
  styleUrl: './historique-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoriqueList implements OnInit {
  private readonly historiqueService = inject(HistoriqueService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly parties = signal<PartieHistoriqueItem[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.historiqueService.getHistory();
      this.parties.set(result);
    } catch {
      this.error.set("Impossible de charger l'historique");
    } finally {
      this.loading.set(false);
    }
  }

  navigateToDetail(partieId: number): void {
    this.router.navigate(['/historique', partieId]);
  }

  /**
   * Formate une date ISO 8601 en « Mar. 3 juin — 21h00 » (heure de Paris).
   * Cohérent avec le `tirageLabel` de la page Grille.
   */
  formatDate(tirageDate: string): string {
    const date = new Date(tirageDate);
    const partsOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Paris',
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const datePart = new Intl.DateTimeFormat('fr-FR', partsOptions).format(date);
    const timePart = new Intl.DateTimeFormat('fr-FR', timeOptions)
      .format(date)
      .replace(':', 'h');
    return `${datePart} — ${timePart}`;
  }

  /** Indice de couleur (0-5) dérivé du jeu pour la pastille. */
  colorIndex(jeuId: number): number {
    return (jeuId - 1) % 6;
  }
}
