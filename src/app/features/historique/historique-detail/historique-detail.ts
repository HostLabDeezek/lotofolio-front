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
import { isTirageDone, PartieDetail, rankGrilles } from '../../../shared/models/historique.model';
import { ApiError } from '../../../core/errors/api-error';
import { ParisDatePipe } from '../../../shared/pipes/paris-date.pipe';

const PAGE_SIZE = 10;

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

/** Grille simple (tirage en cours) — numéros triés, sans scoring. */
interface GrilleSimple {
  numeros: number[];
  numeroChance: number[];
}

/**
 * Page de détail d'une partie — affiche le tirage gagnant et le classement
 * des grilles (si tirage réalisé / expiré), ou la liste paginée des grilles
 * (si tirage en cours : PENDING ou DRAWING).
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

  // ── Tirage réalisé / expiré ───────────────────────────────────────────────

  /** Nombre total de grilles — borne supérieure du contrôle topN. */
  readonly maxTopN = computed(() => this.detail()?.grilles.length ?? 5);

  /**
   * Vrai si le tirage est réalisé ou expiré (DONE | EXPIRED).
   * Cohérent avec `partiesRealisees` dans la liste (même logique via isTirageDone).
   */
  readonly isDone = computed(() => {
    const status = this.detail()?.tirage.status;
    return status != null && isTirageDone(status);
  });

  /** Numéros du tirage gagnant triés en ordre croissant. */
  readonly sortedTirageNumeros = computed(() =>
    [...(this.detail()?.tirage.numerosTires ?? [])].sort((a, b) => a - b),
  );

  readonly sortedTirageChance = computed(() =>
    [...(this.detail()?.tirage.numeroChanceTire ?? [])].sort((a, b) => a - b),
  );

  /**
   * Grilles classées et enrichies avec les Sets de matching.
   * Les numéros sont triés en ordre croissant avant de construire les Sets
   * pour que l'intention soit explicite et indépendante de l'ordre d'origine.
   */
  readonly rankedGrilles = computed<GrilleDisplay[]>(() => {
    const d = this.detail();
    if (!d) return [];

    const numSet = new Set(d.tirage.numerosTires);
    const chanceSet = new Set(d.tirage.numeroChanceTire);

    return rankGrilles(d, this.topN()).map(g => {
      const sortedNumeros = [...g.numeros].sort((a, b) => a - b);
      const sortedChance = [...g.numeroChance].sort((a, b) => a - b);
      return {
        ...g,
        numeros: sortedNumeros,
        numeroChance: sortedChance,
        matchedNumeros: new Set(sortedNumeros.filter(n => numSet.has(n))),
        matchedChance: new Set(sortedChance.filter(n => chanceSet.has(n))),
      };
    });
  });

  /**
   * Titre de la section meilleures grilles.
   * "Votre meilleure grille" (1), "Vos N meilleures grilles" (>1), "Aucune grille" (0).
   */
  readonly grillesTitre = computed(() => {
    const count = this.rankedGrilles().length;
    if (count === 0) return 'Aucune grille';
    if (count === 1) return 'Votre meilleure grille';
    return `Vos ${count} meilleures grilles`;
  });

  // ── Tirage en cours ───────────────────────────────────────────────────────

  /** Nombre de grilles visibles dans la vue "en cours" (pagination par 10). */
  readonly visibleCount = signal<number>(PAGE_SIZE);

  /** Toutes les grilles triées (sans scoring) pour la vue en cours. */
  readonly grillesSimples = computed<GrilleSimple[]>(() =>
    (this.detail()?.grilles ?? []).map(g => ({
      numeros: [...g.numeros].sort((a, b) => a - b),
      numeroChance: [...g.numeroChance].sort((a, b) => a - b),
    })),
  );

  readonly grillesVisibles = computed(() =>
    this.grillesSimples().slice(0, this.visibleCount()),
  );

  readonly hasMore = computed(() =>
    this.visibleCount() < this.grillesSimples().length,
  );

  /** Nombre de grilles restantes non encore affichées (pour le label "Voir plus"). */
  readonly remainingCount = computed(() =>
    this.grillesSimples().length - this.visibleCount(),
  );

  // ── Cycle de vie ──────────────────────────────────────────────────────────

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
      this.visibleCount.set(PAGE_SIZE); // Réinitialise la pagination à chaque chargement
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

  // ── Actions ───────────────────────────────────────────────────────────────

  incrementTopN(): void {
    this.topN.update(n => Math.min(n + 1, this.maxTopN()));
  }

  decrementTopN(): void {
    this.topN.update(n => Math.max(n - 1, 1));
  }

  showMore(): void {
    this.visibleCount.update(n => n + PAGE_SIZE);
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
