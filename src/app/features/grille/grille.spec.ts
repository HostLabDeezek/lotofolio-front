import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Grille } from './grille';
import { Jeu } from '../../shared/models/jeu.model';
import { Tirage } from '../../shared/models/grille.model';
import { environment } from '../../../environments/environment';

const JEU: Jeu = {
  id: 1,
  nom: 'Loto',
  description: 'desc',
  regle: 'regle',
  intervalNumero: 49,
  intervalNumeroChance: 10,
  nbNumeroChanceATirer: 1,
  nbNumerosATirer: 5,
};

const TIRAGE: Tirage = {
  id: 42,
  jeuId: 1,
  dateTirage: '2026-05-11T18:00:00.000Z',
  numerosTires: [],
  numeroChanceTire: [],
  status: 'PENDING',
};

function setup(routeId = '1') {
  TestBed.configureTestingModule({
    imports: [Grille],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: routeId }) } },
      },
    ],
  });
  const fixture = TestBed.createComponent(Grille);
  return { fixture, component: fixture.componentInstance };
}

/** Id de la grille à l'index donné, pour piloter les méthodes par grille. */
function grilleId(component: Grille, index = 0): string {
  return component.grilles()[index].id;
}

describe('Grille', () => {
  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  describe('état initial', () => {
    it('démarre avec une seule grille vide', () => {
      const { component } = setup();
      expect(component.grilles().length).toBe(1);
      expect(component.grilles()[0].selectedNumeros).toEqual([]);
      expect(component.grilles()[0].selectedNumeroChance).toEqual([]);
    });
  });

  describe('ajout de grilles', () => {
    it('addGrille ajoute une grille vide supplémentaire', () => {
      const { component } = setup();
      component.addGrille();
      expect(component.grilles().length).toBe(2);
      expect(component.grilles()[1].selectedNumeros).toEqual([]);
    });

    it('chaque grille ajoutée a un id unique', () => {
      const { component } = setup();
      component.addGrille();
      component.addGrille();
      const ids = component.grilles().map((g) => g.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("plafonne à 5 grilles : addGrille au-delà est sans effet et canAddGrille devient faux", () => {
      const { component } = setup();
      for (let i = 0; i < 10; i++) {
        component.addGrille();
      }
      expect(component.grilles().length).toBe(5);
      expect(component.canAddGrille()).toBe(false);
    });

    it('canAddGrille reste vrai tant qu’il y a moins de 5 grilles', () => {
      const { component } = setup();
      expect(component.canAddGrille()).toBe(true);
      component.addGrille();
      expect(component.canAddGrille()).toBe(true);
    });
  });

  describe('suppression de grilles', () => {
    it('removeGrille retire la grille ciblée', () => {
      const { component } = setup();
      component.addGrille();
      const idToRemove = grilleId(component, 0);
      component.removeGrille(idToRemove);
      expect(component.grilles().length).toBe(1);
      expect(component.grilles()[0].id).not.toBe(idToRemove);
    });

    it('ne supprime pas la dernière grille restante', () => {
      const { component } = setup();
      const id = grilleId(component, 0);
      component.removeGrille(id);
      expect(component.grilles().length).toBe(1);
    });
  });

  describe('sélection des numéros par grille', () => {
    it('toggleNumero ajoute puis retire un numéro sur la grille ciblée', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);
      const id = grilleId(component, 0);

      component.toggleNumero(id, 7);
      expect(component.grilles()[0].selectedNumeros).toEqual([7]);

      component.toggleNumero(id, 7);
      expect(component.grilles()[0].selectedNumeros).toEqual([]);
    });

    it('respecte le max de numéros à tirer', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumerosATirer: 2 });
      component.tirage.set(TIRAGE);
      const id = grilleId(component, 0);

      component.toggleNumero(id, 1);
      component.toggleNumero(id, 2);
      component.toggleNumero(id, 3); // refusé : max atteint

      expect(component.grilles()[0].selectedNumeros).toEqual([1, 2]);
    });

    it('respecte le max de numéros chance', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumeroChanceATirer: 1 });
      component.tirage.set(TIRAGE);
      const id = grilleId(component, 0);

      component.toggleNumeroChance(id, 5);
      component.toggleNumeroChance(id, 6); // refusé : max atteint

      expect(component.grilles()[0].selectedNumeroChance).toEqual([5]);
    });

    it('les sélections de deux grilles sont indépendantes', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);
      component.addGrille();
      const id0 = grilleId(component, 0);
      const id1 = grilleId(component, 1);

      component.toggleNumero(id0, 1);
      component.toggleNumero(id1, 2);

      expect(component.grilles()[0].selectedNumeros).toEqual([1]);
      expect(component.grilles()[1].selectedNumeros).toEqual([2]);
    });

    it('ne sélectionne rien quand aucun tirage n’est en cours', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(null);
      const id = grilleId(component, 0);

      component.toggleNumero(id, 1);
      expect(component.grilles()[0].selectedNumeros).toEqual([]);
    });
  });

  describe('validité par grille', () => {
    it('isComplete vrai quand numéros et chance atteignent le compte requis', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumerosATirer: 2, nbNumeroChanceATirer: 1 });
      component.tirage.set(TIRAGE);
      const id = grilleId(component, 0);

      component.toggleNumero(id, 1);
      component.toggleNumero(id, 2);
      expect(component.isComplete(component.grilles()[0])).toBe(false);

      component.toggleNumeroChance(id, 3);
      expect(component.isComplete(component.grilles()[0])).toBe(true);
    });

    it('la validité d’une grille n’affecte pas celle d’une autre', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumerosATirer: 1, nbNumeroChanceATirer: 1 });
      component.tirage.set(TIRAGE);
      component.addGrille();
      const id0 = grilleId(component, 0);

      component.toggleNumero(id0, 1);
      component.toggleNumeroChance(id0, 2);

      expect(component.isComplete(component.grilles()[0])).toBe(true);
      expect(component.isComplete(component.grilles()[1])).toBe(false);
    });
  });

  describe('chargement (ngOnInit)', () => {
    it('charge le jeu et le tirage et conserve tirage.id', async () => {
      const { fixture, component } = setup('1');
      fixture.detectChanges(); // déclenche ngOnInit

      const httpMock = TestBed.inject(HttpTestingController);
      httpMock.expectOne(`${environment.apiUrl}/jeux/1`).flush(JEU);
      httpMock.expectOne(`${environment.apiUrl}/jeux/1/current-tirage`).flush(TIRAGE);

      await fixture.whenStable();

      expect(component.jeu()?.nom).toBe('Loto');
      expect(component.tirage()?.id).toBe(42);
      expect(component.tirageId()).toBe(42);
      httpMock.verify();
    });
  });
});
