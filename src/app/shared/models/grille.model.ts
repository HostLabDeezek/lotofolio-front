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

/** Nombre maximum de grilles composables simultanément pour un USER. */
export const MAX_GRILLES = 5;

/**
 * Marge de cutoff, en minutes, avant l'heure du tirage : au-delà, la saisie est
 * fermée (le back renvoie `409 CUTOFF_PASSED`). Doit refléter `CUTOFF_MARGIN_MINUTES`
 * du back (défaut = 6 min ⇒ 19h54 pour un tirage à 20h00 Paris). Cf. MEMO LF-31 §6.
 */
export const CUTOFF_MARGIN_MIN = 6;

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

/** Une grille telle qu'envoyée au back (numéros bruts, sans état de rendu). */
export interface GrillePayload {
  numeros: number[];
  numeroChance: number[];
}

/**
 * Corps de `POST /api/parties` (LF-31 / LF-34). Le back répond `201` sans
 * body : il n'y a donc pas de type de réponse à parser.
 */
export interface PlayPayload {
  tirageId: number;
  grilles: GrillePayload[];
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
