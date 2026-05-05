export interface Jeu {
    id: number;
    nom: string;
    description: string | null;
    regle: string | null;
    intervalNumeroChance: number;
    intervalNumero: number;
    nbNumeroChanceATirer: number;
    nbNumerosATirer: number;
}