import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { Auth } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { LoginResponse } from '../../../shared/models/user.model';

const mockLoginResponse: LoginResponse = {
  token: 'fake-jwt',
  user: { id: 1, name: 'Simon', email: 'simon@test.com', role: 'USER' },
};

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authSpy: jasmine.SpyObj<Auth>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('Auth', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSubmit - formulaire invalide', () => {
    it("ne soumet pas si l'email est vide", () => {
      component.loginForm.setValue({ email: '', password: 'password123' });
      component.onSubmit();
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('ne soumet pas si le mot de passe est trop court', () => {
      component.loginForm.setValue({ email: 'simon@test.com', password: '123' });
      component.onSubmit();
      expect(authSpy.login).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit - succès', () => {
    beforeEach(() => {
      component.loginForm.setValue({ email: 'simon@test.com', password: 'password123' });
      authSpy.login.and.returnValue(of(mockLoginResponse));
    });

    it('navigue vers / après connexion', () => {
      component.onSubmit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('désactive le chargement après connexion', () => {
      component.onSubmit();
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('onSubmit - erreurs backend', () => {
    beforeEach(() => {
      component.loginForm.setValue({ email: 'simon@test.com', password: 'password123' });
    });

    it('affiche le message du backend sur un 401', () => {
      authSpy.login.and.returnValue(
        throwError(() => new Error('Email ou mot de passe incorrect')),
      );
      component.onSubmit();
      expect(component.errorMessage()).toBe('Email ou mot de passe incorrect');
    });

    it('affiche le message du backend sur un 400', () => {
      authSpy.login.and.returnValue(
        throwError(() => new Error('Données invalides')),
      );
      component.onSubmit();
      expect(component.errorMessage()).toBe('Données invalides');
    });

    it('affiche le message de fallback si le backend ne renvoie pas de message', () => {
      authSpy.login.and.returnValue(throwError(() => new Error('Une erreur est survenue')));
      component.onSubmit();
      expect(component.errorMessage()).toBe('Une erreur est survenue');
    });

    it('désactive le chargement après une erreur', () => {
      authSpy.login.and.returnValue(
        throwError(() => new Error('Email ou mot de passe incorrect')),
      );
      component.onSubmit();
      expect(component.isLoading()).toBeFalse();
    });
  });
});
