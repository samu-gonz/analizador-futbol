import {
  ODDS_API_REGIONS,
  PREFERRED_BOOKMAKER_KEYS,
  SOCCER_SPORT_KEYS,
  THE_ODDS_API_BASE_URL,
  WORLD_CUP_SPORT_KEY,
  getTheOddsApiKey,
} from "@/lib/oddsApi/config";
import { createMemoryCache } from "@/lib/cache/memoryCache";
import {
  normalizeTeamName,
  teamsMatchEvent,
} from "@/lib/oddsApi/teamMatching";
import type {
  OddsApiEvent,
  OddsApiEventMarketsResponse,
  OddsApiMarket,
  OddsApiSport,
} from "@/types/theOddsApi";

export class TheOddsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = "TheOddsApiError";
  }
}

export function isOddsApiQuotaExhausted(error: unknown): boolean {
  return (
    error instanceof TheOddsApiError &&
    error.errorCode === "OUT_OF_USAGE_CREDITS"
  );
}

const EVENTS_CACHE_TTL_MS = 5 * 60 * 1000;
const ODDS_CACHE_TTL_MS = 10 * 60 * 1000;
const SPORT_ODDS_CACHE_TTL_MS = 30 * 60 * 1000;
const eventsCache = new Map<string, { expiresAt: number; events: OddsApiEvent[] }>();
const eventOddsCache = createMemoryCache<OddsApiEvent>(ODDS_CACHE_TTL_MS);
const sportOddsCache = new Map<string, { expiresAt: number; events: OddsApiEvent[] }>();

/** Mercados soportados por el endpoint bulk /sports/{sport}/odds */
const BULK_SPORT_MARKET_KEYS = [
  "h2h",
  "totals",
  "spreads",
  "draw_no_bet",
  "double_chance",
] as const;

async function oddsApiGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const apiKey = getTheOddsApiKey();

  if (!apiKey) {
    throw new TheOddsApiError("THE_ODDS_API_KEY no está configurada");
  }

  const url = new URL(`${THE_ODDS_API_BASE_URL}${path}`);

  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `The Odds API respondió con status ${response.status}`;
    let errorCode: string | undefined;

    try {
      const body = (await response.json()) as {
        message?: string;
        error_code?: string;
      };

      if (body.message) {
        message = body.message;
      }

      errorCode = body.error_code;
    } catch {
      // Respuesta no JSON.
    }

    throw new TheOddsApiError(message, response.status, errorCode);
  }

  return response.json() as Promise<T>;
}

export async function fetchSports(): Promise<OddsApiSport[]> {
  return oddsApiGet<OddsApiSport[]>("/sports");
}

export async function fetchEvents(sportKey: string): Promise<OddsApiEvent[]> {
  const cached = eventsCache.get(sportKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.events;
  }

  const events = await oddsApiGet<OddsApiEvent[]>(`/sports/${sportKey}/events`);

  eventsCache.set(sportKey, {
    events,
    expiresAt: Date.now() + EVENTS_CACHE_TTL_MS,
  });

  return events;
}

export async function fetchEventAvailableMarkets(
  sportKey: string,
  eventId: string,
): Promise<OddsApiEventMarketsResponse> {
  return oddsApiGet<OddsApiEventMarketsResponse>(
    `/sports/${sportKey}/events/${eventId}/markets`,
    {
      regions: ODDS_API_REGIONS,
    },
  );
}

export function pickPreferredBookmaker(
  bookmakers: OddsApiEventMarketsResponse["bookmakers"],
  preferredKeys: readonly string[] = PREFERRED_BOOKMAKER_KEYS,
): { key: string; title: string; marketKeys: string[] } | null {
  for (const preferred of preferredKeys) {
    const match = bookmakers.find((bookmaker) => bookmaker.key === preferred);

    if (match?.markets?.length) {
      return {
        key: match.key,
        title: match.title,
        marketKeys: match.markets.map((market) => market.key),
      };
    }
  }

  const [best] = [...bookmakers].sort(
    (left, right) => (right.markets?.length ?? 0) - (left.markets?.length ?? 0),
  );

  if (!best?.markets?.length) {
    return null;
  }

  return {
    key: best.key,
    title: best.title,
    marketKeys: best.markets.map((market) => market.key),
  };
}

