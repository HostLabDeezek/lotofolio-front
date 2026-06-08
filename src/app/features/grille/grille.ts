import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Jeu } from '../../shared/models/jeu.model';
import { Tirage } from '../../shared/models/grille.model';
import { JeuStore } from '../../shared/stores/jeu.store';
import { JeuService } from '../../shared/services/jeu.service';
import { TirageService } from '../../shared/services/tirage.service';

@Component({
  selector: 'app-grille',
  imports: [],
  templateUrl: './grille.html',
  styleUrl: './grille.scss',
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

  readonly selectedNumeros = signal<number[]>([]);
  readonly selectedNumeroChance = signal<number[]>([]);

  /** Identifiant du tirage en cours, conservé pour la soumission (LF-31). */
  readonly tirageId = computed<number | null>(() => this.tirage()?.id ?? null);

  /** La grille est désactivée tant qu'aucun tirage n'est en cours. */
  readonly disabled = computed<boolean>(() => this.tirage() === null);

  /** Numéros de la grille principale : 1..intervalNumero. */
  readonly numeros = computed<number[]>(() => this.range(this.jeu()?.intervalNumero ?? 0));

  /** Numéros chance : 1..intervalNumeroChance. */
  readonly numerosChance = computed<number[]>(() =>
    this.range(this.jeu()?.intervalNumeroChance ?? 0),
  );

  readonly isComplete = computed<boolean>(() => {
    const jeu = this.jeu();
    if (!jeu) {
      return false;
    }
    return (
      this.selectedNumeros().length === jeu.nbNumerosATirer &&
      this.selectedNumeroChance().length === jeu.nbNumeroChanceATirer
    );
  });

  readonly errorMessage = computed<string | null>(() => {
    const jeu = this.jeu();
    if (!jeu || this.isComplete()) {
      return null;
    }
    const parts = [`${jeu.nbNumerosATirer} numéro${jeu.nbNumerosATirer > 1 ? 's' : ''}`];
    if (jeu.nbNumeroChanceATirer > 0) {
      parts.push(
        `${jeu.nbNumeroChanceATirer} numéro${jeu.nbNumeroChanceATirer > 1 ? 's' : ''} chance`,
      );
    }
    return `Sélectionnez ${parts.join(' et ')} pour valider la grille`;
  });

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

  toggleNumero(n: number): void {
    if (this.isNumeroDisabled(n) && !this.selectedNumeros().includes(n)) {
      return;
    }
    this.toggle(this.selectedNumeros, n);
  }

  toggleNumeroChance(n: number): void {
    if (this.isNumeroChanceDisabled(n) && !this.selectedNumeroChance().includes(n)) {
      return;
    }
    this.toggle(this.selectedNumeroChance, n);
  }

  isNumeroSelected(n: number): boolean {
    return this.selectedNumeros().includes(n);
  }

  isNumeroChanceSelected(n: number): boolean {
    return this.selectedNumeroChance().includes(n);
  }

  isNumeroDisabled(n: number): boolean {
    if (this.disabled()) {
      return true;
    }
    if (this.isNumeroSelected(n)) {
      return false;
    }
    return this.selectedNumeros().length >= (this.jeu()?.nbNumerosATirer ?? 0);
  }

  isNumeroChanceDisabled(n: number): boolean {
    if (this.disabled()) {
      return true;
    }
    if (this.isNumeroChanceSelected(n)) {
      return false;
    }
    return this.selectedNumeroChance().length >= (this.jeu()?.nbNumeroChanceATirer ?? 0);
  }

  private toggle(target: ReturnType<typeof signal<number[]>>, n: number): void {
    target.update((current) =>
      current.includes(n) ? current.filter((x) => x !== n) : [...current, n],
    );
  }

  private range(max: number): number[] {
    return Array.from({ length: Math.max(0, max) }, (_, i) => i + 1);
  }
}
