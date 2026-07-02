import {
  BET365_BOOKMAKER_ID,
  LIVE_MATCH_STATUSES,
  WORLD_CUP_LEAGUE_ID,
  WORLD_CUP_SEASON,
} from "@/lib/apiFootball/config";
import type {
  ApiFixtureItem,
  ApiFixtureStatisticsItem,
  ApiLiveOddsItem,
} from "@/lib/apiFootball/types";
import {
  ApiFootballClientError,
  apiFootballGet,
} from "@/services/apiClient";

/**
 * Partidos del Mundial en juego ahora mismo.
 * GET /fixtures?league=1&season=2026&status=1H-HT-2H-ET-P-BT-LIVE
 */
export async function fetchWorldCupLiveFixtures(): Promise<ApiFixtureItem[]> {
  return apiFootballGet<ApiFixtureItem[]>("/fixtures", {
    params: {
      league: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      status: LIVE_MATCH_STATUSES,
    },
  });
}

/**
 * Partidos del Mundial programados para una fecha concreta.
 * GET /fixtures?league=1&season=2026&date=YYYY-MM-DD
 */
export async function fetchTodayWorldCupFixtures(
  date: string,
): Promise<ApiFixtureItem[]> {
  return apiFootballGet<ApiFixtureItem[]>("/fixtures", {
    params: {
      league: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      date,
    },
  });
}

/** GET /fixtures/statistics?fixture={id} */
export async function fetchFixtureStatistics(
  fixtureId: number,
): Promise<ApiFixtureStatisticsItem[]> {
  return apiFootballGet<ApiFixtureStatisticsItem[]>("/fixtures/statistics", {
    params: { fixture: fixtureId },
  });
}

/** GET /odds/live?fixture={id}&bookmaker=8 */
export async function fetchLiveOdds(fixtureId: number): Promise<ApiLiveOddsItem[]> {
  return apiFootballGet<ApiLiveOddsItem[]>("/odds/live", {
    params: {
      fixture: fixtureId,
      bookmaker: BET365_BOOKMAKER_ID,
    },
  });
}

export { ApiFootballClientError as ApiFootballError };

export type LiveFixturesSource = "world-cup-2026" | "all-live";

export interface LiveFixturesResult {
  fixtures: ApiFixtureItem[];
  source: LiveFixturesSource;
  planNotice?: string;
}

function isFreePlanSeasonError(error: unknown): boolean {
  if (!(error instanceof ApiFootballClientError)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("free plans do not have access") ||
    message.includes("try from 2022 to 2024")
  );
}

/** GET /fixtures?live=all */
export async function fetchAllLiveFixtures(): Promise<ApiFixtureItem[]> {
  return apiFootballGet<ApiFixtureItem[]>("/fixtures", {
    params: { live: "all" },
  });
}

/**
 * Intenta Mundial 2026; si el plan Free no lo permite, usa todos los partidos en vivo.
 */
export async function fetchLiveFixturesWithFallback(): Promise<LiveFixturesResult> {
  try {
    const worldCupFixtures = await fetchWorldCupLiveFixtures();

    if (worldCupFixtures.length > 0) {
      return {
        fixtures: worldCupFixtures,
        source: "world-cup-2026",
      };
    }
  } catch (error) {
    if (!isFreePlanSeasonError(error)) {
      throw error;
    }
  }

  const allLive = await fetchAllLiveFixtures();
  const worldCupFromLive = allLive.filter(
    (fixture) => fixture.league.id === WORLD_CUP_LEAGUE_ID,
  );

  if (worldCupFromLive.length > 0) {
    return {
      fixtures: worldCupFromLive,
      source: "all-live",
    };
  }

  return {
    fixtures: allLive,
    source: "all-live",
    planNotice:
      "Plan Free: el Mundial 2026 no está incluido. Mostrando partidos en vivo disponibles en tu suscripción.",
  };
}

/**
 * Calendario del día con fallback silencioso si la temporada 2026 no está en el plan.
 */
export async function fetchTodayFixturesWithFallback(
  date: string,
): Promise<ApiFixtureItem[]> {
  try {
    return await fetchTodayWorldCupFixtures(date);
  } catch (error) {
    if (isFreePlanSeasonError(error)) {
      return [];
    }

    throw error;
  }
}
