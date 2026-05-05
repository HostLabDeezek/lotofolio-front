import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it("propage le message du backend en cas d'erreur", (done) => {
    http.get('/api/test').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Email ou mot de passe incorrect');
        done();
      },
    });

    controller.expectOne('/api/test').flush(
      { error: 'Email ou mot de passe incorrect' },
      { status: 401, statusText: 'Unauthorized' },
    );
  });

  it('utilise le message de fallback si le backend ne renvoie pas de message', (done) => {
    http.get('/api/test').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Une erreur est survenue');
        done();
      },
    });

    controller.expectOne('/api/test').flush({}, { status: 500, statusText: 'Server Error' });
  });

  it('laisse passer les réponses sans erreur', (done) => {
    http.get('/api/test').subscribe({
      next: (data) => {
        expect(data).toEqual({ ok: true });
        done();
      },
    });

    controller.expectOne('/api/test').flush({ ok: true });
  });
});
