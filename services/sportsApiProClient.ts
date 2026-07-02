import { WORLD_CUP_COMPETITION_ID } from "@/lib/sportsApiPro/config";
import type {
  SapGameEventsEnvelope,
  SapGameDetailEnvelope,
  SapGamesEnvelope,
  SapWorldCupBracketsEnvelope,
  SapWorldCupOddsEnvelope,
  SapWorldCupStandingsEnvelope,
} from "@/lib/sportsApiPro/types";
import { ApiClientError, apiGet } from "@/services/apiClient";

export const LIVE_STATUS_GROUP = 3;

export async function fetchFootballLiveGames(): Promise<SapGamesEnvelope> {
  return apiGet<SapGamesEnvelope>("/v1/football/live");
}

export async function fetchWorldCupMatches(): Promise<SapGamesEnvelope> {
  return apiGet<SapGamesEnvelope>("/v1/world-cup/matches");
}

export async function fetchWorldCupResults(): Promise<SapGamesEnvelope> {
  return apiGet<SapGamesEnvelope>("/v1/world-cup/results");
}

export async function fetchWorldCupOdds(): Promise<SapWorldCupOddsEnvelope> {
  return apiGet<SapWorldCupOddsEnvelope>("/v1/world-cup/odds");
}

export async function fetchWorldCupStandings(): Promise<SapWorldCupStandingsEnvelope> {
  return apiGet<SapWorldCupStandingsEnvelope>("/v1/world-cup/standings");
}

export async function fetchWorldCupBrackets(): Promise<SapWorldCupBracketsEnvelope> {
  return apiGet<SapWorldCupBracketsEnvelope>("/v1/world-cup/brackets");
}

export async function fetchWorldCupGame(
  gameId: number,
): Promise<SapGameDetailEnvelope> {
  return apiGet<SapGameDetailEnvelope>(`/v1/world-cup/game/${gameId}`);
}

export async function fetchAllScoresByDate(
  formattedDate: string,
): Promise<SapGamesEnvelope> {
  return apiGet<SapGamesEnvelope>("/v1/football/games/allscores", {
    params: {
      startDate: formattedDate,
      endDate: formattedDate,
      sports: 1,
    },
  });
}

export async function fetchGameEvents(gameId: number): Promise<SapGameEventsEnvelope> {
  return apiGet<SapGameEventsEnvelope>(`/v1/world-cup/game/${gameId}/events`);
}

export function isWorldCupGame(competitionId: number): boolean {
  return competitionId === WORLD_CUP_COMPETITION_ID;
}

export function isLiveGame(statusGroup: number): boolean {
  return statusGroup === LIVE_STATUS_GROUP;
}

export { ApiClientError as SportsApiProError };
