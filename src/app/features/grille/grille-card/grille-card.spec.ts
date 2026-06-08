import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GrilleCard } from './grille-card';
import { Jeu } from '../../../shared/models/jeu.model';
import { GrilleLocalState } from '../../../shared/models/grille.model';

const JEU: Jeu = {
  id: 1,
  nom: 'Loto',
  description: null,
  regle: null,
  intervalNumero: 49,
  intervalNumeroChance: 10,
  nbNumeroChanceATirer: 1,
  nbNumerosATirer: 5,
};

function grille(overrides: Partial<GrilleLocalState> = {}): GrilleLocalState {
  return { id: 'g1', selectedNumeros: [], selectedNumeroChance: [], ...overrides };
}

function setup(inputs: {
  grille?: GrilleLocalState;
  position?: number;
  disabled?: boolean;
  canDelete?: boolean;
  errorMessage?: string | null;
}) {
  TestBed.configureTestingModule({ imports: [GrilleCard] });
  const fixture: ComponentFixture<GrilleCard> = TestBed.createComponent(GrilleCard);
  const ref = fixture.componentRef;
  ref.setInput('jeu', JEU);
  ref.setInput('grille', inputs.grille ?? grille());
  ref.setInput('position', inputs.position ?? 1);
  ref.setInput('disabled', inputs.disabled ?? false);
  ref.setInput('canDelete', inputs.canDelete ?? true);
  ref.setInput('errorMessage', inputs.errorMessage ?? null);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('GrilleCard', () => {
  it('should create', () => {
    const { component } = setup({});
    expect(component).toBeTruthy();
  });

  it('affiche le titre « Grille N » selon position', () => {
    const { fixture } = setup({ position: 3 });
    const title = fixture.nativeElement.querySelector('.card__title');
    expect(title.textContent).toContain('Grille 3');
  });

  it('reflète les numéros sélectionnés issus du parent', () => {
    const { component } = setup({ grille: grille({ selectedNumeros: [7] }) });
    expect(component.isNumeroSelected(7)).toBe(true);
    expect(component.isNumeroSelected(8)).toBe(false);
  });

  it('désactive les numéros non sélectionnés quand le max est atteint', () => {
    const { component } = setup({ grille: grille({ selectedNumeros: [1, 2, 3, 4, 5] }) });
    expect(component.isNumeroDisabled(6)).toBe(true);
    expect(component.isNumeroDisabled(1)).toBe(false);
  });

  it('désactive tous les numéros quand disabled est vrai', () => {
    const { component } = setup({ disabled: true });
    expect(component.isNumeroDisabled(1)).toBe(true);
    expect(component.isNumeroChanceDisabled(1)).toBe(true);
  });

  it('émet numeroToggled au clic sur un numéro', () => {
    const { fixture, component } = setup({});
    const emitted: number[] = [];
    component.numeroToggled.subscribe((n) => emitted.push(n));

    const firstNum: HTMLButtonElement = fixture.nativeElement.querySelector('.zone .num');
    firstNum.click();

    expect(emitted).toEqual([1]);
  });

  it('émet deleted au clic sur la croix', () => {
    const { fixture, component } = setup({});
    let deleted = false;
    component.deleted.subscribe(() => (deleted = true));

    const del: HTMLButtonElement = fixture.nativeElement.querySelector('.card__delete');
    del.click();

    expect(deleted).toBe(true);
  });

  it('désactive la croix de suppression quand canDelete est faux', () => {
    const { fixture } = setup({ canDelete: false });
    const del: HTMLButtonElement = fixture.nativeElement.querySelector('.card__delete');
    expect(del.disabled).toBe(true);
  });

  it('affiche le message d’erreur fourni quand non désactivé', () => {
    const { fixture } = setup({ errorMessage: 'Sélectionnez 5 numéros' });
    const msg = fixture.nativeElement.querySelector('.card__validation');
    expect(msg.textContent).toContain('Sélectionnez 5 numéros');
  });

  it('masque le message d’erreur quand disabled', () => {
    const { fixture } = setup({ disabled: true, errorMessage: 'Sélectionnez 5 numéros' });
    const msg = fixture.nativeElement.querySelector('.card__validation');
    expect(msg).toBeNull();
  });
});
