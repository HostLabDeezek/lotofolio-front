import { Component, computed, input, output } from '@angular/core';
import { Jeu } from '../../../shared/models/jeu.model';
import { GrilleLocalState } from '../../../shared/models/grille.model';

/**
 * Rendu d'une grille unique (LF-29). Composant purement présentationnel :
 * il n'a aucun état propre, il est entièrement piloté par le parent `Grille`.
 */
@Component({
  selector: 'app-grille-card',
  imports: [],
  templateUrl: './grille-card.html',
  styleUrl: './grille-card.scss',
})
export class GrilleCard {
  readonly jeu = input.required<Jeu>();
  readonly grille = input.required<GrilleLocalState>();
  /** Numéro affiché de la grille (1-based : « Grille 1 », « Grille 2 », …). */
  readonly position = input.required<number>();
  readonly disabled = input<boolean>(false);
  /** Le bouton de suppression est masqué/désactivé quand false. */
  readonly canDelete = input<boolean>(true);
  /** Message d'aide à la complétion, fourni par le parent (null si complète). */
  readonly errorMessage = input<string | null>(null);

  readonly numeroToggled = output<number>();
  readonly numeroChanceToggled = output<number>();
  readonly deleted = output<void>();

  /** Numéros de la grille principale : 1..intervalNumero. */
  readonly numeros = computed<number[]>(() => this.range(this.jeu().intervalNumero));

  /** Numéros chance : 1..intervalNumeroChance. */
  readonly numerosChance = computed<number[]>(() => this.range(this.jeu().intervalNumeroChance));

  isNumeroSelected(n: number): boolean {
    return this.grille().selectedNumeros.includes(n);
  }

  isNumeroChanceSelected(n: number): boolean {
    return this.grille().selectedNumeroChance.includes(n);
  }

  isNumeroDisabled(n: number): boolean {
    if (this.disabled()) {
      return true;
    }
    if (this.isNumeroSelected(n)) {
      return false;
    }
    return this.grille().selectedNumeros.length >= this.jeu().nbNumerosATirer;
  }

  isNumeroChanceDisabled(n: number): boolean {
    if (this.disabled()) {
      return true;
    }
    if (this.isNumeroChanceSelected(n)) {
      return false;
    }
    return this.grille().selectedNumeroChance.length >= this.jeu().nbNumeroChanceATirer;
  }

  private range(max: number): number[] {
    return Array.from({ length: Math.max(0, max) }, (_, i) => i + 1);
  }
}
