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

describe('Grille', () => {
  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  describe('sélection des numéros', () => {
    it('toggle ajoute puis retire un numéro', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);

      component.toggleNumero(7);
      expect(component.selectedNumeros()).toEqual([7]);

      component.toggleNumero(7);
      expect(component.selectedNumeros()).toEqual([]);
    });

    it('grise et bloque les numéros non sélectionnés quand le max est atteint', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumerosATirer: 2 });
      component.tirage.set(TIRAGE);

      component.toggleNumero(1);
      component.toggleNumero(2);

      // max atteint : un non-sélectionné est grisé et non cliquable
      expect(component.isNumeroDisabled(3)).toBe(true);
      component.toggleNumero(3);
      expect(component.selectedNumeros()).toEqual([1, 2]);

      // les sélectionnés restent cliquables pour se désélectionner
      expect(component.isNumeroDisabled(1)).toBe(false);
    });

    it('désélectionner un numéro débloque à nouveau les autres', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumerosATirer: 2 });
      component.tirage.set(TIRAGE);

      component.toggleNumero(1);
      component.toggleNumero(2);
      expect(component.isNumeroDisabled(3)).toBe(true);

      component.toggleNumero(1);
      expect(component.isNumeroDisabled(3)).toBe(false);
    });

    it('applique la même règle de max/grisé aux numéros chance', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumeroChanceATirer: 1 });
      component.tirage.set(TIRAGE);

      component.toggleNumeroChance(5);
      expect(component.selectedNumeroChance()).toEqual([5]);
      expect(component.isNumeroChanceDisabled(6)).toBe(true);

      component.toggleNumeroChance(6);
      expect(component.selectedNumeroChance()).toEqual([5]);
    });
  });

  describe('validité de la grille', () => {
    it('isComplete vrai quand numéros et chance atteignent le compte requis', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumerosATirer: 2, nbNumeroChanceATirer: 1 });
      component.tirage.set(TIRAGE);

      component.toggleNumero(1);
      component.toggleNumero(2);
      expect(component.isComplete()).toBe(false);

      component.toggleNumeroChance(3);
      expect(component.isComplete()).toBe(true);
    });

    it('errorMessage présent tant que la grille est incomplète, null une fois complète', () => {
      const { component } = setup();
      component.jeu.set({ ...JEU, nbNumerosATirer: 1, nbNumeroChanceATirer: 1 });
      component.tirage.set(TIRAGE);

      expect(component.errorMessage()).toBeTruthy();

      component.toggleNumero(1);
      component.toggleNumeroChance(2);
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('aucun tirage en cours', () => {
    it('désactive la grille et empêche toute sélection quand tirage est null', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(null);

      expect(component.isNumeroDisabled(1)).toBe(true);
      component.toggleNumero(1);
      expect(component.selectedNumeros()).toEqual([]);
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
