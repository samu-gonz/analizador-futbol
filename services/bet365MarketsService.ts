import { cache } from "react";
import { buildBet365MarketsFromAnalysedMatch } from "@/lib/bet365/buildFromAnalysedMatch";
import { buildMarketsPayload } from "@/lib/bet365/marketsPayload";
import { createMemoryCache } from "@/lib/cache/memoryCache";
import { isSportsApiProConfigured } from "@/lib/sportsApiPro/config";
import { getBet365MarketsFromSportsApiPro } from "@/services/sportsApiProBet365Fallback";
import { BET365_BOOKMAKER_KEY, isTheOddsApiConfigured, WORLD_CUP_SPORT_KEY } from "@/lib/oddsApi/config";
import {
  chunkMarketKeys,
} from "@/lib/oddsApi/soccerMarkets";

const CORE_BET365_MARKET_KEYS = [
  "h2h",
  "spreads",
  "totals",
  "alternate_totals",
  "btts",
  "draw_no_bet",
  "double_chance",
  "totals_h1",
  "h2h_h1",
  "alternate_totals_corners",
  "alternate_totals_cards",
  "player_goal_scorer_anytime",
] as const;

const MARKETS_CACHE_TTL_MS = 10 * 60 * 1000;
const marketsCache = createMemoryCache<Bet365MarketsPayload>(MARKETS_CACHE_TTL_MS);
import { calculatePoissonProbability } from "@/services/predictionEngine";
import {
  fetchEventAvailableMarkets,
  fetchEventOdds,
  findEventForMatch,
} from "@/services/theOddsApiClient";
import type { Bet365MarketsPayload } from "@/types/bet365Markets";
import type { AnalysedMatch } from "@/types/football";
import type { OddsApiMarket } from "@/types/theOddsApi";

function mergeMarkets(marketLists: OddsApiMarket[][]): OddsApiMarket[] {
  const merged = new Map<string, OddsApiMarket>();

  for (const markets of marketLists) {
    for (const market of markets) {
      const existing = merged.get(market.key);

      if (!existing) {
        merged.set(market.key, market);
        continue;
      }

      const outcomes = new Map<string, (typeof market.outcomes)[number]>();

      for (const outcome of [...existing.outcomes, ...market.outcomes]) {
        const key = `${outcome.name}-${outcome.point ?? "na"}-${outcome.description ?? ""}`;
        outcomes.set(key, outcome);
      }

      merged.set(market.key, {
        ...existing,
        outcomes: Array.from(outcomes.values()),
      });
    }
  }

  return Array.from(merged.values());
}

function emptyPayload(message: string): Bet365MarketsPayload {
  return {
    eventId: null,
    sportKey: null,
    bookmaker: "bet365",
    tabs: [],
    totalSelections: 0,
    valueBetsCount: 0,
    fetchedMarkets: 0,
    source: "unavailable",
    message,
  };
}

export async function getBet365MarketsForMatch(params: {
  homeTeam: string;
  awayTeam: string;
  commenceTime?: string;
  homeTeamId: string;
  awayTeamId: string;
  gameId?: string;
  analysedMatch?: AnalysedMatch;
}): Promise<Bet365MarketsPayload> {
  const cacheKey = params.gameId ?? `${params.homeTeam}-${params.awayTeam}-${params.commenceTime ?? ""}`;
  const cached = marketsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const payload = await fetchBet365MarketsForMatch(params);
  marketsCache.set(cacheKey, payload);

  return payload;
}

