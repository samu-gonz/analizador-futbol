import { cache } from "react";
import { getCompetitorLogoUrl } from "@/lib/sportsApiPro/images";
import { createMemoryCache } from "@/lib/cache/memoryCache";
import { extractOddsFromPredictions } from "@/lib/sportsApiPro/odds";
import { isSportsApiProConfigured } from "@/lib/sportsApiPro/config";
import type { SapGame, SapGameOdds } from "@/lib/sportsApiPro/types";
import {
  calculatePoissonProbability,
} from "@/services/predictionEngine";
import {
  fetchWorldCupOdds,
} from "@/services/sportsApiProClient";
import { fetchFullWorldCupSchedule } from "@/services/worldCupScheduleService";
import { hasBettingValue } from "@/lib/valueBetting";
import type {
  AnalysedMatch,
  MarketOdds,
  Match,
  MatchStatus,
  Predictions,
} from "@/types/football";

function mapMatchStatus(statusGroup: number): MatchStatus {
  if (statusGroup === 3) {
    return "live";
  }

  if (statusGroup === 4) {
    return "finished";
  }

  return "scheduled";
}

function buildMarketOdds(odds: ReturnType<typeof extractOddsFromPredictions>): MarketOdds {
  return {
    matchResult1X2: {
      home: odds.home,
      draw: odds.draw,
      away: odds.away,
    },
    goalsOverUnder25: {
      over: odds.over25,
      under: odds.under25,
      line: odds.goalsLine,
    },
    cornersOverUnder95: {
      over: 1.9,
      under: 1.9,
      line: 9.5,
    },
  };
}

function buildPredictions(
  probabilities: ReturnType<typeof calculatePoissonProbability>,
  marketOdds: MarketOdds,
): Predictions {
  return {
    matchResult1X2: {
      home: {
        probability: probabilities.matchResult1X2.home,
        hasValue: hasBettingValue(
          probabilities.matchResult1X2.home,
          marketOdds.matchResult1X2.home,
        ),
      },
      draw: {
        probability: probabilities.matchResult1X2.draw,
        hasValue: hasBettingValue(
          probabilities.matchResult1X2.draw,
          marketOdds.matchResult1X2.draw,
        ),
      },
      away: {
        probability: probabilities.matchResult1X2.away,
        hasValue: hasBettingValue(
          probabilities.matchResult1X2.away,
          marketOdds.matchResult1X2.away,
        ),
      },
    },
    goalsOverUnder25: {
      over: {
        probability: probabilities.goalsOverUnder25.over,
        hasValue: hasBettingValue(
          probabilities.goalsOverUnder25.over,
          marketOdds.goalsOverUnder25.over,
        ),
      },
      under: {
        probability: probabilities.goalsOverUnder25.under,
        hasValue: hasBettingValue(
          probabilities.goalsOverUnder25.under,
          marketOdds.goalsOverUnder25.under,
        ),
      },
    },
    cornersOverUnder95: {
      over: {
        probability: probabilities.cornersOverUnder95.over,
        hasValue: hasBettingValue(
          probabilities.cornersOverUnder95.over,
          marketOdds.cornersOverUnder95.over,
        ),
      },
      under: {
        probability: probabilities.cornersOverUnder95.under,
        hasValue: hasBettingValue(
          probabilities.cornersOverUnder95.under,
          marketOdds.cornersOverUnder95.under,
        ),
      },
    },
  };
}

function mapSapGameToMatch(game: SapGame): Match {
  return {
    id: String(game.id),
    homeTeam: {
      id: String(game.homeCompetitor.id),
      name: game.homeCompetitor.name,
      logoUrl: getCompetitorLogoUrl(
        game.homeCompetitor.id,
        game.homeCompetitor.imageVersion,
      ),
    },
    awayTeam: {
      id: String(game.awayCompetitor.id),
      name: game.awayCompetitor.name,
      logoUrl: getCompetitorLogoUrl(
        game.awayCompetitor.id,
        game.awayCompetitor.imageVersion,
      ),
    },
    league: {
      id: String(game.competitionId),
      name: game.competitionDisplayName || "FIFA World Cup",
      country: "International",
    },
    date: game.startTime,
    status: mapMatchStatus(game.statusGroup),
  };
}

function sortWorldCupGames(games: SapGame[]): SapGame[] {
  const priority = (game: SapGame): number => {
    if (game.statusGroup === 3) {
      return 0;
    }

    if (game.statusGroup === 2) {
      return 1;
    }

    return 2;
  };

  return [...games].sort((a, b) => {
    const priorityDiff = priority(a) - priority(b);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

function buildAnalysedMatch(
  game: SapGame,
  oddsIndex: Map<number, SapGameOdds>,
): AnalysedMatch {
  const match = mapSapGameToMatch(game);
  const sapOdds = extractOddsFromPredictions(game, oddsIndex.get(game.id));
  const marketOdds = buildMarketOdds(sapOdds);

  const probabilities = calculatePoissonProbability(
    match.homeTeam.id,
    match.awayTeam.id,
  );

  const predictions = buildPredictions(probabilities, marketOdds);

  return {
    match,
    marketOdds,
    predictions,
  };
}

const ANALYSED_MATCHES_CACHE_TTL_MS = 5 * 60 * 1000;
const analysedMatchesCache = createMemoryCache<AnalysedMatch[]>(
  ANALYSED_MATCHES_CACHE_TTL_MS,
);

async function loadWorldCupAnalysedMatches(): Promise<AnalysedMatch[]> {
  const [games, oddsResponse] = await Promise.all([
    fetchFullWorldCupSchedule(),
    fetchWorldCupOdds().catch(() => ({ success: true, data: { games: [] } })),
  ]);

  const oddsIndex = new Map(
    (oddsResponse.data?.games ?? []).map((entry) => [entry.gameId, entry]),
  );

  const sortedGames = sortWorldCupGames(games);

  return sortedGames.map((game) => buildAnalysedMatch(game, oddsIndex));
}

export const getWorldCupAnalysedMatches = cache(async (): Promise<AnalysedMatch[]> => {
  const cached = analysedMatchesCache.get("all");

  if (cached) {
    return cached;
  }

  const matches = await loadWorldCupAnalysedMatches();
  analysedMatchesCache.set("all", matches);

  return matches;
});

export async function getWorldCupAnalysedMatchesSafe(): Promise<AnalysedMatch[]> {
  if (!isSportsApiProConfigured()) {
    return [];
  }

  try {
    return await getWorldCupAnalysedMatches();
  } catch {
    return [];
  }
}
