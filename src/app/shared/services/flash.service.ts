import { Injectable } from '@angular/core';
import { Jeu } from '../models/jeu.model';
import { GrilleDraft } from '../models/grille.model';

/**
 * Tirage aléatoire des grilles (LF-30). Logique pure et testable, sans état :
 * la page `Grille` orchestre l'animation, le service ne fait que tirer.
 *
 * Le tirage utilise `crypto.getRandomValues` (et non `Math.random`) pour la
 * qualité de l'aléa, via un Fisher-Yates partiel sur `[1..n]`.
 */
@Injectable({ providedIn: 'root' })
export class FlashService {
  /** Borne de sécurité contre une boucle infinie quand l'unicité est impossible. */
  private static readonly MAX_DRAW_ATTEMPTS = 100;

  /** Tire une grille complète (numéros + numéros chance) pour le jeu donné. */
  flashGrille(jeu: Jeu): GrilleDraft {
    return {
      numeros: this.drawUnique(jeu.intervalNumero, jeu.nbNumerosATirer),
      numeroChance: this.drawUnique(jeu.intervalNumeroChance, jeu.nbNumeroChanceATirer),
    };
  }

  /**
   * Tire `count` grilles en garantissant qu'aucune n'est strictement identique
   * à une autre du lot (le backend refuse les grilles dupliquées — cf. LF-34).
   * Sur des configurations dégénérées où l'unicité est impossible, on s'arrête
   * après un nombre borné de tentatives plutôt que de boucler indéfiniment.
   */
  flashGrilles(jeu: Jeu, count: number): GrilleDraft[] {
    const grilles: GrilleDraft[] = [];
    const seen = new Set<string>();

    while (grilles.length < count) {
      let draft = this.flashGrille(jeu);
      let attempts = 0;
      while (seen.has(this.key(draft)) && attempts < FlashService.MAX_DRAW_ATTEMPTS) {
        draft = this.flashGrille(jeu);
        attempts++;
      }
      seen.add(this.key(draft));
      grilles.push(draft);
    }

    return grilles;
  }

  /** Clé canonique d'une grille (numéros triés) pour comparer l'identité. */
  private key(draft: GrilleDraft): string {
    const numeros = [...draft.numeros].sort((a, b) => a - b).join(',');
    const chance = [...draft.numeroChance].sort((a, b) => a - b).join(',');
    return `${numeros}|${chance}`;
  }

  /**
   * Tire `k` entiers uniques dans `[1, max]` via un Fisher-Yates partiel.
   * Renvoie `[]` si `k <= 0`. `k` est borné à `max` par sécurité.
   */
  private drawUnique(max: number, k: number): number[] {
    if (k <= 0 || max <= 0) {
      return [];
    }
    const count = Math.min(k, max);
    const pool = Array.from({ length: max }, (_, i) => i + 1);
    for (let i = 0; i < count; i++) {
      const j = i + this.randomInt(max - i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  /** Entier aléatoire uniforme dans `[0, bound)` via `crypto.getRandomValues`. */
  private randomInt(bound: number): number {
    // Rejet des valeurs au-delà du plus grand multiple de `bound` pour éviter
    // le biais modulo sur les bornes non puissances de 2.
    const limit = Math.floor(0xffffffff / bound) * bound;
    const buffer = new Uint32Array(1);
    let value: number;
    do {
      crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return value % bound;
  }
}
