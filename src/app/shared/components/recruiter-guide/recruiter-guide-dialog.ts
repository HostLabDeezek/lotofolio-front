import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RecruiterStep } from './recruiter-step';

interface DemoAccount {
  role: string;
  email: string;
  username: string;
}

@Component({
  selector: 'app-recruiter-guide-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RecruiterStep,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recruiter-guide-dialog.html',
  styleUrl: './recruiter-guide-dialog.scss',
})
export class RecruiterGuideDialog {
  private readonly dialogRef = inject(MatDialogRef<RecruiterGuideDialog>);

  protected readonly demoAccount: DemoAccount = {
    role: 'USER',
    email: 'user@lotofolio.fr',
    username: 'Maxime Dupuis',
  };

  protected readonly demoPassword = 'Password1!';

  protected readonly contact = {
    email: 'simon.pere@live.fr',
    linkedin: 'https://www.linkedin.com/in/simon-pere-6430331b8/',
    githubFront: 'https://github.com/HostLabDeezek/lotofolio-front',
    githubBack: 'https://github.com/HostLabDeezek/lotofolio-back',
  };

  protected close(): void {
    this.dialogRef.close();
  }
}
