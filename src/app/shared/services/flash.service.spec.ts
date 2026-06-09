import { TestBed } from '@angular/core/testing';
import { FlashService } from './flash.service';
import { Jeu } from '../models/jeu.model';
import { GrilleDraft } from '../models/grille.model';

const JEU: Jeu = {
  id: 1,
  nom: 'Loto',
  description: null,
  regle: null,
  intervalNumero: 49,
  intervalNumeroChance: 10,
  nbNumeroChanceATirer: 1,
  nbNumerosATirer: 5,
};

/** Clé canonique d'une grille (numéros triés) pour comparer l'identité. */
function key(draft: GrilleDraft): string {
  const n = [...draft.numeros].sort((a, b) => a - b).join(',');
  const c = [...draft.numeroChance].sort((a, b) => a - b).join(',');
  return `${n}|${c}`;
}

describe('FlashService', () => {
  let service: FlashService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlashService);
  });

  describe('flashGrille', () => {
    it('tire le bon nombre de numéros et de numéros chance', () => {
      const draft = service.flashGrille(JEU);
      expect(draft.numeros.length).toBe(JEU.nbNumerosATirer);
      expect(draft.numeroChance.length).toBe(JEU.nbNumeroChanceATirer);
    });

    it('tire des numéros dans la plage [1, intervalNumero]', () => {
      for (let i = 0; i < 50; i++) {
        const draft = service.flashGrille(JEU);
        for (const n of draft.numeros) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(JEU.intervalNumero);
        }
        for (const c of draft.numeroChance) {
          expect(c).toBeGreaterThanOrEqual(1);
          expect(c).toBeLessThanOrEqual(JEU.intervalNumeroChance);
        }
      }
    });

    it('ne produit pas de doublons internes', () => {
      for (let i = 0; i < 50; i++) {
        const draft = service.flashGrille(JEU);
        expect(new Set(draft.numeros).size).toBe(draft.numeros.length);
        expect(new Set(draft.numeroChance).size).toBe(draft.numeroChance.length);
      }
    });

    it('gère un jeu sans numéro chance', () => {
      const draft = service.flashGrille({ ...JEU, nbNumeroChanceATirer: 0 });
      expect(draft.numeroChance).toEqual([]);
      expect(draft.numeros.length).toBe(JEU.nbNumerosATirer);
    });
  });

  describe('flashGrilles', () => {
    it('renvoie exactement le nombre de grilles demandé', () => {
      expect(service.flashGrilles(JEU, 1).length).toBe(1);
      expect(service.flashGrilles(JEU, 5).length).toBe(5);
    });

    it('ne génère jamais deux grilles strictement identiques dans le lot', () => {
      // Petit intervalle où les collisions sont fréquentes :
      // C(6,2) = 15 combinaisons de numéros, C(3,1) = 3 de chance -> 45 grilles distinctes.
      const petitJeu: Jeu = {
        ...JEU,
        intervalNumero: 6,
        nbNumerosATirer: 2,
        intervalNumeroChance: 3,
        nbNumeroChanceATirer: 1,
      };
      for (let run = 0; run < 50; run++) {
        const lot = service.flashGrilles(petitJeu, 5);
        const keys = lot.map(key);
        expect(new Set(keys).size).toBe(keys.length);
      }
    });

    it('chaque grille du lot respecte les contraintes du jeu', () => {
      const lot = service.flashGrilles(JEU, 5);
      for (const draft of lot) {
        expect(draft.numeros.length).toBe(JEU.nbNumerosATirer);
        expect(draft.numeroChance.length).toBe(JEU.nbNumeroChanceATirer);
        expect(new Set(draft.numeros).size).toBe(draft.numeros.length);
      }
    });
  });
});
