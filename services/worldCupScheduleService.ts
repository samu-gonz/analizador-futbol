import {
  filterWorldCupGames,
  formatAllScoresDate,
  getTournamentDates,
} from "@/lib/sportsApiPro/schedule";
import type { SapBracketGameRef, SapGame } from "@/lib/sportsApiPro/types";
import {
  fetchAllScoresByDate,
  fetchWorldCupBrackets,
  fetchWorldCupGame,
  fetchWorldCupMatches,
  fetchWorldCupResults,
} from "@/services/sportsApiProClient";

const SCHEDULE_CACHE_TTL_MS = 5 * 60 * 1000;
const DATE_FETCH_BATCH_SIZE = 27;
const GAME_FETCH_BATCH_SIZE = 6;

let scheduleCache: { games: SapGame[]; expiresAt: number } | null = null;

function mergeGames(gameLists: SapGame[][]): SapGame[] {
  const byId = new Map<number, SapGame>();

  for (const games of gameLists) {
    for (const game of games) {
      byId.set(game.id, game);
    }
  }

  return Array.from(byId.values());
}

function extractBracketGameIds(
  brackets: Awaited<ReturnType<typeof fetchWorldCupBrackets>>,
): number[] {
  const ids = new Set<number>();

  function collectGames(games: SapBracketGameRef[] | undefined) {
    for (const game of games ?? []) {
      if (game.gameId) {
        ids.add(game.gameId);
      }
    }
  }

  function walkGroups(
    groups: Array<{ games?: SapBracketGameRef[]; stages?: unknown[] }> | undefined,
  ) {
    for (const group of groups ?? []) {
      collectGames(group.games);

      if (Array.isArray(group.stages)) {
        walkStages(group.stages as Array<{ groups?: Array<{ games?: SapBracketGameRef[] }> }>);
      }
    }
  }

  function walkStages(
    stages: Array<{ groups?: Array<{ games?: SapBracketGameRef[]; stages?: unknown[] }> }> | undefined,
  ) {
    for (const stage of stages ?? []) {
      walkGroups(stage.groups);
    }
  }

  for (const bracket of brackets.data?.brackets ?? []) {
    walkStages(bracket.stages);
  }

  return Array.from(ids);
}

async function fetchScheduleGamesByDate(): Promise<SapGame[]> {
  const dates = getTournamentDates();
  const games: SapGame[] = [];

  for (let index = 0; index < dates.length; index += DATE_FETCH_BATCH_SIZE) {
    const batch = dates.slice(index, index + DATE_FETCH_BATCH_SIZE);

    const responses = await Promise.all(
      batch.map((date) =>
        fetchAllScoresByDate(formatAllScoresDate(date)).catch(() => ({
          success: true,
          type: "allscores",
          data: { games: [] as SapGame[] },
        })),
      ),
    );

    for (const response of responses) {
      games.push(...filterWorldCupGames(response.data?.games ?? []));
    }
  }

  return games;
}

async function fetchMissingBracketGames(existingIds: Set<number>): Promise<SapGame[]> {
  const brackets = await fetchWorldCupBrackets().catch(() => ({
    success: true,
    data: { brackets: [] },
  }));

  const missingIds = extractBracketGameIds(brackets).filter((id) => !existingIds.has(id));
  const games: SapGame[] = [];

  for (let index = 0; index < missingIds.length; index += GAME_FETCH_BATCH_SIZE) {
    const batch = missingIds.slice(index, index + GAME_FETCH_BATCH_SIZE);

    const responses = await Promise.all(
      batch.map((gameId) =>
        fetchWorldCupGame(gameId).catch(() => null),
      ),
    );

    for (const response of responses) {
      if (response?.data?.game) {
        games.push(response.data.game);
      }
    }
  }

  return games;
}

export async function fetchFullWorldCupSchedule(): Promise<SapGame[]> {
  if (scheduleCache && scheduleCache.expiresAt > Date.now()) {
    return scheduleCache.games;
  }

  const [scheduleGames, matchesResponse, resultsResponse] = await Promise.all([
    fetchScheduleGamesByDate(),
    fetchWorldCupMatches(),
    fetchWorldCupResults().catch(() => ({ success: true, data: { games: [] as SapGame[] } })),
  ]);

  const merged = mergeGames([
    scheduleGames,
    resultsResponse.data?.games ?? [],
    matchesResponse.data?.games ?? [],
  ]);

  const existingIds = new Set(merged.map((game) => game.id));
  const bracketGames = await fetchMissingBracketGames(existingIds);

  const games = mergeGames([merged, bracketGames]);

  scheduleCache = {
    games,
    expiresAt: Date.now() + SCHEDULE_CACHE_TTL_MS,
  };

  return games;
}
