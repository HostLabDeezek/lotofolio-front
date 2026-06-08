export interface GrilleDraft {
  numeros: number[];
  numeroChance: number[];
}

export interface Tirage {
  id: number;
  jeuId: number;
  dateTirage: string;
  numerosTires: number[];
  numeroChanceTire: number[];
  status?: string; // PENDING | DRAWING | DONE | EXPIRED (renvoyé par le back)
  createdAt?: string;
}
