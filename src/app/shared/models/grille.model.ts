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
