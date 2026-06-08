import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Jeu } from '../../models/jeu.model';

@Component({
  selector: 'app-card',
  imports: [RouterLink],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  jeu = input.required<Jeu>();
  colorIndex = input<number>(0);
}
