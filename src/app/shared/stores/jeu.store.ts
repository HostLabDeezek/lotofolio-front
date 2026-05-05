// stores/jeu.store.ts
import { inject } from '@angular/core';
import { signalStore, withState, withMethods } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';
import { Jeu } from '../models/jeu.model';
import { JeuService } from '../services/jeu.service';

export interface JeuState {
    jeux: Jeu[];
    selectedJeu: Jeu | null;
    loading: boolean;
    error: string | null;
}

export const JeuStore = signalStore(
    { providedIn: 'root' },

    // ✅ État initial
    withState<JeuState>({
        jeux: [],
        selectedJeu: null,
        loading: false,
        error: null
    }),

    // ✅ Méthodes
    withMethods((store) => {
        const jeuService: JeuService = inject(JeuService);

        return {

            async loadJeux() {
                patchState(store, { loading: true, error: null });

                try {
                    const jeux = await jeuService.getJeux();
                    patchState(store, { jeux, loading: false });
                } catch (error: any) {
                    patchState(store, {
                        error: error.message || 'Erreur chargement jeux',
                        loading: false
                    });
                }
            },

            selectJeu(jeu: Jeu) {
                patchState(store, { selectedJeu: jeu });
            },

            clearSelected() {
                patchState(store, { selectedJeu: null });
            }

        };
    })
);
