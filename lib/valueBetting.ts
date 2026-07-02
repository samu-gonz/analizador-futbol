/**
 * Determina si una apuesta tiene valor comparando nuestra probabilidad
 * con la cuota del mercado.
 *
 * Fórmula: si (1 / probabilidad_nuestra) < cuota_mercado → tiene valor.
 */
export function hasBettingValue(
  ourProbabilityPercent: number,
  marketOdd: number,
): boolean {
  if (ourProbabilityPercent <= 0 || marketOdd <= 1) {
    return false;
  }

  const ourProbability = ourProbabilityPercent / 100;
  const fairOdd = 1 / ourProbability;

  return fairOdd < marketOdd;
}

export function calculateFairOdd(ourProbabilityPercent: number): number {
  if (ourProbabilityPercent <= 0) {
    return 0;
  }

  return Number((100 / ourProbabilityPercent).toFixed(2));
}

export function impliedProbabilityFromOdds(decimalOdd: number): number {
  if (decimalOdd <= 1) {
    return 0;
  }

  return Number(((1 / decimalOdd) * 100).toFixed(1));
}

export function calculateValuePercent(
  decimalOdd: number,
  estimatedProbabilityPercent: number,
): number {
  if (decimalOdd <= 1 || estimatedProbabilityPercent <= 0) {
    return 0;
  }

  const estimatedProbability = estimatedProbabilityPercent / 100;

  return Number(((decimalOdd * estimatedProbability - 1) * 100).toFixed(2));
}

/** Ventaja mínima (1 %) para considerar una apuesta con valor. */
export const MIN_VALUE_EDGE_PERCENT = 1;

export function hasValueFromEstimate(
  decimalOdd: number,
  estimatedProbabilityPercent: number,
): boolean {
  return (
    calculateValuePercent(decimalOdd, estimatedProbabilityPercent) >=
    MIN_VALUE_EDGE_PERCENT
  );
}

export type ValueEdgeTier = "high" | "good" | "none" | "avoid";

export interface ValueEdgeDisplay {
  label: string;
  tier: ValueEdgeTier;
  valuePercent: number;
  isHighlight: boolean;
}

/**
 * Semáforo de ventaja para usuarios no técnicos.
 */
export function formatValueEdge(valuePercent: number): ValueEdgeDisplay {
  if (valuePercent > 5) {
    return {
      label: `🔥 Valor Alto (+${valuePercent.toFixed(1)}%)`,
      tier: "high",
      valuePercent,
      isHighlight: true,
    };
  }

  if (valuePercent >= MIN_VALUE_EDGE_PERCENT) {
    return {
      label: `👍 Valor (+${valuePercent.toFixed(1)}%)`,
      tier: "good",
      valuePercent,
      isHighlight: true,
    };
  }

  if (valuePercent < -0.05) {
    return {
      label: "Evitar",
      tier: "avoid",
      valuePercent,
      isHighlight: false,
    };
  }

  return {
    label: "Sin Valor",
    tier: "none",
    valuePercent,
    isHighlight: false,
  };
}
