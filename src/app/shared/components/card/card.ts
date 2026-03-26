import { Component, input } from '@angular/core';
import { Jeu } from '../../models/jeu.model';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  jeu = input.required<Jeu>();
  colorIndex = input<number>(0);
}
