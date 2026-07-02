import { percentToDecimalOdd } from "@/lib/sportsApiPro/odds";
import { calculatePoissonProbability } from "@/services/predictionEngine";
import type { AnalysedMatch } from "@/types/football";
import type { OddsApiMarket, OddsApiOutcome } from "@/types/theOddsApi";

function fairOdd(probability: number, fallback = 2): number {
  const odd = percentToDecimalOdd(probability);

  return odd > 1 ? odd : fallback;
}

function overUnderOutcomes(
  overProbability: number,
  line: number,
): OddsApiOutcome[] {
  const underProbability = Number((100 - overProbability).toFixed(1));

  return [
    { name: "Over", price: fairOdd(overProbability), point: line },
    { name: "Under", price: fairOdd(underProbability), point: line },
  ];
}

function yesNoOutcomes(yesProbability: number): OddsApiOutcome[] {
  const noProbability = Number((100 - yesProbability).toFixed(1));

  return [
    { name: "Yes", price: fairOdd(yesProbability) },
    { name: "No", price: fairOdd(noProbability) },
  ];
}

function estimateGoalsOverAtLine(
  baseOverAt25: number,
  targetLine: number,
): number {
  const adjustment = (targetLine - 2.5) * 8;

  return Number(Math.max(5, Math.min(95, baseOverAt25 - adjustment)).toFixed(1));
}

function estimateCornersOverAtLine(
  baseOverAt95: number,
  targetLine: number,
): number {
  const adjustment = (targetLine - 9.5) * 6;

  return Number(Math.max(5, Math.min(95, baseOverAt95 - adjustment)).toFixed(1));
}

function estimateCardsOverAtLine(targetLine: number): number {
  const adjustment = (targetLine - 4.5) * 7;

  return Number(Math.max(10, Math.min(90, 52 - adjustment)).toFixed(1));
}

function withTeam(
  outcomes: OddsApiOutcome[],
  teamName: string,
): OddsApiOutcome[] {
  return outcomes.map((outcome) => ({
    ...outcome,
    description: teamName,
  }));
}

