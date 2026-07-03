import {
  MAX_LEG_ODD,
  MIN_LEG_PROBABILITY_PERCENT,
  calculateCombinadaViabilityScore,
  getMinCombinedProbability,
  isReasonableCombinadaOdd,
} from "@/lib/combinada/combinadaScoring";
import {
  MIN_VALUE_EDGE_PERCENT,
  calculateValuePercent,
} from "@/lib/valueBetting";
import type { Bet365MarketSelection } from "@/types/bet365Markets";
import type { CombinadaLeg, ValueCombinada } from "@/types/combinada";

export interface CombinadaLegPool {
  matchId: string;
  matchLabel: string;
  kickoffIso: string;
  selections: Bet365MarketSelection[];
}

function toLeg(
  pool: CombinadaLegPool,
  selection: Bet365MarketSelection,
): CombinadaLeg {
  return {
    matchId: pool.matchId,
    matchLabel: pool.matchLabel,
    kickoffIso: pool.kickoffIso,
    marketKey: selection.marketKey,
    marketName: selection.marketName,
    selectionName: selection.selectionName,
    decimalOdd: selection.decimalOdd,
    estimatedProbability: selection.estimatedProbability,
    valuePercent: selection.valuePercent,
  };
}

function getValueSelections(pool: CombinadaLegPool): CombinadaLeg[] {
  const byMarket = new Map<string, CombinadaLeg>();

  for (const selection of pool.selections) {
    if (
      selection.decimalOdd > MAX_LEG_ODD ||
      selection.estimatedProbability < MIN_LEG_PROBABILITY_PERCENT ||
      (!selection.hasValue && selection.valuePercent < MIN_VALUE_EDGE_PERCENT)
    ) {
      continue;
    }

    const leg = toLeg(pool, selection);
    const existing = byMarket.get(selection.marketKey);

    if (!existing || leg.valuePercent > existing.valuePercent) {
      byMarket.set(selection.marketKey, leg);
    }
  }

  return Array.from(byMarket.values()).sort(
    (left, right) => right.valuePercent - left.valuePercent,
  );
}

function legsConflict(left: CombinadaLeg, right: CombinadaLeg): boolean {
  if (left.matchId !== right.matchId) {
    return false;
  }

  return left.marketKey === right.marketKey;
}

function isValidCombination(legs: CombinadaLeg[]): boolean {
  for (let index = 0; index < legs.length; index += 1) {
    for (let other = index + 1; other < legs.length; other += 1) {
      if (legsConflict(legs[index], legs[other])) {
        return false;
      }
    }
  }

  return true;
}

function buildCombinadaFromLegs(legs: CombinadaLeg[]): ValueCombinada | null {
  if (!isValidCombination(legs) || legs.length < 2) {
    return null;
  }

  const combinedOdd = Number(
    legs.reduce((product, leg) => product * leg.decimalOdd, 1).toFixed(2),
  );

  const combinedModelProbability = Number(
    (
      legs.reduce(
        (product, leg) => product * (leg.estimatedProbability / 100),
        1,
      ) * 100
    ).toFixed(1),
  );

  const combinedValuePercent = calculateValuePercent(
    combinedOdd,
    combinedModelProbability,
  );

  if (combinedValuePercent < MIN_VALUE_EDGE_PERCENT) {
    return null;
  }

  if (combinedModelProbability < getMinCombinedProbability(legs.length)) {
    return null;
  }

  if (!isReasonableCombinadaOdd(combinedOdd)) {
    return null;
  }

  const viabilityScore = calculateCombinadaViabilityScore(
    combinedValuePercent,
    combinedModelProbability,
    combinedOdd,
  );

  if (viabilityScore <= 0) {
    return null;
  }

  const id = legs
    .map((leg) => `${leg.matchId}:${leg.marketKey}:${leg.selectionName}`)
    .join("|");

  return {
    id,
    legs,
    combinedOdd,
    combinedModelProbability,
    combinedValuePercent,
    viabilityScore,
    stakeReturn10: Number((combinedOdd * 10).toFixed(2)),
  };
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) {
    return [[]];
  }

  if (items.length < size) {
    return [];
  }

  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((group) => [first, ...group]);
  const withoutFirst = combinations(rest, size);

  return [...withFirst, ...withoutFirst];
}

function pickTopPerMatch(
  pools: CombinadaLegPool[],
  limitPerMatch: number,
): CombinadaLeg[] {
  return pools.flatMap((pool) => getValueSelections(pool).slice(0, limitPerMatch));
}

export function buildValueCombinadas(
  pools: CombinadaLegPool[],
  options?: {
    minLegs?: number;
    maxLegs?: number;
    maxResults?: number;
    maxLegsPerMatch?: number;
  },
): ValueCombinada[] {
  const minLegs = options?.minLegs ?? 2;
  const maxLegs = options?.maxLegs ?? 3;
  const maxResults = options?.maxResults ?? 8;
  const maxLegsPerMatch = options?.maxLegsPerMatch ?? 4;

  const valueLegs = pickTopPerMatch(pools, maxLegsPerMatch);

  if (valueLegs.length < minLegs) {
    return [];
  }

  const results = new Map<string, ValueCombinada>();

  for (let legCount = minLegs; legCount <= maxLegs; legCount += 1) {
    for (const group of combinations(valueLegs, legCount)) {
      const combinada = buildCombinadaFromLegs(group);

      if (!combinada) {
        continue;
      }

      const existing = results.get(combinada.id);

      if (!existing || combinada.viabilityScore > existing.viabilityScore) {
        results.set(combinada.id, combinada);
      }
    }
  }

  return Array.from(results.values())
    .sort((left, right) => {
      if (right.viabilityScore !== left.viabilityScore) {
        return right.viabilityScore - left.viabilityScore;
      }

      if (right.combinedModelProbability !== left.combinedModelProbability) {
        return right.combinedModelProbability - left.combinedModelProbability;
      }

      const leftOddDistance = Math.abs(left.combinedOdd - 5);
      const rightOddDistance = Math.abs(right.combinedOdd - 5);

      return leftOddDistance - rightOddDistance;
    })
    .slice(0, maxResults);
}

export function flattenMarketsPayloadToSelections(
  pool: Omit<CombinadaLegPool, "selections"> & {
    tabs: Array<{ groups: Array<{ selections: Bet365MarketSelection[] }> }>;
  },
): CombinadaLegPool {
  const selections = pool.tabs.flatMap((tab) =>
    tab.groups.flatMap((group) => group.selections),
  );

  return {
    matchId: pool.matchId,
    matchLabel: pool.matchLabel,
    kickoffIso: pool.kickoffIso,
    selections,
  };
}
