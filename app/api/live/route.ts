import { NextResponse } from "next/server";
import {
  getSportsApiProSetupMessage,
  isSportsApiProConfigured,
} from "@/lib/sportsApiPro/config";
import { LIVE_POLL_INTERVAL_MS } from "@/services/liveEngine";
import {
  buildAnalysedMatchFromSap,
  mapTodayFixtureSummary,
} from "@/services/sportsApiProMapper";
import {
  fetchFootballLiveGames,
  fetchGameEvents,
  fetchWorldCupMatches,
  fetchWorldCupOdds,
  isLiveGame,
  isWorldCupGame,
  SportsApiProError,
} from "@/services/sportsApiProClient";
import type { SapGame, SapGameOdds } from "@/lib/sportsApiPro/types";
import type { LiveAnalysedMatch } from "@/types/liveMatch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildOddsIndex(oddsGames: SapGameOdds[]): Map<number, SapGameOdds> {
  return new Map(oddsGames.map((entry) => [entry.gameId, entry]));
}

async function buildLiveAnalysedMatches(): Promise<{
  matches: LiveAnalysedMatch[];
  planNotice?: string;
  dataSource: string;
}> {
  const [worldCupMatches, allLive, worldCupOdds] = await Promise.all([
    fetchWorldCupMatches(),
    fetchFootballLiveGames(),
    fetchWorldCupOdds().catch(() => ({ success: true, data: { games: [] } })),
  ]);

  const oddsIndex = buildOddsIndex(worldCupOdds.data?.games ?? []);

  let liveGames: SapGame[] = (worldCupMatches.data?.games ?? []).filter((game) =>
    isLiveGame(game.statusGroup),
  );

  let dataSource = "world-cup-2026";
  let planNotice: string | undefined;

  if (liveGames.length === 0) {
    const worldCupFromAllLive = (allLive.data?.games ?? []).filter((game) =>
      isWorldCupGame(game.competitionId),
    );

    liveGames =
      worldCupFromAllLive.length > 0
        ? worldCupFromAllLive
        : (allLive.data?.games ?? []);

    dataSource = worldCupFromAllLive.length > 0 ? "world-cup-live" : "all-live";

    if (liveGames.length > 0 && worldCupFromAllLive.length === 0) {
      planNotice =
        "No hay partidos del Mundial en directo ahora. Mostrando otros partidos en vivo disponibles.";
    }
  }

  const analysed = await Promise.all(
    liveGames.map(async (game) => {
      const events =
        isWorldCupGame(game.competitionId)
          ? await fetchGameEvents(game.id)
              .then((response) => response.data?.events ?? [])
              .catch(() => [])
          : [];

      return buildAnalysedMatchFromSap(game, oddsIndex.get(game.id), events);
    }),
  );

  return {
    matches: analysed.sort((a, b) => b.match.minute - a.match.minute),
    planNotice,
    dataSource,
  };
}

export async function GET() {
  if (!isSportsApiProConfigured()) {
    return NextResponse.json(
      {
        matches: [] as LiveAnalysedMatch[],
        todaySchedule: [],
        meta: {
          source: "sportsapi-pro",
          tournament: "FIFA World Cup",
          season: 2026,
          configured: false,
          error: getSportsApiProSetupMessage(),
        },
      },
      { status: 503 },
    );
  }

  try {
    const [{ matches, planNotice, dataSource }, worldCupMatches] = await Promise.all([
      buildLiveAnalysedMatches(),
      fetchWorldCupMatches(),
    ]);

    const todaySchedule = (worldCupMatches.data?.games ?? []).map(mapTodayFixtureSummary);

    return NextResponse.json({
      matches,
      todaySchedule,
      meta: {
        source: "sportsapi-pro",
        tournament: "FIFA World Cup",
        season: 2026,
        configured: true,
        liveCount: matches.length,
        dataSource,
        planNotice,
        oddsBookmaker: "Bet365",
        oddsPollSeconds: LIVE_POLL_INTERVAL_MS / 1000,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message =
      error instanceof SportsApiProError
        ? error.message
        : "Error al obtener partidos en vivo del Mundial.";

    return NextResponse.json(
      {
        matches: [] as LiveAnalysedMatch[],
        todaySchedule: [],
        meta: {
          source: "sportsapi-pro",
          tournament: "FIFA World Cup",
          season: 2026,
          configured: true,
          error: message,
        },
      },
      { status: 502 },
    );
  }
}
