import {
  BET365_BOOKMAKER_KEY,
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
  OddsApiSport,
} from "@/types/theOddsApi";

export class TheOddsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "TheOddsApiError";
  }
}

const EVENTS_CACHE_TTL_MS = 5 * 60 * 1000;
const ODDS_CACHE_TTL_MS = 10 * 60 * 1000;
const eventsCache = new Map<string, { expiresAt: number; events: OddsApiEvent[] }>();
const eventOddsCache = createMemoryCache<OddsApiEvent>(ODDS_CACHE_TTL_MS);

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
    throw new TheOddsApiError(
      `The Odds API respondió con status ${response.status}`,
      response.status,
    );
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
      bookmakers: BET365_BOOKMAKER_KEY,
      regions: "eu",
    },
  );
}

export async function fetchEventOdds(
  sportKey: string,
  eventId: string,
  markets: string[],
): Promise<OddsApiEvent> {
  const cacheKey = `${sportKey}:${eventId}:${markets.slice().sort().join(",")}`;
  const cached = eventOddsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await oddsApiGet<OddsApiEvent>(
    `/sports/${sportKey}/events/${eventId}/odds`,
    {
      bookmakers: BET365_BOOKMAKER_KEY,
      regions: "eu",
      markets: markets.join(","),
    },
  );

  eventOddsCache.set(cacheKey, response);

  return response;
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
