import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { HistoriqueService } from '../../../shared/services/historique.service';
import { PartieHistoriqueItem } from '../../../shared/models/historique.model';
import { ParisDatePipe } from '../../../shared/pipes/paris-date.pipe';

type Tab = 'en-cours' | 'realises';

/**
 * Page « Mon historique » — liste des parties avec onglets En cours / Réalisés.
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
  readonly activeTab = signal<Tab>('en-cours');

  /** Tirages non encore effectués (PENDING ou DRAWING). */
  readonly partiesEnCours = computed(() =>
    this.parties().filter(p => p.status === 'PENDING' || p.status === 'DRAWING'),
  );

  /** Tirages effectués (DONE) ou expirés (EXPIRED). */
  readonly partiesRealisees = computed(() =>
    this.parties().filter(p => p.status === 'DONE' || p.status === 'EXPIRED'),
  );

  /** Liste affichée selon l'onglet actif. */
  readonly partiesAffichees = computed(() =>
    this.activeTab() === 'en-cours' ? this.partiesEnCours() : this.partiesRealisees(),
  );

  ngOnInit(): void {
    void this.loadHistory();
  }

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

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  navigateToDetail(partieId: number): void {
    this.router.navigate(['/historique', partieId]);
  }

  /** Indice de couleur (0-5) dérivé du jeu pour la pastille. */
  colorIndex(jeuId: number): number {
    return ((jeuId - 1) % 6 + 6) % 6;
  }
}
