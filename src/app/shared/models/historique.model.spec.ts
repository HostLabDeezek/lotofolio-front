import { PartieDetail, rankGrilles } from './historique.model';

/** Usine de PartieDetail minimal pour les tests de rankGrilles. */
function makeDetail(
  grilles: Array<{ numeros: number[]; numeroChance: number[] }>,
  numerosTires = [7, 14, 23, 31, 42],
  numeroChanceTire = [3],
): PartieDetail {
  return {
    partieId: 1,
    tirage: {
      id: 1,
      dateTirage: '2026-05-31T18:30:00.000Z',
      numerosTires,
      numeroChanceTire,
      jeu: { id: 1, nom: 'Loto' },
    },
    grilles,
  };
}

describe('rankGrilles', () => {
  it('trie par matchNumeros décroissant', () => {
    const detail = makeDetail([
      { numeros: [1, 2, 3, 4, 5], numeroChance: [1] },      // 0 match
      { numeros: [7, 14, 23, 4, 5], numeroChance: [1] },    // 3 match
      { numeros: [7, 14, 1, 2, 3], numeroChance: [1] },     // 2 match
    ]);

    const result = rankGrilles(detail);

    expect(result[0].matchNumeros).toBe(3);
    expect(result[1].matchNumeros).toBe(2);
    expect(result[2].matchNumeros).toBe(0);
  });

  it('utilise matchChance comme tiebreaker à matchNumeros égal', () => {
    const detail = makeDetail([
      { numeros: [7, 14, 1, 2, 3], numeroChance: [1] }, // 2 num, 0 chance
      { numeros: [7, 14, 2, 3, 4], numeroChance: [3] }, // 2 num, 1 chance
    ]);

    const result = rankGrilles(detail);

    expect(result[0].matchChance).toBe(1);
    expect(result[1].matchChance).toBe(0);
  });

  it('inclut les grilles avec 0 match (classées en dernier)', () => {
    const detail = makeDetail([
      { numeros: [1, 2, 3, 4, 5], numeroChance: [1] },
      { numeros: [7, 14, 23, 31, 42], numeroChance: [3] },
    ]);

    const result = rankGrilles(detail);

    expect(result).toHaveSize(2);
    expect(result[1].matchNumeros).toBe(0);
  });

  it('retourne au maximum topN grilles', () => {
    const detail = makeDetail([
      { numeros: [1, 2, 3, 4, 5], numeroChance: [1] },
      { numeros: [7, 14, 1, 2, 3], numeroChance: [1] },
      { numeros: [7, 14, 23, 1, 2], numeroChance: [1] },
      { numeros: [7, 14, 23, 31, 1], numeroChance: [1] },
      { numeros: [7, 14, 23, 31, 42], numeroChance: [3] },
    ]);

    const result = rankGrilles(detail, 3);

    expect(result).toHaveSize(3);
  });

  it('assigne rank 1 à la meilleure grille', () => {
    const detail = makeDetail([
      { numeros: [1, 2, 3, 4, 5], numeroChance: [1] },
      { numeros: [7, 14, 23, 31, 42], numeroChance: [3] },
    ]);

    const result = rankGrilles(detail);

    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it('ne modifie pas le tableau de grilles original (fonction pure)', () => {
    const grilles = [
      { numeros: [7, 14, 23, 31, 42], numeroChance: [3] },
      { numeros: [1, 2, 3, 4, 5], numeroChance: [1] },
    ];
    const detail = makeDetail([...grilles]);

    rankGrilles(detail);

    expect(detail.grilles[0].numeros).toEqual([7, 14, 23, 31, 42]);
    expect(detail.grilles[1].numeros).toEqual([1, 2, 3, 4, 5]);
  });

  it('retourne [] si le détail ne contient aucune grille', () => {
    const detail = makeDetail([]);
    expect(rankGrilles(detail)).toEqual([]);
  });
});
