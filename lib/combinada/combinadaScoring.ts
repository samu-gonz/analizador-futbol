import {
  MIN_VALUE_EDGE_PERCENT,
  type ValueEdgeDisplay,
  type ValueEdgeTier,
} from "@/lib/valueBetting";

/** Probabilidad mínima por pierna: evita acumular largos improbables. */
export const MIN_LEG_PROBABILITY_PERCENT = 25;

/** Cuota máxima por pierna: solo favoritos / selecciones sólidas. */
export const MAX_LEG_ODD = 3.2;

/** Rango de cuota combinada buscado (tipo 3–5, alguna hasta 10). */
export const MIN_COMBINED_ODD = 3;
export const MAX_COMBINED_ODD = 12;
export const IDEAL_COMBINED_ODD = 5;

export function isReasonableCombinadaOdd(combinedOdd: number): boolean {
  return combinedOdd >= MIN_COMBINED_ODD && combinedOdd <= MAX_COMBINED_ODD;
}

/** Mayor puntuación cuanto más cerca de ~5.0 (zona 3–8). */
export function combinedOddFitScore(combinedOdd: number): number {
  if (!isReasonableCombinadaOdd(combinedOdd)) {
    return 0;
  }

  const distance = Math.abs(combinedOdd - IDEAL_COMBINED_ODD);

  return Math.max(0, Number((10 - distance * 1.4).toFixed(2)));
}

/** Probabilidad conjunta mínima según número de selecciones. */
export function getMinCombinedProbability(legCount: number): number {
  if (legCount <= 2) {
    return 5;
  }

  return 2.5;
}

/** Umbral de prob. conjunta para etiquetar como valor alto. */
function getHighProbabilityThreshold(legCount: number): number {
  return legCount === 2 ? 10 : 6;
}

/** Umbral de prob. conjunta para etiquetar como valor sólido. */
function getGoodProbabilityThreshold(legCount: number): number {
  return legCount === 2 ? 6 : 3.5;
}

/**
 * Puntuación de viabilidad: equilibra ventaja (EV) con probabilidad de acierto.
 * Una combinada con +8% pero 1% de prob. queda por debajo de una con +3% y 12%.
 */
export function calculateCombinadaViabilityScore(
  combinedValuePercent: number,
  combinedModelProbability: number,
  combinedOdd: number,
): number {
  if (combinedModelProbability <= 0) {
    return 0;
  }

  const oddFit = combinedOddFitScore(combinedOdd);

  if (oddFit <= 0) {
    return 0;
  }

  const probabilityFactor = Math.sqrt(combinedModelProbability / 100);

  return Number(
    ((combinedValuePercent * probabilityFactor * oddFit) / 10).toFixed(3),
  );
}

export function formatHitFrequency(probabilityPercent: number): string {
  if (probabilityPercent <= 0) {
    return "—";
  }

  const oneIn = Math.round(100 / probabilityPercent);

  if (oneIn <= 1) {
    return "muy frecuente según el modelo";
  }

  return `~1 de cada ${oneIn}`;
}

/**
 * Semáforo de combinada: exige ventaja Y probabilidad conjunta razonable
 * para marcar valor alto; si no, degrada a teórico/especulativo.
 */
export function formatCombinadaEdge(
  combinedValuePercent: number,
  combinedModelProbability: number,
  legCount: number,
): ValueEdgeDisplay {
  const minCombined = getMinCombinedProbability(legCount);
  const highProb = getHighProbabilityThreshold(legCount);
  const goodProb = getGoodProbabilityThreshold(legCount);

  if (combinedModelProbability < minCombined) {
    return {
      label: `Baja probabilidad (${combinedModelProbability}%)`,
      tier: "avoid",
      valuePercent: combinedValuePercent,
      isHighlight: false,
    };
  }

  if (
    combinedValuePercent > 5 &&
    combinedModelProbability >= highProb
  ) {
    return {
      label: `🔥 Valor Alto (+${combinedValuePercent.toFixed(1)}%) · ${combinedModelProbability}% prob.`,
      tier: "high",
      valuePercent: combinedValuePercent,
      isHighlight: true,
    };
  }

  if (
    combinedValuePercent >= MIN_VALUE_EDGE_PERCENT &&
    combinedModelProbability >= goodProb
  ) {
    return {
      label: `👍 Valor (+${combinedValuePercent.toFixed(1)}%) · ${combinedModelProbability}% prob.`,
      tier: "good",
      valuePercent: combinedValuePercent,
      isHighlight: true,
    };
  }

  if (combinedValuePercent >= MIN_VALUE_EDGE_PERCENT) {
    return {
      label: `⚠️ Valor teórico (+${combinedValuePercent.toFixed(1)}%) · ${combinedModelProbability}% prob.`,
      tier: "none",
      valuePercent: combinedValuePercent,
      isHighlight: false,
    };
  }

  return {
    label: "Sin valor",
    tier: "none",
    valuePercent: combinedValuePercent,
    isHighlight: false,
  };
}

export function getProbabilityTone(
  combinedModelProbability: number,
  legCount: number,
): "strong" | "moderate" | "low" {
  if (combinedModelProbability >= getGoodProbabilityThreshold(legCount)) {
    return "strong";
  }

  if (combinedModelProbability >= getMinCombinedProbability(legCount)) {
    return "moderate";
  }

  return "low";
}

export function tierBorderClass(tier: ValueEdgeTier): string {
  if (tier === "high") {
    return "border-emerald-300/40 bg-emerald-500/20 text-emerald-200";
  }

  if (tier === "good") {
    return "border-sky-400/35 bg-sky-500/15 text-sky-100";
  }

  if (tier === "avoid") {
    return "border-rose-400/35 bg-rose-500/10 text-rose-200";
  }

  return "border-amber-400/35 bg-amber-500/10 text-amber-100";
}
