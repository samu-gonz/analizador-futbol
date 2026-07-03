export interface CombinadaLeg {
  matchId: string;
  matchLabel: string;
  kickoffIso: string;
  marketKey: string;
  marketName: string;
  selectionName: string;
  decimalOdd: number;
  estimatedProbability: number;
  valuePercent: number;
}

export interface ValueCombinada {
  id: string;
  legs: CombinadaLeg[];
  combinedOdd: number;
  combinedModelProbability: number;
  combinedValuePercent: number;
  /** Ventaja ajustada por probabilidad de acierto (para ordenar sugerencias). */
  viabilityScore: number;
  stakeReturn10: number;
}
