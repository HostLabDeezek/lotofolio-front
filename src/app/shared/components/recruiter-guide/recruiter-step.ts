import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recruiter-step',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './recruiter-step.scss',
  template: `
    <div class="step">
      <div class="step__number" aria-hidden="true">{{ number() }}</div>
      <div class="step__body">
        <div class="step__title">
          <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
          <span>{{ title() }}</span>
        </div>
        <div class="step__description">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class RecruiterStep {
  number = input.required<string>();
  icon = input.required<string>();
  title = input.required<string>();
}
