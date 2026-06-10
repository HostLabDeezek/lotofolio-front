import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoriqueService } from '../../../shared/services/historique.service';
import { PartieDetail, rankGrilles } from '../../../shared/models/historique.model';
import { ApiError } from '../../../core/errors/api-error';
import { ParisDatePipe } from '../../../shared/pipes/paris-date.pipe';

/** Grille classée enrichie avec les Sets de numéros matchés, pour le template. */
interface GrilleDisplay {
  rank: number;
  numeros: number[];
  numeroChance: number[];
  matchNumeros: number;
  matchChance: number;
  /** Numéros principaux présents dans `tirage.numerosTires`. */
  matchedNumeros: Set<number>;
  /** Numéros chance présents dans `tirage.numeroChanceTire`. */
  matchedChance: Set<number>;
}

/**
 * Page de détail d'une partie — affiche le tirage gagnant et le classement
 * des grilles par nombre de numéros correspondants (LF-42).
 */
@Component({
  selector: 'app-historique-detail',
  imports: [ParisDatePipe],
  templateUrl: './historique-detail.html',
  styleUrl: './historique-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoriqueDetail implements OnInit {
  private readonly historiqueService = inject(HistoriqueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly detail = signal<PartieDetail | null>(null);
  readonly topN = signal<number>(5);

  /** Nombre total de grilles — borne supérieure du contrôle topN. */
  readonly maxTopN = computed(() => this.detail()?.grilles.length ?? 5);

  /**
   * Grilles classées et enrichies avec les Sets de matching.
   * Recalculé uniquement quand `detail` ou `topN` change.
   */
  readonly rankedGrilles = computed<GrilleDisplay[]>(() => {
    const d = this.detail();
    if (!d) return [];

    const numSet = new Set(d.tirage.numerosTires);
    const chanceSet = new Set(d.tirage.numeroChanceTire);

    return rankGrilles(d, this.topN()).map(g => ({
      ...g,
      matchedNumeros: new Set(g.numeros.filter(n => numSet.has(n))),
      matchedChance: new Set(g.numeroChance.filter(n => chanceSet.has(n))),
    }));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('Partie introuvable');
      this.loading.set(false);
      return;
    }
    void this.loadDetail(id);
  }

  private async loadDetail(partieId: number): Promise<void> {
    try {
      const result = await this.historiqueService.getPartieDetail(partieId);
      this.detail.set(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        this.error.set('Partie introuvable');
      } else {
        this.error.set('Impossible de charger cette partie');
      }
    } finally {
      this.loading.set(false);
    }
  }

  incrementTopN(): void {
    this.topN.update(n => Math.min(n + 1, this.maxTopN()));
  }

  decrementTopN(): void {
    this.topN.update(n => Math.max(n - 1, 1));
  }

  goBack(): void {
    this.router.navigate(['/historique']);
  }

  /** Classe CSS du badge de score selon le niveau de correspondance. */
  scoreBadgeClass(matchNumeros: number, total: number): string {
    if (matchNumeros === total) return 'badge badge--success';
    if (matchNumeros > 0) return 'badge badge--warning';
    return 'badge badge--neutral';
  }
}
