import { cache } from "react";
import { buildBet365MarketsFromAnalysedMatch } from "@/lib/bet365/buildFromAnalysedMatch";
import { buildMarketsPayload } from "@/lib/bet365/marketsPayload";
import { createMemoryCache } from "@/lib/cache/memoryCache";
import { isSportsApiProConfigured } from "@/lib/sportsApiPro/config";
import { getBet365MarketsFromSportsApiPro } from "@/services/sportsApiProBet365Fallback";
import { getBookmakerDisplayName, isTheOddsApiConfigured, PREFERRED_BOOKMAKER_KEYS, WORLD_CUP_SPORT_KEY } from "@/lib/oddsApi/config";
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
  extractBookmakerMarkets,
  fetchEventAvailableMarkets,
  fetchEventOdds,
  findEventForMatch,
  pickPreferredBookmaker,
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

function emptyPayload(message: string, partial?: Partial<Bet365MarketsPayload>): Bet365MarketsPayload {
  return {
    eventId: null,
    sportKey: null,
    bookmaker: "unavailable",
    bookmakerTitle: "No disponible",
    tabs: [],
    totalSelections: 0,
    valueBetsCount: 0,
    fetchedMarkets: 0,
    source: "unavailable",
    message,
    ...partial,
  };
}

async function fetchMarketsFromBookmaker(
  sportKey: string,
  eventId: string,
  marketKeys: string[],
  bookmakerKey: string,
): Promise<OddsApiMarket[]> {
  const marketBatches = chunkMarketKeys(marketKeys, 12);
  const marketResponses = await Promise.all(
    marketBatches.map((batch) =>
      fetchEventOdds(sportKey, eventId, batch, bookmakerKey).catch(() => null),
    ),
  );

  return mergeMarkets(
    marketResponses.map((response) =>
      extractBookmakerMarkets(response, bookmakerKey),
    ),
  );
}

async function fetchBestRealBookmakerMarkets(params: {
  sportKey: string;
  eventId: string;
  availableBookmakers: Awaited<ReturnType<typeof fetchEventAvailableMarkets>>["bookmakers"];
  marketKeyCandidates: string[][];
}): Promise<{
  bookmakerKey: string;
  bookmakerTitle: string;
  markets: OddsApiMarket[];
} | null> {
  const orderedKeys: string[] = [];

  for (const preferred of PREFERRED_BOOKMAKER_KEYS) {
    const hasMarkets = params.availableBookmakers.some(
      (bookmaker) =>
        bookmaker.key === preferred && (bookmaker.markets?.length ?? 0) > 0,
    );

    if (hasMarkets) {
      orderedKeys.push(preferred);
    }
  }

  for (const bookmaker of params.availableBookmakers) {
    if (!orderedKeys.includes(bookmaker.key) && (bookmaker.markets?.length ?? 0) > 0) {
      orderedKeys.push(bookmaker.key);
    }
  }

  if (orderedKeys.length === 0) {
    orderedKeys.push(...PREFERRED_BOOKMAKER_KEYS);
  }

  for (const bookmakerKey of orderedKeys) {
    const bookmakerMeta = params.availableBookmakers.find(
      (bookmaker) => bookmaker.key === bookmakerKey,
    );

    for (const marketKeys of params.marketKeyCandidates) {
      const markets = await fetchMarketsFromBookmaker(
        params.sportKey,
        params.eventId,
        marketKeys,
        bookmakerKey,
      );

      if (markets.length > 0) {
        return {
          bookmakerKey,
          bookmakerTitle: getBookmakerDisplayName(
            bookmakerKey,
            bookmakerMeta?.title,
          ),
          markets,
        };
      }
    }
  }

  return null;
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
    return emptyPayload(
      isWorldCup
        ? "Este partido aún no tiene cuotas publicadas en casas de apuestas. The Odds API solo cubre los próximos encuentros del Mundial."
        : "No se encontró este partido en casas de apuestas con cuotas disponibles.",
    );
  }

  const { event, sportKey } = located;

  let discoveredMarketKeys: string[] = [];
  let availableBookmakers: Awaited<
    ReturnType<typeof fetchEventAvailableMarkets>
  >["bookmakers"] = [];

  try {
    const available = await fetchEventAvailableMarkets(sportKey, event.id);
    availableBookmakers = available.bookmakers ?? [];
    const selectedBookmaker = pickPreferredBookmaker(availableBookmakers);

    if (selectedBookmaker?.marketKeys.length) {
      discoveredMarketKeys = selectedBookmaker.marketKeys;
    }
  } catch {
    // Si falla el catálogo, probamos con mercados estándar.
  }

  const marketKeyCandidates = [
    discoveredMarketKeys.length > 0 ? discoveredMarketKeys : [...CORE_BET365_MARKET_KEYS],
    [...CORE_BET365_MARKET_KEYS],
    ["h2h", "totals", "btts", "double_chance"],
  ];

  const resolved = await fetchBestRealBookmakerMarkets({
    sportKey,
    eventId: event.id,
    availableBookmakers,
    marketKeyCandidates,
  });

  if (!resolved) {
    return emptyPayload(
      "No hay cuotas reales publicadas para este partido en ninguna casa disponible ahora mismo.",
      {
        eventId: event.id,
        sportKey,
      },
    );
  }

  const { bookmakerKey, bookmakerTitle, markets: mergedMarkets } = resolved;
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
    bookmaker: bookmakerKey,
    bookmakerTitle,
    source: "the-odds-api",
    message:
      bookmakerKey === "bet365"
        ? "Cuotas reales Bet365 vía The Odds API."
        : `Cuotas reales de ${bookmakerTitle} vía The Odds API (Bet365 no publica este partido).`,
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
