import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Jeu } from '../../shared/models/jeu.model';
import {
  CUTOFF_MARGIN_MIN,
  GrilleDraft,
  GrilleLocalState,
  isGrilleComplete,
  MAX_GRILLES,
  PlayPayload,
  Tirage,
} from '../../shared/models/grille.model';
import { JeuStore } from '../../shared/stores/jeu.store';
import { TirageService } from '../../shared/services/tirage.service';
import { PartieService } from '../../shared/services/partie.service';
import { FlashService } from '../../shared/services/flash.service';
import { ToastService } from '../../shared/services/toast.service';
import { ApiError } from '../../core/errors/api-error';
import { GrilleCard } from './grille-card/grille-card';

/** Étape de révélation d'un numéro pendant l'animation de flash. */
interface RevealStep {
  grilleId: string;
  kind: 'numero' | 'chance';
  value: number;
}

/** Fenêtre, en ms, pendant laquelle le compte à rebours s'affiche avant le cutoff. */
const COUNTDOWN_WINDOW_MS = 60 * 60 * 1000;

/** Période de rafraîchissement de l'horloge locale (cutoff / compte à rebours). */
const CLOCK_TICK_MS = 30 * 1000;

@Component({
  selector: 'app-grille',
  imports: [GrilleCard],
  templateUrl: './grille.html',
  styleUrl: './grille.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Grille implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly jeuStore = inject(JeuStore);
  private readonly tirageService = inject(TirageService);
  private readonly partieService = inject(PartieService);
  private readonly flashService = inject(FlashService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  /** Délai entre deux numéros allumés pendant l'animation (ms). */
  private readonly animationIntervalMs = 150;

  /** Timer de l'animation en cours, pour pouvoir l'arrêter/nettoyer. */
  private animationTimer: ReturnType<typeof setInterval> | null = null;

  /** Horloge locale (cutoff / compte à rebours), rafraîchie toutes les 30 s. */
  private clockTimer: ReturnType<typeof setInterval> | null = null;

  /** Id du tirage déjà rechargé après son heure, pour ne pas spammer une fois remplacé. */
  private reloadedAtDrawFor: number | null = null;

  /** Rechargement post-tirage en cours, pour ne pas empiler les requêtes. */
  private reloadInFlight = false;

  readonly jeu = signal<Jeu | null>(null);
  readonly tirage = signal<Tirage | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  /** Horodatage courant (ms) ; piloté par `clockTimer` côté navigateur. */
  readonly now = signal<number>(Date.now());

  /** Soumission en cours : verrouille le bouton « Valider ». */
  readonly submitting = signal<boolean>(false);

  /** Message d'erreur de soumission affiché en tête de page ; null si aucun. */
  readonly submitError = signal<string | null>(null);

  /** Liste des grilles composées simultanément ; une grille vide au départ. */
  readonly grilles = signal<GrilleLocalState[]>([this.emptyGrille()]);

  /** Identifiant du tirage en cours, conservé pour la soumission (LF-31). */
  readonly tirageId = computed<number | null>(() => this.tirage()?.id ?? null);

  /** Nombre de flashs saisi ; `NaN` quand la saisie est vide ou non numérique. */
  readonly flashCount = signal<number>(1);

  /** Animation de flash en cours : verrouille les grilles et la barre de flash. */
  readonly animating = signal<boolean>(false);

  /** Heure (ms) du tirage en cours, ou `null`. */
  private readonly drawAt = computed<number | null>(() => {
    const tirage = this.tirage();
    return tirage ? new Date(tirage.dateTirage).getTime() : null;
  });

  /** Heure limite de saisie (ms) = heure du tirage − marge de cutoff. */
  private readonly cutoffAt = computed<number | null>(() => {
    const draw = this.drawAt();
    return draw === null ? null : draw - CUTOFF_MARGIN_MIN * 60 * 1000;
  });

  /**
   * La saisie est fermée dès que le cutoff est franchi, et le reste tant que ce
   * tirage n'est pas remplacé par le suivant (cf. `maybeReloadAfterDraw`). Sans
   * borne supérieure : passé l'heure du tirage, on ne doit pas rouvrir la saisie
   * sur un tirage déjà tiré si le rechargement tarde ou échoue.
   */
  readonly closed = computed<boolean>(() => {
    const cutoff = this.cutoffAt();
    return cutoff !== null && this.now() >= cutoff;
  });

  /** Les grilles sont désactivées sans tirage en cours ou une fois le cutoff franchi. */
  readonly disabled = computed<boolean>(() => this.tirage() === null || this.closed());

  /** Heure limite affichée en tête de page, ex. « Saisie possible jusqu'à 19h54. ». */
  readonly cutoffLabel = computed<string | null>(() => {
    const cutoff = this.cutoffAt();
    return cutoff === null ? null : `Saisie possible jusqu'à ${this.formatParisTime(cutoff)}.`;
  });

  /** Compte à rebours discret dans la dernière heure avant le cutoff ; null sinon. */
  readonly countdownLabel = computed<string | null>(() => {
    const cutoff = this.cutoffAt();
    if (cutoff === null) {
      return null;
    }
    const remaining = cutoff - this.now();
    if (remaining <= 0 || remaining > COUNTDOWN_WINDOW_MS) {
      return null;
    }
    return `Il vous reste ${Math.ceil(remaining / (60 * 1000))} min`;
  });

  /** Saisie de flash invalide (hors 1..5 ou non entière). */
  readonly flashCountInvalid = computed<boolean>(() => {
    const n = this.flashCount();
    return !Number.isInteger(n) || n < 1 || n > MAX_GRILLES;
  });

  /** Message d'erreur sous le champ ; null tant que la saisie est valide. */
  readonly flashError = computed<string | null>(() =>
    this.flashCountInvalid() ? `Maximum ${MAX_GRILLES} flashs autorisés` : null,
  );

  /** Le flash est possible : saisie valide, tirage en cours, pas d'animation. */
  readonly canFlash = computed<boolean>(
    () => !this.flashCountInvalid() && !this.disabled() && !this.animating(),
  );

  /** On peut ajouter une grille tant qu'on est sous le plafond front (5). */
  readonly canAddGrille = computed<boolean>(() => this.grilles().length < MAX_GRILLES);

  /** On ne peut pas supprimer la dernière grille restante. */
  readonly canRemoveGrille = computed<boolean>(() => this.grilles().length > 1);

  /** Toutes les grilles sont complètes (quotas du jeu atteints partout). */
  readonly allComplete = computed<boolean>(() => {
    const jeu = this.jeu();
    if (!jeu) {
      return false;
    }
    const list = this.grilles();
    return list.length > 0 && list.every((g) => isGrilleComplete(g, jeu));
  });

  /** « Valider » est actif quand tout est complet et que rien ne bloque la page. */
  readonly canSubmit = computed<boolean>(
    () => this.allComplete() && !this.disabled() && !this.animating() && !this.submitting(),
  );

  /** Invite à compléter, tant que la page est active mais qu'une grille manque. */
  readonly submitHint = computed<string | null>(() =>
    !this.disabled() && !this.allComplete()
      ? 'Complétez toutes vos grilles pour valider'
      : null,
  );

  /** Libellé du tirage en cours, ex. « Tirage du 11 mai 2026 à 20h00 » (heure de Paris). */
  readonly tirageLabel = computed<string | null>(() => {
    const tirage = this.tirage();
    if (!tirage) {
      return null;
    }
    const date = new Date(tirage.dateTirage);
    const jour = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return `Tirage du ${jour} à ${this.formatParisTime(date.getTime())}`;
  });

  /** Formate un horodatage (ms) en heure de Paris, ex. « 19h54 ». */
  private formatParisTime(ms: number): string {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(ms))
      .replace(':', 'h');
  }

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('Jeu introuvable');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const [jeu, tirage] = await Promise.all([
        this.loadJeu(id),
        this.tirageService.getCurrentTirage(id),
      ]);
      this.jeu.set(jeu);
      this.tirage.set(tirage);
    } catch {
      this.error.set('Impossible de charger le jeu');
    } finally {
      this.loading.set(false);
    }

    this.startClock();
  }

  /**
   * Démarre l'horloge locale (cutoff / compte à rebours), rafraîchie toutes les
   * 30 s. Inerte au rendu serveur (pas de timer ni de polling côté SSR).
   */
  private startClock(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.tick();
    // Hors zone Angular : un timer périodique dans la zone empêcherait toute
    // stabilisation (tests `whenStable`, SSR). L'écriture du signal `now`
    // déclenche malgré tout la détection de changement (signaux Angular 21).
    this.zone.runOutsideAngular(() => {
      this.clockTimer = setInterval(() => this.tick(), CLOCK_TICK_MS);
    });
  }

  /** Met l'horloge à jour et recharge le tirage une fois son heure passée. */
  private tick(): void {
    this.now.set(Date.now());
    void this.maybeReloadAfterDraw();
  }

  /**
   * Après l'heure du tirage (≥ 20h), recharge le tirage en cours pour basculer
   * sur celui du lendemain dès qu'il est créé. Pendant la fenêtre de cutoff
   * (19h54→20h) le blocage reste local (MEMO §3). On ne marque le tirage comme
   * rechargé qu'en cas de succès : un échec réseau est réessayé au tick suivant,
   * et `closed()` garde la saisie fermée tant que ce tirage n'est pas remplacé.
   */
  private async maybeReloadAfterDraw(): Promise<void> {
    const tirage = this.tirage();
    const draw = this.drawAt();
    if (!tirage || draw === null || this.now() < draw) {
      return;
    }
    if (this.reloadedAtDrawFor === tirage.id || this.reloadInFlight) {
      return;
    }
    this.reloadInFlight = true;
    try {
      const next = await this.tirageService.getCurrentTirage(tirage.jeuId);
      this.reloadedAtDrawFor = tirage.id;
      this.tirage.set(next);
    } catch {
      // Échec réseau : on réessaiera au prochain tick ; la saisie reste fermée.
    } finally {
      this.reloadInFlight = false;
    }
  }

  private async loadJeu(id: number): Promise<Jeu> {
    // Au refresh direct, le store n'est pas encore peuplé (le Layout charge la
    // liste de façon asynchrone). On s'appuie sur l'endpoint liste `GET /jeux`
    // — le back n'expose pas `GET /jeux/:id` — pour retrouver le jeu par id.
    let jeu = this.jeuStore.jeux().find((j) => j.id === id);
    if (!jeu) {
      await this.jeuStore.loadJeux();
      jeu = this.jeuStore.jeux().find((j) => j.id === id);
    }
    if (!jeu) {
      throw new Error('Jeu introuvable');
    }
    this.jeuStore.selectJeu(jeu);
    return jeu;
  }

  /** Ajoute une grille vide ; sans effet si le plafond front est atteint. */
  addGrille(): void {
    if (!this.canAddGrille()) {
      return;
    }
    this.grilles.update((list) => [...list, this.emptyGrille()]);
  }

  /** Supprime une grille ; sans effet s'il ne reste qu'une seule grille. */
  removeGrille(id: string): void {
    if (!this.canRemoveGrille()) {
      return;
    }
    this.grilles.update((list) => list.filter((g) => g.id !== id));
  }

  toggleNumero(grilleId: string, n: number): void {
    if (this.disabled()) {
      return;
    }
    const max = this.jeu()?.nbNumerosATirer ?? 0;
    this.grilles.update((list) =>
      list.map((g) =>
        g.id === grilleId
          ? { ...g, selectedNumeros: this.toggleWithCap(g.selectedNumeros, n, max) }
          : g,
      ),
    );
  }

  toggleNumeroChance(grilleId: string, n: number): void {
    if (this.disabled()) {
      return;
    }
    const max = this.jeu()?.nbNumeroChanceATirer ?? 0;
    this.grilles.update((list) =>
      list.map((g) =>
        g.id === grilleId
          ? { ...g, selectedNumeroChance: this.toggleWithCap(g.selectedNumeroChance, n, max) }
          : g,
      ),
    );
  }

  /** Validité d'une grille (domaine) ; réutilisée pour la soumission (LF-31). */
  isComplete(grille: GrilleLocalState): boolean {
    const jeu = this.jeu();
    return jeu ? isGrilleComplete(grille, jeu) : false;
  }

  /** Ajoute/retire `n` de la liste en respectant le plafond `max`. */
  private toggleWithCap(current: number[], n: number, max: number): number[] {
    if (current.includes(n)) {
      return current.filter((x) => x !== n);
    }
    if (current.length >= max) {
      return current;
    }
    return [...current, n];
  }

  /** Relaie l'événement `input` du champ number vers `setFlashCount`. */
  onFlashCountInput(event: Event): void {
    this.setFlashCount((event.target as HTMLInputElement).value);
  }

  /** Met à jour le nombre de flashs depuis la saisie brute du champ number. */
  setFlashCount(value: string): void {
    this.flashCount.set(value.trim() === '' ? NaN : Number(value));
  }

  /**
   * Écrase tout l'état courant et flashe N grilles : tire N grilles uniques
   * puis lance l'animation de remplissage numéro par numéro.
   */
  flash(): void {
    const jeu = this.jeu();
    if (!this.canFlash() || !jeu) {
      return;
    }

    this.stopAnimation();

    // N grilles vides : l'animation les remplit ensuite, ce qui efface de fait
    // toute sélection précédente (écrasement complet de l'état).
    const drafts = this.flashService.flashGrilles(jeu, this.flashCount());
    const fresh = drafts.map(() => this.emptyGrille());
    this.grilles.set(fresh);

    this.startAnimation(fresh.map((g, i) => ({ id: g.id, draft: drafts[i] })));
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    if (this.clockTimer !== null) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  /**
   * Soumet toutes les grilles en un seul `POST /api/parties` (LF-31).
   * Succès → toast + réinitialisation à une grille vide (on reste sur la page).
   * Échec → message mappé en tête de page, sans réinitialiser (l'utilisateur
   * garde ses grilles pour corriger).
   */
  async submit(): Promise<void> {
    const tirageId = this.tirageId();
    if (!this.canSubmit() || tirageId === null) {
      return;
    }

    const payload: PlayPayload = {
      tirageId,
      grilles: this.grilles().map((g) => ({
        numeros: g.selectedNumeros,
        numeroChance: g.selectedNumeroChance,
      })),
    };

    this.submitError.set(null);
    this.submitting.set(true);
    try {
      await this.partieService.playGrilles(payload);
      this.toast.success('Grille(s) enregistrée(s) avec succès');
      this.resetComposition();
    } catch (error) {
      this.submitError.set(this.mapSubmitError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  /** Remet la page à son état initial : une grille vide, un flash, animation arrêtée. */
  private resetComposition(): void {
    this.stopAnimation();
    this.grilles.set([this.emptyGrille()]);
    this.flashCount.set(1);
    this.submitError.set(null);
  }

  /** Mappe une erreur back (`ApiError.code`) vers un message utilisateur (MEMO §2). */
  private mapSubmitError(error: unknown): string {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'INVALID_PAYLOAD':
          return 'Données invalides, vérifiez vos grilles.';
        case 'INVALID_GRILLE':
          return 'Une de vos grilles est invalide (ou deux grilles sont identiques).';
        case 'TIRAGE_NOT_FOUND':
          return "Le tirage n'est plus disponible, rechargez la page.";
        case 'CUTOFF_PASSED':
          return 'La saisie est fermée pour ce tirage.';
      }
    }
    // 500 (corps `{ error }`, sans `code`) et cas imprévus.
    return 'Une erreur est survenue, réessayez plus tard.';
  }

  /**
   * Lance l'animation parallèle : à chaque tick, chaque grille révèle son
   * numéro suivant (numéros principaux puis numéros chance). Les grilles
   * progressent ensemble ; l'animation s'arrête quand toutes sont complètes.
   */
  private startAnimation(targets: Array<{ id: string; draft: GrilleDraft }>): void {
    const sequences = new Map<string, RevealStep[]>(
      targets.map(({ id, draft }) => [
        id,
        [
          ...draft.numeros.map((value): RevealStep => ({ grilleId: id, kind: 'numero', value })),
          ...draft.numeroChance.map(
            (value): RevealStep => ({ grilleId: id, kind: 'chance', value }),
          ),
        ],
      ]),
    );

    const maxLength = Math.max(0, ...[...sequences.values()].map((s) => s.length));
    if (maxLength === 0) {
      return;
    }

    this.animating.set(true);
    let step = 0;

    this.animationTimer = setInterval(() => {
      const reveals = [...sequences.values()]
        .map((s) => s[step])
        .filter((s): s is RevealStep => s !== undefined);
      this.applyReveals(reveals);

      step++;
      if (step >= maxLength) {
        this.stopAnimation();
      }
    }, this.animationIntervalMs);
  }

  /** Applique une vague de révélations (une par grille) en une seule mise à jour. */
  private applyReveals(reveals: RevealStep[]): void {
    if (reveals.length === 0) {
      return;
    }
    const byGrille = new Map<string, RevealStep>(reveals.map((r) => [r.grilleId, r]));
    this.grilles.update((list) =>
      list.map((g) => {
        const reveal = byGrille.get(g.id);
        if (!reveal) {
          return g;
        }
        return reveal.kind === 'numero'
          ? { ...g, selectedNumeros: [...g.selectedNumeros, reveal.value] }
          : { ...g, selectedNumeroChance: [...g.selectedNumeroChance, reveal.value] };
      }),
    );
  }

  /** Stoppe l'animation en cours (le cas échéant) et déverrouille l'UI. */
  private stopAnimation(): void {
    if (this.animationTimer !== null) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
    this.animating.set(false);
  }

  private emptyGrille(): GrilleLocalState {
    return { id: crypto.randomUUID(), selectedNumeros: [], selectedNumeroChance: [] };
  }
}
