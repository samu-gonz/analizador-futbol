import type { SapGame, SapGameOdds, SapPredictionMarket } from "@/lib/sportsApiPro/types";

export function percentToDecimalOdd(percentage: number): number {
  if (percentage <= 0) {
    return 0;
  }

  return Number((100 / percentage).toFixed(2));
}

function findPredictionMarket(
  markets: SapPredictionMarket[],
  matcher: (title: string) => boolean,
): SapPredictionMarket | undefined {
  return markets.find((market) => matcher(market.title.toLowerCase()));
}

function readOptionOdd(
  market: SapPredictionMarket | undefined,
  optionName: string,
): number {
  const option = market?.options.find(
    (entry) => entry.name.toLowerCase() === optionName.toLowerCase(),
  );

  return percentToDecimalOdd(option?.vote?.percentage ?? 0);
}

export interface SapMatchOdds {
  home: number;
  draw: number;
  away: number;
  over25: number;
  under25: number;
  goalsLine: number;
}

export function extractOddsFromPredictions(
  game: SapGame,
  oddsEntry: SapGameOdds | undefined,
): SapMatchOdds {
  const markets = oddsEntry?.predictions?.predictions ?? [];

  const matchWinner = findPredictionMarket(
    markets,
    (title) => title.includes("who will win") || title.includes("1x2"),
  );

  const goalsMarket = findPredictionMarket(
    markets,
    (title) => title.includes("total goals") || title.includes("over"),
  );

  const goalsLineMatch = goalsMarket?.title.match(/[\d.]+/);
  const goalsLine = goalsLineMatch ? Number.parseFloat(goalsLineMatch[0]) : 2.5;

  const homeName = game.homeCompetitor.name;
  const awayName = game.awayCompetitor.name;

  return {
    home: readOptionOdd(matchWinner, homeName) || 2.1,
    draw: readOptionOdd(matchWinner, "Draw") || 3.3,
    away: readOptionOdd(matchWinner, awayName) || 3.5,
    over25: readOptionOdd(goalsMarket, "Over") || 1.9,
    under25: readOptionOdd(goalsMarket, "Under") || 1.9,
    goalsLine,
  };
}
