import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HistoriqueList } from './historique-list';
import { HistoriqueService } from '../../../shared/services/historique.service';
import { PartieHistoriqueItem } from '../../../shared/models/historique.model';

const mockParties: PartieHistoriqueItem[] = [
  {
    partieId: 1,
    tirageId: 10,
    tirageDate: '2026-06-03T19:00:00.000Z',
    jeu: { id: 1, nom: 'EuroMillions' },
  },
  {
    partieId: 2,
    tirageId: 11,
    tirageDate: '2026-05-31T18:30:00.000Z',
    jeu: { id: 2, nom: 'Loto' },
  },
];

describe('HistoriqueList', () => {
  let component: HistoriqueList;
  let fixture: ComponentFixture<HistoriqueList>;
  let mockService: jasmine.SpyObj<HistoriqueService>;
  let router: Router;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('HistoriqueService', ['getHistory']);

    await TestBed.configureTestingModule({
      imports: [HistoriqueList],
      providers: [
        provideRouter([]),
        { provide: HistoriqueService, useValue: mockService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HistoriqueList);
    component = fixture.componentInstance;
  });

  it('affiche le spinner pendant le chargement', () => {
    mockService.getHistory.and.returnValue(new Promise(() => {}));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeTruthy();
  });

  it('affiche la liste des parties après chargement', async () => {
    mockService.getHistory.and.resolveTo(mockParties);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.partie-btn');
    expect(buttons.length).toBe(2);
  });

  it('affiche le nom et la date de chaque partie', async () => {
    mockService.getHistory.and.resolveTo(mockParties);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('EuroMillions');
    expect(text).toContain('Loto');
  });

  it("affiche l'état vide si la liste est vide", async () => {
    mockService.getHistory.and.resolveTo([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it("affiche un message d'erreur si le service échoue", async () => {
    mockService.getHistory.and.rejectWith(new Error('network error'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-state')).toBeTruthy();
  });

  it('navigue vers /historique/:id au clic sur une carte', async () => {
    mockService.getHistory.and.resolveTo(mockParties);
    spyOn(router, 'navigate');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.partie-btn');
    btn.click();
    expect(router.navigate).toHaveBeenCalledWith(['/historique', 1]);
  });

  it('formate la date avec un tiret long et une heure au format Xh00', () => {
    const formatted = component.formatDate('2026-06-03T19:00:00.000Z');
    expect(formatted).toContain('—');
    expect(formatted).toMatch(/\d{1,2}h\d{2}/);
  });

  it('retourne un colorIndex entre 0 et 5', () => {
    for (let id = 1; id <= 12; id++) {
      const index = component.colorIndex(id);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(5);
    }
  });
});
