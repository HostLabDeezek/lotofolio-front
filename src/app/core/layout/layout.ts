import { JeuStore } from './../../shared/stores/jeu.store';
import { HeaderComponent } from './../header/header';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ToastHost],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit {

jeuStore = inject(JeuStore);

  ngOnInit(): void {
    this.jeuStore.loadJeux();
  }

}
