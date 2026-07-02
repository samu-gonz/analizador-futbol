import { WORLD_CUP_COMPETITION_ID } from "@/lib/sportsApiPro/config";
import type { SapGame } from "@/lib/sportsApiPro/types";

export const WORLD_CUP_TOURNAMENT_START = new Date("2026-06-11T00:00:00Z");
export const WORLD_CUP_TOURNAMENT_END = new Date("2026-07-19T23:59:59Z");

export function formatAllScoresDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

export function getTournamentDates(): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(WORLD_CUP_TOURNAMENT_START);

  while (cursor <= WORLD_CUP_TOURNAMENT_END) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function filterWorldCupGames(games: SapGame[]): SapGame[] {
  return games.filter((game) => game.competitionId === WORLD_CUP_COMPETITION_ID);
}