async function fetchBet365MarketsForMatch(params: {
  homeTeam: string;
  awayTeam: string;
  commenceTime?: string;
  homeTeamId: string;
  awayTeamId: string;
  gameId?: string;
  analysedMatch?: AnalysedMatch;
}): Promise<Bet365MarketsPayload> {
  if (!isTheOddsApiConfigured()) {
    if (params.analysedMatch) {
      return buildBet365MarketsFromAnalysedMatch(params.analysedMatch);
    }

    if (isSportsApiProConfigured() && params.gameId) {
      return getBet365MarketsFromSportsApiPro({
        gameId: params.gameId,
        homeTeam: params.homeTeam,
        awayTeam: params.awayTeam,
        homeTeamId: params.homeTeamId,
        awayTeamId: params.awayTeamId,
        analysedMatch: params.analysedMatch,
      });
    }

    return emptyPayload(
      "Configura THE_ODDS_API_KEY en .env.local para cuotas reales Bet365.",
    );
  }

  const isWorldCup =
    params.analysedMatch?.match.league.name
      .toLowerCase()
      .includes("world cup") ||
    params.analysedMatch?.match.league.id === "5930";

  const located = await findEventForMatch({
    homeTeam: params.homeTeam,
    awayTeam: params.awayTeam,
    commenceTime: params.commenceTime,
    worldCup: isWorldCup,
    sportKeys: isWorldCup ? [WORLD_CUP_SPORT_KEY] : undefined,
  });

  if (!located) {
    if (params.analysedMatch) {
      const fallback = buildBet365MarketsFromAnalysedMatch(params.analysedMatch);

      return {
        ...fallback,
        message: isWorldCup
          ? "Este partido aún no está publicado en The Odds API (solo ~11 próximos encuentros). Mostrando mercados estimados."
          : "Partido no encontrado en The Odds API. Mostrando mercados estimados.",
      };
    }

    return emptyPayload(
      "No se encontró este partido en The Odds API para Bet365.",
    );
  }

  const { event, sportKey } = located;

  let marketKeys: string[] = [];

  try {
    const available = await fetchEventAvailableMarkets(sportKey, event.id);
    const bet365 = available.bookmakers.find(
      (bookmaker) => bookmaker.key === BET365_BOOKMAKER_KEY,
    );

    if (bet365?.markets?.length) {
      marketKeys = bet365.markets.map((market) => market.key);
    }
  } catch {
    // Usa catálogo reducido si falla el descubrimiento de mercados.
  }

  if (marketKeys.length === 0) {
    marketKeys = [...CORE_BET365_MARKET_KEYS];
  }

  const marketBatches = chunkMarketKeys(marketKeys, 12);
  const marketResponses = await Promise.all(
    marketBatches.map((batch) =>
      fetchEventOdds(sportKey, event.id, batch).catch(() => null),
    ),
  );

  const bet365Markets = marketResponses.flatMap((response) => {
    const bookmaker = response?.bookmakers?.find(
      (entry) => entry.key === BET365_BOOKMAKER_KEY,
    );

    return bookmaker?.markets ?? [];
  });

  if (bet365Markets.length === 0) {
    if (params.analysedMatch) {
      const fallback = buildBet365MarketsFromAnalysedMatch(params.analysedMatch);

      return {
        ...fallback,
        message: "Bet365 sin mercados en The Odds API para este partido. Mostrando estimados.",
      };
    }

    return {
      ...emptyPayload("Bet365 no tiene mercados publicados para este partido."),
      eventId: event.id,
      sportKey,
    };
  }

  const mergedMarkets = mergeMarkets([bet365Markets]);
  const poisson = calculatePoissonProbability(params.homeTeamId, params.awayTeamId);

  return buildMarketsPayload({
    markets: mergedMarkets,
    context: {
      homeTeamName: params.homeTeam,
      awayTeamName: params.awayTeam,
      poisson,
    },
    eventId: event.id,
    sportKey,
    source: "the-odds-api",
    message: "Cuotas reales Bet365 vía The Odds API.",
  });
}

export const getBet365MarketsForAnalysedMatch = cache(
  async (analysedMatch: AnalysedMatch): Promise<Bet365MarketsPayload> => {
    const { match } = analysedMatch;

    return getBet365MarketsForMatch({
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      commenceTime: match.date,
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      gameId: match.id,
      analysedMatch,
    });
  },
);
