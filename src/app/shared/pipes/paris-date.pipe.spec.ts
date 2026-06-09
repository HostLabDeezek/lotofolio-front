import { ParisDatePipe } from './paris-date.pipe';

describe('ParisDatePipe', () => {
  let pipe: ParisDatePipe;

  beforeEach(() => {
    pipe = new ParisDatePipe();
  });

  it('formate la date avec un tiret long séparateur', () => {
    const result = pipe.transform('2026-06-03T19:00:00.000Z');
    expect(result).toContain('—');
  });

  it("formate l'heure au format Xh00", () => {
    const result = pipe.transform('2026-06-03T19:00:00.000Z');
    expect(result).toMatch(/\d{1,2}h\d{2}/);
  });

  it('contient le nom du mois en français', () => {
    const result = pipe.transform('2026-06-03T19:00:00.000Z');
    expect(result.toLowerCase()).toContain('juin');
  });

  it('contient un jour de semaine abrégé', () => {
    // 3 juin 2026 est un mercredi
    const result = pipe.transform('2026-06-03T19:00:00.000Z');
    expect(result.toLowerCase()).toMatch(/mer\.|lun\.|mar\.|jeu\.|ven\.|sam\.|dim\./);
  });
});
