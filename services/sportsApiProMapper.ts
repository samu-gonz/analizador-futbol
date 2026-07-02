import { extractOddsFromPredictions } from "@/lib/sportsApiPro/odds";
import { getCompetitorLogoUrl } from "@/lib/sportsApiPro/images";
import type { SapGame, SapGameEvent, SapGameOdds } from "@/lib/sportsApiPro/types";
import { adjustLiveProbability } from "@/services/liveEngine";
import type {
  LiveAnalysedMatch,
  LiveCards,
  LiveCorners,
  LiveMatch,
  LiveMatchPeriod,
  LiveOdds,
  TodayFixtureSummary,
  UserContextScore,
} from "@/types/liveMatch";

const ODDS_SOURCE_LABEL = "Bet365 (vía SportsAPI Pro)";

function createUserContextScore(minute: number): UserContextScore {
  return {
    home: 0,
    away: 0,
    capturedAtMinute: minute,
  };
}

function mapPeriod(shortStatus: string, statusText: string): LiveMatchPeriod {
  const normalized = `${shortStatus} ${statusText}`.toLowerCase();

  if (normalized.includes("ht") || normalized.includes("half")) {
    return "HT";
  }

  if (
    normalized.includes("1st") ||
    normalized.includes("1h") ||
    normalized.includes("first")
  ) {
    return "1H";
  }

  return "2H";
}

function extractCardsFromEvents(
  events: SapGameEvent[],
  homeTeamId: number,
  awayTeamId: number,
): LiveCards {
  const cards: LiveCards = {
    homeYellow: 0,
    homeRed: 0,
    awayYellow: 0,
    awayRed: 0,
  };

  events.forEach((event) => {
    const name = event.eventType.name.toLowerCase();
    const isHome = event.competitorId === homeTeamId;
    const isAway = event.competitorId === awayTeamId;

    if (!isHome && !isAway) {
      return;
    }

    if (name.includes("yellow")) {
      if (isHome) {
        cards.homeYellow += 1;
      } else {
        cards.awayYellow += 1;
      }
    }

    if (name.includes("red")) {
      if (isHome) {
        cards.homeRed += 1;
      } else {
        cards.awayRed += 1;
      }
    }
  });

  return cards;
}

function buildOddsFromPredictions(
  game: SapGame,
  oddsEntry: SapGameOdds | undefined,
): LiveOdds {
  const minute = game.gameTime > 0 ? game.gameTime : 0;
  const sapOdds = extractOddsFromPredictions(game, oddsEntry);

  return {
    bookmaker: ODDS_SOURCE_LABEL,
    matchResult1X2: {
      home: sapOdds.home,
      draw: sapOdds.draw,
      away: sapOdds.away,
    },
    asianGoals: {
      line: sapOdds.goalsLine,
      over: sapOdds.over25,
      under: sapOdds.under25,
    },
    asianHandicap: {
      line: 0,
      home: Number(((sapOdds.home + sapOdds.away) / 2).toFixed(2)) || 1.95,
      away: Number(((sapOdds.home + sapOdds.away) / 2).toFixed(2)) || 1.95,
      userContextScore: createUserContextScore(minute),
    },
  };
}

export function mapGameToLiveMatch(
  game: SapGame,
  cards: LiveCards = {
    homeYellow: 0,
    homeRed: 0,
    awayYellow: 0,
    awayRed: 0,
  },
  corners: LiveCorners = { home: 0, away: 0 },
): LiveMatch {
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
    score: {
      home: game.homeCompetitor.score ?? 0,
      away: game.awayCompetitor.score ?? 0,
    },
    corners,
    cards,
    minute: game.gameTime > 0 ? game.gameTime : 0,
    period: mapPeriod(game.shortStatusText, game.statusText),
    status: "live",
  };
}

export function buildAnalysedMatchFromSap(
  game: SapGame,
  oddsEntry: SapGameOdds | undefined,
  events: SapGameEvent[] = [],
): LiveAnalysedMatch {
  const cards = extractCardsFromEvents(
    events,
    game.homeCompetitor.id,
    game.awayCompetitor.id,
  );

  const match = mapGameToLiveMatch(game, cards);
  const odds = buildOddsFromPredictions(game, oddsEntry);

  return {
    match,
    odds,
    predictions: adjustLiveProbability(match, odds),
    updatedAt: new Date().toISOString(),
  };
}

export function mapTodayFixtureSummary(game: SapGame): TodayFixtureSummary {
  return {
    id: String(game.id),
    homeTeam: game.homeCompetitor.name,
    awayTeam: game.awayCompetitor.name,
    kickoff: game.startTime,
    status: game.shortStatusText || game.statusText,
    score: `${game.homeCompetitor.score ?? 0} - ${game.awayCompetitor.score ?? 0}`,
    isLive: game.statusGroup === 3,
  };
}
