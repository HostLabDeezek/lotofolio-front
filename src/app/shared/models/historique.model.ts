/**
 * Résumé d'une partie renvoyé par GET /api/parties/history (LF-38).
 * Utilisé pour alimenter l'écran « Mon historique » (liste).
 */
export interface PartieHistoriqueItem {
  partieId: number;
  tirageId: number;
  tirageDate: string; // ISO 8601
  jeu: {
    id: number;
    nom: string;
  };
}

/**
 * Détail complet d'une partie renvoyé par GET /api/parties/:id (LF-39).
 * Contient le tirage (avec ses numéros gagnants) et toutes les grilles jouées.
 */
export interface PartieDetail {
  partieId: number;
  tirage: {
    id: number;
    dateTirage: string; // ISO 8601
    numerosTires: number[];
    numeroChanceTire: number[];
    jeu: {
      id: number;
      nom: string;
    };
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
 * @param topN    Nombre max de grilles à retourner (défaut : 5)
 */
export function rankGrilles(detail: PartieDetail, topN = 5): GrilleRanked[] {
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

  return scored.slice(0, topN).map((g, i) => ({ ...g, rank: i + 1 }));
}
