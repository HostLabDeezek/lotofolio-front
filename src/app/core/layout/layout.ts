import { JeuStore } from './../../shared/stores/jeu.store';
import { HeaderComponent } from './../header/header';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit {

jeuStore = inject(JeuStore);

  ngOnInit(): void {
    this.jeuStore.loadJeux();
  }

}