export function buildSyntheticBet365Markets(
  analysedMatch: AnalysedMatch,
): OddsApiMarket[] {
  const { match, marketOdds, predictions } = analysedMatch;

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const halfFactor = 0.48;

  const homeWin = predictions.matchResult1X2.home.probability;
  const draw = predictions.matchResult1X2.draw.probability;
  const awayWin = predictions.matchResult1X2.away.probability;
  const homeDraw = Math.min(95, homeWin + draw);
  const awayDraw = Math.min(95, awayWin + draw);
  const homeAway = Math.min(95, homeWin + awayWin);

  const dnbTotal = homeWin + awayWin || 1;
  const homeDnb = (homeWin / dnbTotal) * 100;
  const awayDnb = (awayWin / dnbTotal) * 100;

  const goalsOver25 = predictions.goalsOverUnder25.over.probability;
  const cornersOver95 = predictions.cornersOverUnder95.over.probability;

  const bttsYes = Math.min(
    92,
    ((homeWin + draw * 0.35) * (awayWin + draw * 0.35)) / 55,
  );

  const goalLines = [0.5, 1.5, 2.5, 3.5, 4.5];
  const cornerLines = [8.5, 9.5, 10.5];
  const cardLines = [3.5, 4.5, 5.5];

  return [
    {
      key: "h2h",
      outcomes: [
        { name: home, price: marketOdds.matchResult1X2.home },
        { name: "Draw", price: marketOdds.matchResult1X2.draw },
        { name: away, price: marketOdds.matchResult1X2.away },
      ],
    },
    {
      key: "draw_no_bet",
      outcomes: [
        { name: home, price: fairOdd(homeDnb) },
        { name: away, price: fairOdd(awayDnb) },
      ],
    },
    {
      key: "double_chance",
      outcomes: [
        { name: `${home} or Draw`, price: fairOdd(homeDraw) },
        { name: `${away} or Draw`, price: fairOdd(awayDraw) },
        { name: `${home} or ${away}`, price: fairOdd(homeAway) },
      ],
    },
    {
      key: "spreads",
      outcomes: [
        { name: home, price: fairOdd(homeWin + 8), point: -0.5 },
        { name: away, price: fairOdd(awayWin + 8), point: 0.5 },
      ],
    },
    {
      key: "alternate_spreads",
      outcomes: [
        { name: home, price: fairOdd(homeWin + 4), point: -1 },
        { name: away, price: fairOdd(awayWin + 4), point: 1 },
        { name: home, price: fairOdd(homeWin + 12), point: -0.25 },
        { name: away, price: fairOdd(awayWin + 12), point: 0.25 },
      ],
    },
    {
      key: "totals",
      outcomes: [
        {
          name: "Over",
          price: marketOdds.goalsOverUnder25.over,
          point: marketOdds.goalsOverUnder25.line,
        },
        {
          name: "Under",
          price: marketOdds.goalsOverUnder25.under,
          point: marketOdds.goalsOverUnder25.line,
        },
      ],
    },
    {
      key: "alternate_totals",
      outcomes: goalLines.flatMap((line) =>
        overUnderOutcomes(estimateGoalsOverAtLine(goalsOver25, line), line),
      ),
    },
    {
      key: "team_totals",
      outcomes: [
        ...withTeam(overUnderOutcomes(goalsOver25 * 0.55, 1.5), home),
        ...withTeam(overUnderOutcomes(goalsOver25 * 0.45, 1.5), away),
      ],
    },
    {
      key: "btts",
      outcomes: yesNoOutcomes(bttsYes),
    },
    {
      key: "btts_h1",
      outcomes: yesNoOutcomes(Math.min(60, bttsYes * halfFactor)),
    },
    {
      key: "h2h_h1",
      outcomes: [
        { name: home, price: fairOdd(homeWin * halfFactor) },
        { name: "Draw", price: fairOdd(draw * halfFactor + 20) },
        { name: away, price: fairOdd(awayWin * halfFactor) },
      ],
    },
    {
      key: "h2h_h2",
      outcomes: [
        { name: home, price: fairOdd(homeWin * halfFactor) },
        { name: "Draw", price: fairOdd(draw * halfFactor + 20) },
        { name: away, price: fairOdd(awayWin * halfFactor) },
      ],
    },
    {
      key: "totals_h1",
      outcomes: overUnderOutcomes(goalsOver25 * halfFactor, 1.5),
    },
    {
      key: "totals_h2",
      outcomes: overUnderOutcomes(goalsOver25 * halfFactor, 1.5),
    },
    {
      key: "double_chance_h1",
      outcomes: [
        {
          name: `${home} or Draw`,
          price: fairOdd((homeWin + draw) * halfFactor),
        },
        {
          name: `${away} or Draw`,
          price: fairOdd((awayWin + draw) * halfFactor),
        },
      ],
    },
    {
      key: "alternate_totals_corners",
      outcomes: cornerLines.flatMap((line) =>
        overUnderOutcomes(estimateCornersOverAtLine(cornersOver95, line), line),
      ),
    },
    {
      key: "corners_1x2",
      outcomes: [
        { name: home, price: fairOdd(45 + (cornersOver95 - 50) * 0.3) },
        { name: "Draw", price: fairOdd(20) },
        { name: away, price: fairOdd(35 + (100 - cornersOver95 - 50) * 0.2) },
      ],
    },
    {
      key: "alternate_team_totals_corners",
      outcomes: [
        ...withTeam(overUnderOutcomes(cornersOver95 * 0.52, 4.5), home),
        ...withTeam(overUnderOutcomes(cornersOver95 * 0.48, 4.5), away),
      ],
    },
    {
      key: "alternate_spreads_corners",
      outcomes: [
        { name: home, price: fairOdd(52), point: -0.5 },
        { name: away, price: fairOdd(48), point: 0.5 },
      ],
    },
    {
      key: "alternate_totals_cards",
      outcomes: cardLines.flatMap((line) =>
        overUnderOutcomes(estimateCardsOverAtLine(line), line),
      ),
    },
    {
      key: "alternate_spreads_cards",
      outcomes: [
        { name: home, price: fairOdd(52), point: -0.5 },
        { name: away, price: fairOdd(48), point: 0.5 },
      ],
    },
  ];
}
