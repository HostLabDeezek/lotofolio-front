import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe pur qui formate une date ISO 8601 en « Mar. 3 juin — 21h00 »
 * (heure de Paris). Les formateurs `Intl.DateTimeFormat` sont des singletons
 * statiques — instanciés une seule fois pour toute la durée de vie de l'app.
 *
 * Usage : `{{ partie.dateTirage | parisDate }}`
 */
@Pipe({ name: 'parisDate', pure: true, standalone: true })
export class ParisDatePipe implements PipeTransform {
  private static readonly dateFmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

  private static readonly timeFmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  transform(tirageDate: string): string {
    const date = new Date(tirageDate);
    const datePart = ParisDatePipe.dateFmt.format(date);
    const timePart = ParisDatePipe.timeFmt.format(date).replace(':', 'h');
    return `${datePart} — ${timePart}`;
  }
}
