import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TirageService } from './tirage.service';
import { Tirage } from '../models/grille.model';
import { environment } from '../../../environments/environment';

describe('TirageService', () => {
  let service: TirageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TirageService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TirageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('retourne le tirage en cours quand le back renvoie 200', async () => {
    const tirage: Tirage = {
      id: 42,
      jeuId: 1,
      dateTirage: '2026-05-11T18:00:00.000Z',
      numerosTires: [],
      numeroChanceTire: [],
      status: 'PENDING',
    };

    const promise = service.getCurrentTirage(1);

    const req = httpMock.expectOne(`${environment.apiUrl}/jeux/1/current-tirage`);
    expect(req.request.method).toBe('GET');
    req.flush(tirage);

    await expectAsync(promise).toBeResolvedTo(tirage);
  });

  it('retourne null sur 404 NO_CURRENT_TIRAGE', async () => {
    const promise = service.getCurrentTirage(1);

    const req = httpMock.expectOne(`${environment.apiUrl}/jeux/1/current-tirage`);
    req.flush({ code: 'NO_CURRENT_TIRAGE' }, { status: 404, statusText: 'Not Found' });

    await expectAsync(promise).toBeResolvedTo(null);
  });

  it('retourne null sur 404 JEU_NOT_FOUND', async () => {
    const promise = service.getCurrentTirage(99);

    const req = httpMock.expectOne(`${environment.apiUrl}/jeux/99/current-tirage`);
    req.flush({ code: 'JEU_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });

    await expectAsync(promise).toBeResolvedTo(null);
  });

  it('retourne null sur 400 INVALID_JEU_ID', async () => {
    const promise = service.getCurrentTirage(0);

    const req = httpMock.expectOne(`${environment.apiUrl}/jeux/0/current-tirage`);
    req.flush({ code: 'INVALID_JEU_ID' }, { status: 400, statusText: 'Bad Request' });

    await expectAsync(promise).toBeResolvedTo(null);
  });

  it('propage les autres erreurs (ex. 500)', async () => {
    const promise = service.getCurrentTirage(1);

    const req = httpMock.expectOne(`${environment.apiUrl}/jeux/1/current-tirage`);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    await expectAsync(promise).toBeRejected();
  });
});
