import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PartieService } from './partie.service';
import { PlayPayload } from '../models/grille.model';
import { ApiError } from '../../core/errors/api-error';
import { errorInterceptor } from '../../core/interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

const PAYLOAD: PlayPayload = {
  tirageId: 42,
  grilles: [
    { numeros: [3, 12, 24, 31, 49], numeroChance: [7] },
    { numeros: [1, 9, 18, 22, 40], numeroChance: [2] },
  ],
};

describe('PartieService', () => {
  let service: PartieService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PartieService,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PartieService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POST /api/parties avec { tirageId, grilles } et résout sur un 201 vide', async () => {
    const promise = service.playGrilles(PAYLOAD);

    const req = httpMock.expectOne(`${environment.apiUrl}/parties`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(PAYLOAD);

    req.flush(null, { status: 201, statusText: 'Created' });

    await expectAsync(promise).toBeResolved();
  });

  it('propage une ApiError porteuse du code métier en cas d’erreur', async () => {
    const promise = service.playGrilles(PAYLOAD);

    httpMock
      .expectOne(`${environment.apiUrl}/parties`)
      .flush({ code: 'CUTOFF_PASSED', message: 'fermé' }, { status: 409, statusText: 'Conflict' });

    await expectAsync(promise).toBeRejectedWith(jasmine.any(ApiError));
    await promise.catch((err: ApiError) => {
      expect(err.status).toBe(409);
      expect(err.code).toBe('CUTOFF_PASSED');
    });
  });
});
