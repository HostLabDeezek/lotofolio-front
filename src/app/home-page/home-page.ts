import { Component, inject } from '@angular/core';
import { Card } from '../shared/components/card/card';
import { JeuStore } from '../shared/stores/jeu.store';

@Component({
  selector: 'app-home-page',
  imports: [Card],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  jeuStore = inject(JeuStore);
}
