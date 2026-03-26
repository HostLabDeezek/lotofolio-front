export interface Jeu {
    id: number;
    nom: string;
    description: string | null;
    regle: string | null;
    maxNumeroChance: number;
    maxNumeros: number;
    nbNumeroChance: number;
    nbNumeros: number;
}