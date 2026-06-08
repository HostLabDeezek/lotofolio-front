import { Jeu } from './jeu.model';

export interface GrilleDraft {
  numeros: number[];
  numeroChance: number[];
}

/**
 * État local d'une grille en cours de composition (LF-29).
 * `id` est un uuid local de rendu, sans rapport avec l'id en base.
 */
export interface GrilleLocalState {
  id: string;
  selectedNumeros: number[];
  selectedNumeroChance: number[];
}

/** Nombre maximum de grilles composables simultanément (contrainte front). */
export const MAX_GRILLES = 5;

/**
 * Règle de complétude d'une grille : les quotas de numéros et de chance du jeu
 * sont atteints. Fonction pure partagée par la page et la carte de grille.
 */
export function isGrilleComplete(grille: GrilleLocalState, jeu: Jeu): boolean {
  return (
    grille.selectedNumeros.length === jeu.nbNumerosATirer &&
    grille.selectedNumeroChance.length === jeu.nbNumeroChanceATirer
  );
}

/** Statuts de tirage renvoyés par le back. */
export type TirageStatus = 'PENDING' | 'DRAWING' | 'DONE' | 'EXPIRED';

export interface Tirage {
  id: number;
  jeuId: number;
  dateTirage: string;
  numerosTires: number[];
  numeroChanceTire: number[];
  status?: TirageStatus;
  createdAt?: string;
}
