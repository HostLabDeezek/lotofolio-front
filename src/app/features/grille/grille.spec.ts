import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Grille } from './grille';
import { Jeu } from '../../shared/models/jeu.model';
import { GrilleLocalState, Tirage } from '../../shared/models/grille.model';
import { errorInterceptor } from '../../core/interceptors/error.interceptor';
import { ToastService } from '../../shared/services/toast.service';
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

// Un « tirage en cours » est, par nature, toujours dans le futur : on le date
// dynamiquement pour que `closed()` et le rechargement post-tirage restent inertes.
const TIRAGE: Tirage = {
  id: 42,
  jeuId: 1,
  dateTirage: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  numerosTires: [],
  numeroChanceTire: [],
  status: 'PENDING',
};

/** Grille complète pour JEU (5 numéros + 1 chance), prête à être soumise. */
function completeGrille(id = 'c'): GrilleLocalState {
  return { id, selectedNumeros: [1, 2, 3, 4, 5], selectedNumeroChance: [7] };
}

function setup(routeId = '1') {
  TestBed.configureTestingModule({
    imports: [Grille],
    providers: [
      // L'errorInterceptor normalise les erreurs HTTP en `ApiError` (comme en
      // prod) : indispensable pour tester le mapping des codes de soumission.
      provideHttpClient(withInterceptors([errorInterceptor])),
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

  describe('flash : validation de la saisie', () => {
    it('flashCount vaut 1 par défaut', () => {
      const { component } = setup();
      expect(component.flashCount()).toBe(1);
      expect(component.flashError()).toBeNull();
    });

    it('une valeur > 5 affiche « Maximum 5 flashs autorisés » et bloque le flash', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);

      component.setFlashCount('6');
      expect(component.flashError()).toBe('Maximum 5 flashs autorisés');
      expect(component.canFlash()).toBe(false);
    });

    it('une valeur < 1 est invalide', () => {
      const { component } = setup();
      component.setFlashCount('0');
      expect(component.flashError()).toBe('Maximum 5 flashs autorisés');
      expect(component.canFlash()).toBe(false);
    });

    it('une valeur non numérique est invalide', () => {
      const { component } = setup();
      component.setFlashCount('abc');
      expect(component.flashError()).toBe('Maximum 5 flashs autorisés');
      expect(component.canFlash()).toBe(false);
    });

    it('le flash est impossible sans tirage en cours', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(null);
      expect(component.canFlash()).toBe(false);
    });
  });

  describe('flash : comportement', () => {
    it('écrase tout l’état courant par N grilles, quel que soit l’état précédent', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);
      // État pré-existant : 3 grilles dont une partiellement remplie.
      component.addGrille();
      component.addGrille();
      component.toggleNumero(grilleId(component, 0), 7);

      component.setFlashCount('2');
      component.flash();

      expect(component.grilles().length).toBe(2);
      // L'ancienne sélection a disparu (l'animation part de grilles vides).
      expect(component.grilles().every((g) => !g.selectedNumeros.includes(7))).toBe(true);
    });

    it('remplit progressivement puis complète les grilles à la fin de l’animation', fakeAsync(() => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);

      component.setFlashCount('3');
      component.flash();

      expect(component.animating()).toBe(true);

      tick(5000);

      expect(component.animating()).toBe(false);
      expect(component.grilles().length).toBe(3);
      for (const g of component.grilles()) {
        expect(g.selectedNumeros.length).toBe(JEU.nbNumerosATirer);
        expect(g.selectedNumeroChance.length).toBe(JEU.nbNumeroChanceATirer);
      }
    }));

    it('n’a aucun effet quand la saisie est invalide', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);
      component.setFlashCount('6');

      component.flash();

      expect(component.animating()).toBe(false);
      expect(component.grilles().length).toBe(1);
    });

    it('un nouveau flash relance l’animation et réécrase l’état', fakeAsync(() => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);

      component.setFlashCount('2');
      component.flash();
      tick(5000);
      const first = component.grilles().map((g) => g.id);

      component.flash();
      tick(5000);
      const second = component.grilles().map((g) => g.id);

      expect(second.length).toBe(2);
      expect(second.some((id) => first.includes(id))).toBe(false);
    }));
  });

  describe('chargement (ngOnInit)', () => {
    it('au refresh (store vide), récupère le jeu via la liste, pas via GET /jeux/:id', async () => {
      const { fixture, component } = setup('1');
      fixture.detectChanges(); // déclenche ngOnInit

      const httpMock = TestBed.inject(HttpTestingController);
      // Le back n'expose pas GET /jeux/:id (404) : on doit passer par la liste.
      httpMock.expectNone(`${environment.apiUrl}/jeux/1`);
      httpMock.expectOne(`${environment.apiUrl}/jeux`).flush([JEU]);
      httpMock.expectOne(`${environment.apiUrl}/jeux/1/current-tirage`).flush(TIRAGE);

      await fixture.whenStable();

      expect(component.jeu()?.nom).toBe('Loto');
      expect(component.tirage()?.id).toBe(42);
      expect(component.tirageId()).toBe(42);
      httpMock.verify();
    });

    it('affiche une erreur quand le jeu est absent de la liste', async () => {
      const { fixture, component } = setup('999');
      fixture.detectChanges();

      const httpMock = TestBed.inject(HttpTestingController);
      httpMock.expectOne(`${environment.apiUrl}/jeux`).flush([JEU]);
      httpMock.expectOne(`${environment.apiUrl}/jeux/999/current-tirage`).flush(TIRAGE);

      await fixture.whenStable();

      expect(component.jeu()).toBeNull();
      expect(component.error()).toBe('Impossible de charger le jeu');
      httpMock.verify();
    });
  });

  describe('bouton « Valider mes grilles »', () => {
    it('reste désactivé tant qu’une grille est incomplète', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);

      // Une seule grille vide au départ : incomplète.
      expect(component.canSubmit()).toBe(false);
      expect(component.submitHint()).toBe('Complétez toutes vos grilles pour valider');

      component.grilles.set([completeGrille()]);
      expect(component.canSubmit()).toBe(true);
      expect(component.submitHint()).toBeNull();
    });

    it('désactivé si une seule des plusieurs grilles est incomplète', () => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);
      component.grilles.set([completeGrille('a'), { id: 'b', selectedNumeros: [1], selectedNumeroChance: [] }]);

      expect(component.canSubmit()).toBe(false);
    });
  });

  describe('soumission', () => {
    function ready() {
      const ctx = setup();
      ctx.component.jeu.set(JEU);
      ctx.component.tirage.set(TIRAGE);
      ctx.component.grilles.set([completeGrille('a'), completeGrille('b')]);
      return ctx;
    }

    it('envoie un seul POST /api/parties avec { tirageId, grilles }', async () => {
      const { component } = ready();
      const httpMock = TestBed.inject(HttpTestingController);

      const promise = component.submit();
      const req = httpMock.expectOne(`${environment.apiUrl}/parties`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        tirageId: 42,
        grilles: [
          { numeros: [1, 2, 3, 4, 5], numeroChance: [7] },
          { numeros: [1, 2, 3, 4, 5], numeroChance: [7] },
        ],
      });
      req.flush(null, { status: 201, statusText: 'Created' });
      await promise;
      httpMock.verify();
    });

    it('succès 201 : toast, on reste sur la page, état réinitialisé à une grille vide', async () => {
      const { component } = ready();
      const toast = TestBed.inject(ToastService);
      const httpMock = TestBed.inject(HttpTestingController);

      const promise = component.submit();
      httpMock.expectOne(`${environment.apiUrl}/parties`).flush(null, {
        status: 201,
        statusText: 'Created',
      });
      await promise;

      expect(toast.toasts().length).toBe(1);
      expect(toast.toasts()[0].kind).toBe('success');
      expect(component.grilles().length).toBe(1);
      expect(component.grilles()[0].selectedNumeros).toEqual([]);
      expect(component.flashCount()).toBe(1);
      expect(component.submitError()).toBeNull();
      // On reste sur la page : le tirage est toujours chargé.
      expect(component.tirage()?.id).toBe(42);
      httpMock.verify();
    });

    it('mappe les codes d’erreur sans réinitialiser la page', async () => {
      const cases: Array<{ status: number; code: string; message: string }> = [
        { status: 409, code: 'CUTOFF_PASSED', message: 'La saisie est fermée pour ce tirage.' },
        {
          status: 400,
          code: 'INVALID_GRILLE',
          message: 'Une de vos grilles est invalide (ou deux grilles sont identiques).',
        },
        {
          status: 404,
          code: 'TIRAGE_NOT_FOUND',
          message: "Le tirage n'est plus disponible, rechargez la page.",
        },
        {
          status: 400,
          code: 'INVALID_PAYLOAD',
          message: 'Données invalides, vérifiez vos grilles.',
        },
      ];

      for (const { status, code, message } of cases) {
        const { component } = ready();
        const httpMock = TestBed.inject(HttpTestingController);

        const promise = component.submit();
        httpMock
          .expectOne(`${environment.apiUrl}/parties`)
          .flush({ code, message: 'msg back' }, { status, statusText: 'err' });
        await promise;

        expect(component.submitError()).toBe(message);
        // Page non réinitialisée : les 2 grilles composées sont conservées.
        expect(component.grilles().length).toBe(2);
        httpMock.verify();
        TestBed.resetTestingModule();
      }
    });

    it('erreur 500 (corps { error }, sans code) : message générique', async () => {
      const { component } = ready();
      const httpMock = TestBed.inject(HttpTestingController);

      const promise = component.submit();
      httpMock
        .expectOne(`${environment.apiUrl}/parties`)
        .flush({ error: 'Erreur serveur interne' }, { status: 500, statusText: 'Server Error' });
      await promise;

      expect(component.submitError()).toBe('Une erreur est survenue, réessayez plus tard.');
      expect(component.grilles().length).toBe(2);
      httpMock.verify();
    });

    it('intégration : flash → valider → toast succès → page réinitialisée', fakeAsync(() => {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set(TIRAGE);
      const toast = TestBed.inject(ToastService);
      const httpMock = TestBed.inject(HttpTestingController);

      component.setFlashCount('2');
      component.flash();
      tick(5000); // l'animation remplit les 2 grilles
      expect(component.canSubmit()).toBe(true);

      component.submit();
      httpMock.expectOne(`${environment.apiUrl}/parties`).flush(null, {
        status: 201,
        statusText: 'Created',
      });
      flushMicrotasks();

      expect(toast.toasts().length).toBe(1);
      expect(component.grilles().length).toBe(1);
      expect(component.grilles()[0].selectedNumeros).toEqual([]);

      httpMock.verify();
      tick(4000); // purge le timer d'auto-dismiss du toast
    }));
  });

  describe('cutoff et compte à rebours (Europe/Paris)', () => {
    /** Tirage à 20h00 Paris (18h00 UTC) un jour donné. */
    const draw20h = new Date('2026-06-09T18:00:00.000Z').getTime();

    function atParis(offsetMin: number) {
      const { component } = setup();
      component.jeu.set(JEU);
      component.tirage.set({ ...TIRAGE, dateTirage: '2026-06-09T18:00:00.000Z' });
      component.now.set(draw20h + offsetMin * 60 * 1000);
      return component;
    }

    it('affiche l’heure limite calculée (20h00 − 6 min = 19h54)', () => {
      const component = atParis(-120); // largement avant le cutoff
      expect(component.cutoffLabel()).toBe("Saisie possible jusqu'à 19h54.");
    });

    it('affiche un compte à rebours dans la dernière heure avant le cutoff', () => {
      // 30 min avant le cutoff (= 36 min avant le tirage).
      const component = atParis(-36);
      expect(component.countdownLabel()).toBe('Il vous reste 30 min');
      expect(component.closed()).toBe(false);
    });

    it('pas de compte à rebours hors de la fenêtre d’une heure', () => {
      const component = atParis(-120);
      expect(component.countdownLabel()).toBeNull();
    });

    it('à 19h55 (après cutoff, avant tirage) la page passe en mode fermé', () => {
      const component = atParis(-5); // 5 min avant le tirage → après 19h54
      expect(component.closed()).toBe(true);
      expect(component.disabled()).toBe(true);
      expect(component.canSubmit()).toBe(false);
      expect(component.countdownLabel()).toBeNull();
    });

    it('le mode fermé désactive même une composition complète', () => {
      const component = atParis(-3);
      component.grilles.set([completeGrille()]);
      expect(component.canSubmit()).toBe(false);
    });

    it('reste fermée après l’heure du tirage (tirage périmé non remplacé)', () => {
      // 5 min après le tirage : si le rechargement tarde ou échoue, on ne doit
      // pas rouvrir la saisie sur un tirage déjà tiré.
      const component = atParis(5);
      component.grilles.set([completeGrille()]);
      expect(component.closed()).toBe(true);
      expect(component.disabled()).toBe(true);
      expect(component.canSubmit()).toBe(false);
      expect(component.countdownLabel()).toBeNull();
    });
  });
});
