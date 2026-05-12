import { Component, inject } from '@angular/core';
import { Card } from '../../shared/components/card/card';
import { JeuStore } from '../../shared/stores/jeu.store';

@Component({
  selector: 'app-games',
  imports: [Card],
  templateUrl: './games.html',
  styleUrl: './games.scss',
})
export class Games {
  protected readonly jeuStore = inject(JeuStore);
}
