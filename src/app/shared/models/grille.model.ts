export interface GrilleDraft {
  numeros: number[];
  numeroChance: number[];
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
