import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { HistoriqueDetail } from './historique-detail';
import { HistoriqueService } from '../../../shared/services/historique.service';
import { PartieDetail } from '../../../shared/models/historique.model';
import { ApiError } from '../../../core/errors/api-error';

const mockDetail: PartieDetail = {
  partieId: 12,
  tirage: {
    id: 42,
    dateTirage: '2026-05-31T18:30:00.000Z',
    numerosTires: [7, 14, 23, 31, 42],
    numeroChanceTire: [3],
    jeu: { id: 2, nom: 'Loto' },
  },
  grilles: [
    { numeros: [7, 11, 14, 28, 31], numeroChance: [3] },  // 3 num + 1 chance
    { numeros: [4, 23, 27, 42, 45], numeroChance: [7] },  // 2 num
    { numeros: [1, 2, 3, 4, 5], numeroChance: [1] },      // 0 match
  ],
};

function createActivatedRoute(id: string) {
  return {
    snapshot: { paramMap: { get: () => id } },
  };
}

describe('HistoriqueDetail', () => {
  let component: HistoriqueDetail;
  let fixture: ComponentFixture<HistoriqueDetail>;
  let mockService: jasmine.SpyObj<HistoriqueService>;
  let router: Router;

  async function setup(id: string, serviceSetup: () => void) {
    mockService = jasmine.createSpyObj('HistoriqueService', ['getPartieDetail']);
    serviceSetup();

    await TestBed.configureTestingModule({
      imports: [HistoriqueDetail],
      providers: [
        provideRouter([]),
        { provide: HistoriqueService, useValue: mockService },
        { provide: ActivatedRoute, useValue: createActivatedRoute(id) },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HistoriqueDetail);
    component = fixture.componentInstance;
  }

  it('affiche le spinner pendant le chargement', async () => {
    await setup('12', () => mockService.getPartieDetail.and.returnValue(new Promise(() => {})));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeTruthy();
  });

  it('affiche le nom du jeu et la date après chargement', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loto');
  });

  it('affiche les boules du tirage gagnant', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const tirageBalls = fixture.nativeElement.querySelectorAll('.ball--tirage');
    expect(tirageBalls.length).toBe(5);
    const chanceBalls = fixture.nativeElement.querySelectorAll('.ball--tirage-chance');
    expect(chanceBalls.length).toBe(1);
  });

  it('classe les grilles du plus au moins de matchs', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const grilles = fixture.nativeElement.querySelectorAll('.grille-item');
    expect(grilles.length).toBe(3);
    // La première doit avoir le badge #1
    expect(grilles[0].textContent).toContain('#1');
  });

  it('les boules matchées ont la classe ball--hit', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const hitBalls = fixture.nativeElement.querySelectorAll('.ball--hit');
    // Grille 1 a 3 matchs (topN=5, les 3 grilles sont affichées)
    expect(hitBalls.length).toBeGreaterThan(0);
  });

  it('topN par défaut est 5, limité au nombre de grilles', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // mockDetail a 3 grilles donc topN effectif = 3
    expect(component.rankedGrilles().length).toBe(3);
  });

  it('le bouton + incrémente topN, − le décrémente', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.topN.set(2);
    component.incrementTopN();
    expect(component.topN()).toBe(3);

    component.decrementTopN();
    expect(component.topN()).toBe(2);
  });

  it('decrementTopN ne descend pas en dessous de 1', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    component.topN.set(1);
    component.decrementTopN();
    expect(component.topN()).toBe(1);
  });

  it('affiche une erreur si le service rejette avec 404', async () => {
    await setup('12', () =>
      mockService.getPartieDetail.and.rejectWith(new ApiError(404, 'PARTIE_NOT_FOUND', 'Not found')),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-state')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('introuvable');
  });

  it('affiche une erreur si :id est invalide sans appeler le service', async () => {
    await setup('abc', () => {});
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(mockService.getPartieDetail).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.error-state')).toBeTruthy();
  });

  it('navigue vers /historique au clic sur le bouton retour', async () => {
    await setup('12', () => mockService.getPartieDetail.and.resolveTo(mockDetail));
    spyOn(router, 'navigate');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.back-btn').click();
    expect(router.navigate).toHaveBeenCalledWith(['/historique']);
  });
});
