import { calculateFairOdd, hasBettingValue } from "@/lib/valueBetting";
import { calculatePoissonProbability } from "@/services/predictionEngine";
import type {
  LiveMatch,
  LiveOdds,
  LivePredictions,
} from "@/types/liveMatch";

export const LIVE_POLL_INTERVAL_MS = 15_000;

const MATCH_DURATION_MINUTES = 90;
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}


function getRemainingMinutes(match: LiveMatch): number {
  if (match.period === "HT") {
    return 45;
  }

  return clamp(MATCH_DURATION_MINUTES - match.minute, 0, MATCH_DURATION_MINUTES);
}

function getScoreDifferential(match: LiveMatch): number {
  return match.score.home - match.score.away;
}

function getTimePressureFactor(match: LiveMatch): number {
  const remaining = getRemainingMinutes(match);
  return 1 - remaining / MATCH_DURATION_MINUTES;
}

function adjust1X2Probabilities(
  match: LiveMatch,
  base: { home: number; draw: number; away: number },
): { home: number; draw: number; away: number } {
  const remaining = getRemainingMinutes(match);
  const remainingWeight = remaining / MATCH_DURATION_MINUTES;
  const pressure = getTimePressureFactor(match);
  const diff = getScoreDifferential(match);

  let home = base.home;
  let draw = base.draw;
  let away = base.away;

  if (diff > 0) {
    const boost = clamp(diff * 12 * pressure, 0, 35);
    home += boost;
    draw -= boost * 0.55;
    away -= boost * 0.45;
  } else if (diff < 0) {
    const boost = clamp(Math.abs(diff) * 12 * pressure, 0, 35);
    away += boost;
    draw -= boost * 0.55;
    home -= boost * 0.45;
  }

  if (remaining <= 10 && diff === 0) {
    draw += 8 * (1 - remaining / 10);
    home -= 4 * (1 - remaining / 10);
    away -= 4 * (1 - remaining / 10);
  }

  const regression = 1 - remainingWeight * 0.35;
  home = base.home * regression + home * (1 - regression);
  draw = base.draw * regression + draw * (1 - regression);
  away = base.away * regression + away * (1 - regression);

  const total = home + draw + away;

  return {
    home: Number(((home / total) * 100).toFixed(1)),
    draw: Number(((draw / total) * 100).toFixed(1)),
    away: Number(((away / total) * 100).toFixed(1)),
  };
}

function estimateRemainingGoals(match: LiveMatch): number {
  const base = calculatePoissonProbability(match.homeTeam.id, match.awayTeam.id);
  const remainingFraction = getRemainingMinutes(match) / MATCH_DURATION_MINUTES;
  const expectedTotalGoals =
    ((base.goalsOverUnder25.over / 100) * 3.2 + (base.goalsOverUnder25.under / 100) * 1.8) *
    remainingFraction;

  return Number(expectedRemainingGoals(match, expectedTotalGoals).toFixed(2));
}

function expectedRemainingGoals(match: LiveMatch, baseline: number): number {
  const totalGoals = match.score.home + match.score.away;
  const paceFactor = match.minute > 0 ? totalGoals / (match.minute / 90) : 1;
  const blended = baseline * 0.65 + paceFactor * 0.35;

  return clamp(blended, 0.15, 3.5);
}

function adjustAsianGoalsProbabilities(
  match: LiveMatch,
  marketOdds: LiveOdds,
): { over: number; under: number } {
  const remainingGoals = estimateRemainingGoals(match);
  const currentGoals = match.score.home + match.score.away;
  const effectiveLine = marketOdds.asianGoals.line - currentGoals;
  const projectedTotal = currentGoals + remainingGoals;

  let over = 50;
  if (projectedTotal > effectiveLine + 0.25) {
    over = clamp(52 + (projectedTotal - effectiveLine) * 18, 8, 92);
  } else if (projectedTotal < effectiveLine - 0.25) {
    over = clamp(48 - (effectiveLine - projectedTotal) * 18, 8, 92);
  }

  return {
    over: Number(over.toFixed(1)),
    under: Number((100 - over).toFixed(1)),
  };
}

function adjustAsianHandicapProbabilities(
  match: LiveMatch,
  marketOdds: LiveOdds,
): { home: number; away: number } {
  const remaining = getRemainingMinutes(match);
  const remainingFraction = remaining / MATCH_DURATION_MINUTES;
  const base = calculatePoissonProbability(match.homeTeam.id, match.awayTeam.id);

  const homeRemainingLambda =
    (base.matchResult1X2.home / 100) * 1.6 * remainingFraction + 0.35;
  const awayRemainingLambda =
    (base.matchResult1X2.away / 100) * 1.6 * remainingFraction + 0.35;

  const expectedDiff = homeRemainingLambda - awayRemainingLambda - marketOdds.asianHandicap.line;

  let home = 50 + expectedDiff * 22;
  home = clamp(home, 10, 90);

  return {
    home: Number(home.toFixed(1)),
    away: Number((100 - home).toFixed(1)),
  };
}

export function adjustLiveProbability(
  currentMatch: LiveMatch,
  marketOdds: LiveOdds,
): LivePredictions {
  const base = calculatePoissonProbability(
    currentMatch.homeTeam.id,
    currentMatch.awayTeam.id,
  );

  const matchResult = adjust1X2Probabilities(currentMatch, base.matchResult1X2);
  const asianGoals = adjustAsianGoalsProbabilities(currentMatch, marketOdds);
  const asianHandicap = adjustAsianHandicapProbabilities(currentMatch, marketOdds);

  const remainingMinutes = getRemainingMinutes(currentMatch);

  return {
    remainingMinutes,
    matchResult1X2: {
      home: {
        probability: matchResult.home,
        hasValue: hasBettingValue(matchResult.home, marketOdds.matchResult1X2.home),
      },
      draw: {
        probability: matchResult.draw,
        hasValue: hasBettingValue(matchResult.draw, marketOdds.matchResult1X2.draw),
      },
      away: {
        probability: matchResult.away,
        hasValue: hasBettingValue(matchResult.away, marketOdds.matchResult1X2.away),
      },
    },
    asianGoals: {
      over: {
        probability: asianGoals.over,
        hasValue: hasBettingValue(asianGoals.over, marketOdds.asianGoals.over),
      },
      under: {
        probability: asianGoals.under,
        hasValue: hasBettingValue(asianGoals.under, marketOdds.asianGoals.under),
      },
    },
    asianHandicap: {
      home: {
        probability: asianHandicap.home,
        hasValue: hasBettingValue(asianHandicap.home, marketOdds.asianHandicap.home),
      },
      away: {
        probability: asianHandicap.away,
        hasValue: hasBettingValue(asianHandicap.away, marketOdds.asianHandicap.away),
      },
    },
  };
}

export { calculateFairOdd };
