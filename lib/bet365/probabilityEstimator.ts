import type { OddsApiOutcome } from "@/types/theOddsApi";
import type { PoissonProbabilities } from "@/types/football";

export interface ProbabilityEstimateContext {
  homeTeamName: string;
  awayTeamName: string;
  poisson: PoissonProbabilities;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);

  return left === right || left.includes(right) || right.includes(left);
}

function deviggedProbability(
  outcomes: OddsApiOutcome[],
  target: OddsApiOutcome,
): number {
  const implied = outcomes.map((outcome) => 1 / outcome.price);
  const total = implied.reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    return 0;
  }

  const index = outcomes.findIndex((outcome) => outcome === target);

  if (index < 0) {
    return 0;
  }

  return Number(((implied[index] / total) * 100).toFixed(1));
}

function estimateHalfFactor(): number {
  return 0.48;
}

function estimateOverUnderFromLine(
  overProbabilityAtReference: number,
  referenceLine: number,
  targetLine: number,
): number {
  const lineDiff = targetLine - referenceLine;
  const adjustment = lineDiff * 8;

  return Number(Math.max(5, Math.min(95, overProbabilityAtReference - adjustment)).toFixed(1));
}

export function estimateBothTeamsScore(poisson: PoissonProbabilities): number {
  const homeScores = poisson.matchResult1X2.home + poisson.matchResult1X2.draw * 0.35;
  const awayScores = poisson.matchResult1X2.away + poisson.matchResult1X2.draw * 0.35;

  return Number(Math.min(92, (homeScores * awayScores) / 55).toFixed(1));
}

