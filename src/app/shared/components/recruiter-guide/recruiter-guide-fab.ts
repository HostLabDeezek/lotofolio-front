import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { RecruiterGuideDialog } from './recruiter-guide-dialog';

@Component({
  selector: 'app-recruiter-guide-fab',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recruiter-guide-fab.html',
  styleUrl: './recruiter-guide-fab.scss',
})
export class RecruiterGuideFab {
  private readonly dialog = inject(MatDialog);
  private readonly breakpoints = inject(BreakpointObserver);

  async openDialog(): Promise<void> {
    const isXSmall = (await firstValueFrom(this.breakpoints.observe(Breakpoints.XSmall))).matches;

    this.dialog.open(RecruiterGuideDialog, {
      maxWidth: isXSmall ? '100vw' : '900px',
      width: '100%',
      ...(isXSmall && { panelClass: 'recruiter-dialog-fullscreen' }),
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }
}