export async function fetchSportOdds(
  sportKey: string,
  bookmakerKey: string,
  markets: string[] = [...BULK_SPORT_MARKET_KEYS],
): Promise<OddsApiEvent[]> {
  const cacheKey = `${sportKey}:${bookmakerKey}:${markets.slice().sort().join(",")}`;
  const cached = sportOddsCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.events;
  }

  const events = await oddsApiGet<OddsApiEvent[]>(`/sports/${sportKey}/odds`, {
    regions: ODDS_API_REGIONS,
    markets: markets.join(","),
    bookmakers: bookmakerKey,
  });

  sportOddsCache.set(cacheKey, {
    events,
    expiresAt: Date.now() + SPORT_ODDS_CACHE_TTL_MS,
  });

  return events;
}

export function extractEventBookmakerMarkets(
  events: OddsApiEvent[],
  eventId: string,
  bookmakerKey: string,
): OddsApiMarket[] {
  const event = events.find((entry) => entry.id === eventId);

  return extractBookmakerMarkets(event, bookmakerKey);
}

export async function fetchEventOdds(
  sportKey: string,
  eventId: string,
  markets: string[],
  bookmakerKey: string,
): Promise<OddsApiEvent> {
  const cacheKey = `${sportKey}:${eventId}:${bookmakerKey}:${markets.slice().sort().join(",")}`;
  const cached = eventOddsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await oddsApiGet<OddsApiEvent>(
    `/sports/${sportKey}/events/${eventId}/odds`,
    {
      bookmakers: bookmakerKey,
      regions: ODDS_API_REGIONS,
      markets: markets.join(","),
    },
  );

  eventOddsCache.set(cacheKey, response);

  return response;
}

export function extractBookmakerMarkets(
  response: OddsApiEvent | null | undefined,
  bookmakerKey: string,
): OddsApiMarket[] {
  const bookmaker = response?.bookmakers?.find(
    (entry) => entry.key === bookmakerKey,
  );

  return bookmaker?.markets ?? [];
}

export { normalizeTeamName, teamsMatchEvent } from "@/lib/oddsApi/teamMatching";

export async function findEventForMatch(params: {
  homeTeam: string;
  awayTeam: string;
  commenceTime?: string;
  sportKeys?: string[];
  worldCup?: boolean;
}): Promise<{ event: OddsApiEvent; sportKey: string } | null> {
  const sportKeys =
    params.sportKeys ??
    (params.worldCup
      ? [WORLD_CUP_SPORT_KEY]
      : [...SOCCER_SPORT_KEYS]);

  const targetTime = params.commenceTime
    ? new Date(params.commenceTime).getTime()
    : undefined;

  const maxTimeDiffMs = 48 * 60 * 60 * 1000;

  for (const sportKey of sportKeys) {
    try {
      const events = await fetchEvents(sportKey);
      const candidates = events.filter((event) =>
        teamsMatchEvent(
          params.homeTeam,
          params.awayTeam,
          event.home_team,
          event.away_team,
        ),
      );

      if (candidates.length === 0) {
        continue;
      }

      if (targetTime) {
        const sorted = [...candidates].sort((a, b) => {
          const diffA = Math.abs(new Date(a.commence_time).getTime() - targetTime);
          const diffB = Math.abs(new Date(b.commence_time).getTime() - targetTime);

          return diffA - diffB;
        });

        const best = sorted[0];
        const timeDiff = Math.abs(
          new Date(best.commence_time).getTime() - targetTime,
        );

        if (timeDiff <= maxTimeDiffMs) {
          return { event: best, sportKey };
        }

        continue;
      }

      return { event: candidates[0], sportKey };
    } catch {
      continue;
    }
  }

  return null;
}