export function estimateSelectionProbability(
  marketKey: string,
  outcome: OddsApiOutcome,
  marketOutcomes: OddsApiOutcome[],
  context: ProbabilityEstimateContext,
): number {
  const { homeTeamName, awayTeamName, poisson } = context;
  const name = outcome.name;
  const point = outcome.point;
  const halfFactor = estimateHalfFactor();

  if (marketKey === "h2h" || marketKey === "h2h_3_way") {
    if (namesMatch(name, homeTeamName)) {
      return poisson.matchResult1X2.home;
    }

    if (namesMatch(name, awayTeamName)) {
      return poisson.matchResult1X2.away;
    }

    if (normalizeName(name).includes("draw") || normalizeName(name) === "empate") {
      return poisson.matchResult1X2.draw;
    }
  }

  if (marketKey === "draw_no_bet") {
    if (namesMatch(name, homeTeamName)) {
      const total = poisson.matchResult1X2.home + poisson.matchResult1X2.away;

      return total > 0
        ? Number(((poisson.matchResult1X2.home / total) * 100).toFixed(1))
        : 50;
    }

    if (namesMatch(name, awayTeamName)) {
      const total = poisson.matchResult1X2.home + poisson.matchResult1X2.away;

      return total > 0
        ? Number(((poisson.matchResult1X2.away / total) * 100).toFixed(1))
        : 50;
    }
  }

  if (marketKey === "double_chance" || marketKey === "double_chance_h1") {
    const factor = marketKey.endsWith("_h1") ? halfFactor : 1;
    const home = poisson.matchResult1X2.home * factor;
    const draw = poisson.matchResult1X2.draw * factor;
    const away = poisson.matchResult1X2.away * factor;
    const normalized = normalizeName(name);
    const homeNorm = normalizeName(homeTeamName);
    const awayNorm = normalizeName(awayTeamName);

    if (
      normalized.includes("draw") &&
      (normalized.includes(homeNorm) || namesMatch(name, homeTeamName))
    ) {
      return Number(Math.min(95, home + draw).toFixed(1));
    }

    if (
      normalized.includes("draw") &&
      (normalized.includes(awayNorm) || namesMatch(name, awayTeamName))
    ) {
      return Number(Math.min(95, away + draw).toFixed(1));
    }

    if (
      normalized.includes(homeNorm) &&
      normalized.includes(awayNorm)
    ) {
      return Number(Math.min(95, home + away).toFixed(1));
    }

    if (normalized.includes("home") && normalized.includes("draw")) {
      return Number(Math.min(95, home + draw).toFixed(1));
    }

    if (normalized.includes("away") && normalized.includes("draw")) {
      return Number(Math.min(95, away + draw).toFixed(1));
    }

    if (normalized.includes("home") && normalized.includes("away")) {
      return Number(Math.min(95, home + away).toFixed(1));
    }
  }

  if (
    marketKey === "totals" ||
    marketKey === "alternate_totals" ||
    marketKey === "team_totals" ||
    marketKey === "alternate_team_totals"
  ) {
    const referenceLine = 2.5;
    const line = point ?? referenceLine;
    const baseOver = poisson.goalsOverUnder25.over;
    const isOver = normalizeName(name).includes("over") || normalizeName(name) === "mas";

    const estimatedOver = estimateOverUnderFromLine(baseOver, referenceLine, line);

    return isOver ? estimatedOver : Number((100 - estimatedOver).toFixed(1));
  }

  if (marketKey === "btts" || marketKey === "btts_h1") {
    const yesProbability = estimateBothTeamsScore(poisson);
    const adjusted =
      marketKey === "btts_h1" ? yesProbability * halfFactor : yesProbability;
    const isYes =
      normalizeName(name) === "yes" || normalizeName(name) === "si";

    return isYes ? Number(adjusted.toFixed(1)) : Number((100 - adjusted).toFixed(1));
  }

  if (
    marketKey.includes("totals_h") ||
    marketKey.includes("alternate_totals_h")
  ) {
    const line = point ?? 1.5;
    const baseOver = poisson.goalsOverUnder25.over * halfFactor;
    const isOver = normalizeName(name).includes("over");
    const estimatedOver = estimateOverUnderFromLine(baseOver, 1.25, line);

    return isOver ? estimatedOver : Number((100 - estimatedOver).toFixed(1));
  }

  if (marketKey.includes("h2h_h") || marketKey.includes("h2h_3_way_h")) {
    const factor = halfFactor;

    if (namesMatch(name, homeTeamName)) {
      return Number((poisson.matchResult1X2.home * factor).toFixed(1));
    }

    if (namesMatch(name, awayTeamName)) {
      return Number((poisson.matchResult1X2.away * factor).toFixed(1));
    }

    if (normalizeName(name).includes("draw")) {
      return Number((poisson.matchResult1X2.draw * factor).toFixed(1));
    }
  }

  if (
    marketKey.includes("corners") ||
    marketKey === "corners_1x2"
  ) {
    const line = point ?? 9.5;
    const baseOver = poisson.cornersOverUnder95.over;
    const isOver = normalizeName(name).includes("over");

    if (marketKey === "corners_1x2") {
      if (namesMatch(name, homeTeamName)) {
        return Number((45 + (poisson.cornersOverUnder95.over - 50) * 0.3).toFixed(1));
      }

      if (namesMatch(name, awayTeamName)) {
        return Number((35 + (poisson.cornersOverUnder95.under - 50) * 0.2).toFixed(1));
      }

      if (normalizeName(name).includes("draw")) {
        return 20;
      }
    }

    const estimatedOver = estimateOverUnderFromLine(baseOver, 9.5, line);

    return isOver ? estimatedOver : Number((100 - estimatedOver).toFixed(1));
  }

  if (marketKey.includes("cards")) {
    const line = point ?? 4.5;
    const baseOver = 52;
    const isOver = normalizeName(name).includes("over");
    const estimatedOver = estimateOverUnderFromLine(baseOver, 4.5, line);

    return isOver ? estimatedOver : Number((100 - estimatedOver).toFixed(1));
  }

  if (marketKey.startsWith("player_")) {
    const implied = deviggedProbability(marketOutcomes, outcome);

    return Number((implied * 0.92).toFixed(1));
  }

  return deviggedProbability(marketOutcomes, outcome);
}
