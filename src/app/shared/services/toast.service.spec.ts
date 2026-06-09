import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('empile un toast de succès puis le retire après le délai', fakeAsync(() => {
    service.success('Enregistré');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]).toEqual(
      jasmine.objectContaining({ kind: 'success', message: 'Enregistré' }),
    );

    tick(4000);
    expect(service.toasts().length).toBe(0);
  }));

  it('empile un toast d’erreur', fakeAsync(() => {
    service.error('Oups');
    expect(service.toasts()[0].kind).toBe('error');
    tick(4000);
  }));

  it('dismiss retire un toast par id avant son expiration', fakeAsync(() => {
    service.success('A');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
    tick(4000);
  }));

  it('attribue des ids distincts à des toasts successifs', fakeAsync(() => {
    service.success('A');
    service.success('B');
    const ids = service.toasts().map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
    tick(4000);
  }));
});
