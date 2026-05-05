import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RecruiterGuideFab } from './shared/components/recruiter-guide/recruiter-guide-fab';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RecruiterGuideFab],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('loto-frontend');
}
