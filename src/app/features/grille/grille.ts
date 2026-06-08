import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Jeu } from '../../shared/models/jeu.model';
import {
  GrilleLocalState,
  isGrilleComplete,
  MAX_GRILLES,
  Tirage,
} from '../../shared/models/grille.model';
import { JeuStore } from '../../shared/stores/jeu.store';
import { JeuService } from '../../shared/services/jeu.service';
import { TirageService } from '../../shared/services/tirage.service';
import { GrilleCard } from './grille-card/grille-card';

@Component({
  selector: 'app-grille',
  imports: [GrilleCard],
  templateUrl: './grille.html',
  styleUrl: './grille.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Grille implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jeuStore = inject(JeuStore);
  private readonly jeuService = inject(JeuService);
  private readonly tirageService = inject(TirageService);

  readonly jeu = signal<Jeu | null>(null);
  readonly tirage = signal<Tirage | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  /** Liste des grilles composées simultanément ; une grille vide au départ. */
  readonly grilles = signal<GrilleLocalState[]>([this.emptyGrille()]);

  /** Identifiant du tirage en cours, conservé pour la soumission (LF-31). */
  readonly tirageId = computed<number | null>(() => this.tirage()?.id ?? null);

  /** Les grilles sont désactivées tant qu'aucun tirage n'est en cours. */
  readonly disabled = computed<boolean>(() => this.tirage() === null);

  /** On peut ajouter une grille tant qu'on est sous le plafond front (5). */
  readonly canAddGrille = computed<boolean>(() => this.grilles().length < MAX_GRILLES);

  /** On ne peut pas supprimer la dernière grille restante. */
  readonly canRemoveGrille = computed<boolean>(() => this.grilles().length > 1);

  /** Libellé du tirage en cours, ex. « Tirage du 11 mai 2026 à 20h00 » (heure de Paris). */
  readonly tirageLabel = computed<string | null>(() => {
    const tirage = this.tirage();
    if (!tirage) {
      return null;
    }
    const date = new Date(tirage.dateTirage);
    const jour = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    const heure = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(':', 'h');
    return `Tirage du ${jour} à ${heure}`;
  });

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('Jeu introuvable');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const [jeu, tirage] = await Promise.all([
        this.loadJeu(id),
        this.tirageService.getCurrentTirage(id),
      ]);
      this.jeu.set(jeu);
      this.tirage.set(tirage);
    } catch {
      this.error.set('Impossible de charger le jeu');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadJeu(id: number): Promise<Jeu> {
    const fromStore = this.jeuStore.jeux().find((j) => j.id === id);
    const jeu = fromStore ?? (await this.jeuService.getJeu(id));
    this.jeuStore.selectJeu(jeu);
    return jeu;
  }

  /** Ajoute une grille vide ; sans effet si le plafond front est atteint. */
  addGrille(): void {
    if (!this.canAddGrille()) {
      return;
    }
    this.grilles.update((list) => [...list, this.emptyGrille()]);
  }

  /** Supprime une grille ; sans effet s'il ne reste qu'une seule grille. */
  removeGrille(id: string): void {
    if (!this.canRemoveGrille()) {
      return;
    }
    this.grilles.update((list) => list.filter((g) => g.id !== id));
  }

  toggleNumero(grilleId: string, n: number): void {
    if (this.disabled()) {
      return;
    }
    const max = this.jeu()?.nbNumerosATirer ?? 0;
    this.grilles.update((list) =>
      list.map((g) =>
        g.id === grilleId
          ? { ...g, selectedNumeros: this.toggleWithCap(g.selectedNumeros, n, max) }
          : g,
      ),
    );
  }

  toggleNumeroChance(grilleId: string, n: number): void {
    if (this.disabled()) {
      return;
    }
    const max = this.jeu()?.nbNumeroChanceATirer ?? 0;
    this.grilles.update((list) =>
      list.map((g) =>
        g.id === grilleId
          ? { ...g, selectedNumeroChance: this.toggleWithCap(g.selectedNumeroChance, n, max) }
          : g,
      ),
    );
  }

  /** Validité d'une grille (domaine) ; réutilisée pour la soumission (LF-31). */
  isComplete(grille: GrilleLocalState): boolean {
    const jeu = this.jeu();
    return jeu ? isGrilleComplete(grille, jeu) : false;
  }

  /** Ajoute/retire `n` de la liste en respectant le plafond `max`. */
  private toggleWithCap(current: number[], n: number, max: number): number[] {
    if (current.includes(n)) {
      return current.filter((x) => x !== n);
    }
    if (current.length >= max) {
      return current;
    }
    return [...current, n];
  }

  private emptyGrille(): GrilleLocalState {
    return { id: crypto.randomUUID(), selectedNumeros: [], selectedNumeroChance: [] };
  }
}
