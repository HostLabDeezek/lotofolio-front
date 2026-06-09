/**
 * Référence à un jeu de loterie — partagée par `PartieHistoriqueItem` et
 * `PartieDetail` pour éviter la duplication (DRY).
 */
export interface Jeu {
  id: number;
  nom: string;
}

/**
 * Résumé d'une partie renvoyé par GET /api/parties/history (LF-38).
 * Utilisé pour alimenter l'écran « Mon historique » (liste).
 *
 * Note : le champ `tirageDate` correspond au nom renvoyé par l'endpoint
 * /history. L'endpoint de détail (/parties/:id) renvoie `dateTirage` pour
 * rester cohérent avec le modèle `Tirage` existant — c'est intentionnel.
 */
export interface PartieHistoriqueItem {
  partieId: number;
  tirageId: number;
  /** ISO 8601 — nom imposé par l'endpoint GET /api/parties/history (LF-38). */
  tirageDate: string;
  jeu: Jeu;
}

/**
 * Détail complet d'une partie renvoyé par GET /api/parties/:id (LF-39).
 * Contient le tirage (avec ses numéros gagnants) et toutes les grilles jouées.
 */
export interface PartieDetail {
  partieId: number;
  tirage: {
    id: number;
    /** ISO 8601 — nommé `dateTirage` comme dans le modèle `Tirage` existant. */
    dateTirage: string;
    numerosTires: number[];
    numeroChanceTire: number[];
    jeu: Jeu;
  };
  grilles: Array<{
    numeros: number[];
    numeroChance: number[];
  }>;
}

/**
 * Grille enrichie avec son score de correspondance par rapport au tirage.
 * Produite par rankGrilles() — jamais envoyée au back.
 */
export interface GrilleRanked {
  numeros: number[];
  numeroChance: number[];
  /** Nombre de numéros principaux matchés avec le tirage. */
  matchNumeros: number;
  /** Nombre de numéros chance matchés avec le tirage. */
  matchChance: number;
  /** Position dans le classement (1 = meilleure grille). */
  rank: number;
}

/**
 * Trie les grilles d'une partie par score décroissant et retourne les `topN`
 * meilleures.
 *
 * Critère principal : `matchNumeros` DESC.
 * Tiebreaker : `matchChance` DESC.
 *
 * Fonction pure : ne modifie ni `detail` ni ses sous-objets.
 *
 * @param detail  Détail complet de la partie (LF-39)
 * @param topN    Entier max de grilles à retourner (défaut : 5). Les flottants
 *                sont tronqués par `Array.slice` — passer un entier explicite.
 *                Si `topN <= 0`, toutes les grilles sont retournées.
 */
export function rankGrilles(detail: PartieDetail, topN = 5): GrilleRanked[] {
  const effectiveTopN = topN <= 0 ? detail.grilles.length : topN;
  const { numerosTires, numeroChanceTire } = detail.tirage;

  const scored = detail.grilles.map(g => ({
    ...g,
    matchNumeros: g.numeros.filter(n => numerosTires.includes(n)).length,
    matchChance: g.numeroChance.filter(n => numeroChanceTire.includes(n)).length,
    rank: 0,
  }));

  scored.sort((a, b) =>
    b.matchNumeros !== a.matchNumeros
      ? b.matchNumeros - a.matchNumeros
      : b.matchChance - a.matchChance,
  );

  return scored.slice(0, effectiveTopN).map((g, i) => ({ ...g, rank: i + 1 }));
}
