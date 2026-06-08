import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Card } from './card';
import { Jeu } from '../../models/jeu.model';

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

describe('Card', () => {
  let component: Card;
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Card);
    fixture.componentRef.setInput('jeu', JEU);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('pointe vers la page grille du jeu', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.jeu-card');
    expect(link.getAttribute('href')).toBe('/jeux/1/grille');
  });
});
