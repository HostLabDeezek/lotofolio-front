import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HistoriqueService } from './historique.service';
import { PartieDetail, PartieHistoriqueItem } from '../models/historique.model';
import { ApiError } from '../../core/errors/api-error';
import { errorInterceptor } from '../../core/interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

describe('HistoriqueService', () => {
  let service: HistoriqueService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HistoriqueService,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(HistoriqueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // getHistory()
  // ---------------------------------------------------------------------------

  describe('getHistory()', () => {
    it('appelle GET /api/parties/history et retourne la liste', async () => {
      const items: PartieHistoriqueItem[] = [
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

      const promise = service.getHistory();

      const req = httpMock.expectOne(`${environment.apiUrl}/parties/history`);
      expect(req.request.method).toBe('GET');
      req.flush(items);

      await expectAsync(promise).toBeResolvedTo(items);
    });

    it('retourne un tableau vide si aucune partie', async () => {
      const promise = service.getHistory();

      const req = httpMock.expectOne(`${environment.apiUrl}/parties/history`);
      req.flush([]);

      await expectAsync(promise).toBeResolvedTo([]);
    });

    it('propage les erreurs (ex. 401) en tant que ApiError', async () => {
      const promise = service.getHistory();

      const req = httpMock.expectOne(`${environment.apiUrl}/parties/history`);
      req.flush({ code: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });

      await expectAsync(promise).toBeRejectedWith(
        jasmine.objectContaining({ status: 401 } satisfies Partial<ApiError>),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getPartieDetail()
  // ---------------------------------------------------------------------------

  describe('getPartieDetail()', () => {
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
        { numeros: [7, 11, 14, 28, 31], numeroChance: [3] },
        { numeros: [4, 23, 27, 42, 45], numeroChance: [7] },
      ],
    };

    it('appelle GET /api/parties/:id et retourne le détail', async () => {
      const promise = service.getPartieDetail(12);

      const req = httpMock.expectOne(`${environment.apiUrl}/parties/12`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDetail);

      await expectAsync(promise).toBeResolvedTo(mockDetail);
    });

    it('propage les erreurs 404 PARTIE_NOT_FOUND en tant que ApiError', async () => {
      const promise = service.getPartieDetail(999);

      const req = httpMock.expectOne(`${environment.apiUrl}/parties/999`);
      req.flush({ code: 'PARTIE_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });

      await expectAsync(promise).toBeRejectedWith(
        jasmine.objectContaining({ status: 404, code: 'PARTIE_NOT_FOUND' } satisfies Partial<ApiError>),
      );
    });

    it('propage les erreurs 403 FORBIDDEN en tant que ApiError', async () => {
      const promise = service.getPartieDetail(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/parties/5`);
      req.flush({ code: 'FORBIDDEN' }, { status: 403, statusText: 'Forbidden' });

      await expectAsync(promise).toBeRejectedWith(
        jasmine.objectContaining({ status: 403, code: 'FORBIDDEN' } satisfies Partial<ApiError>),
      );
    });

    it('rejette immédiatement si partieId est invalide, sans émettre de requête HTTP', async () => {
      await expectAsync(service.getPartieDetail(-1)).toBeRejectedWithError(/partieId invalide/);
      await expectAsync(service.getPartieDetail(0)).toBeRejectedWithError(/partieId invalide/);
      await expectAsync(service.getPartieDetail(NaN)).toBeRejectedWithError(/partieId invalide/);
      httpMock.expectNone(`${environment.apiUrl}/parties/-1`);
      httpMock.expectNone(`${environment.apiUrl}/parties/0`);
      httpMock.expectNone(`${environment.apiUrl}/parties/NaN`);
    });
  });
});
