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
import { ParisDatePipe } from '../../../shared/pipes/paris-date.pipe';

/**
 * Page « Mon historique » — liste des parties jouées sur les 30 derniers jours
 * (LF-41). Charge la liste via HistoriqueService et navigue vers
 * HistoriqueDetail au clic.
 */
@Component({
  selector: 'app-historique-list',
  imports: [ParisDatePipe],
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

  ngOnInit(): void {
    void this.loadHistory();
  }

  /**
   * Charge l'historique des parties. Exposée publiquement pour permettre
   * au bouton « Réessayer » de relancer le chargement après une erreur.
   */
  async loadHistory(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
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
   * Indice de couleur (0-5) dérivé du jeu pour la pastille.
   * Modulo euclidien : garantit un résultat positif même si jeuId <= 0.
   */
  colorIndex(jeuId: number): number {
    return ((jeuId - 1) % 6 + 6) % 6;
  }
}
