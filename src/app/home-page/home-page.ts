import { Component, inject, OnInit } from '@angular/core';
import { JeuStore } from '../shared/stores/jeu.store';
import { Card } from '../shared/components/card/card'; // Import the Card component

@Component({
  selector: 'app-home-page',
  imports: [Card],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  jeuStore = inject(JeuStore);

  ngOnInit(): void {
    this.jeuStore.loadJeux();
  }

}
