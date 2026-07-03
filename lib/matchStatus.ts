import type { Match, MatchStatus } from "@/types/football";

export function isMatchFinished(status: MatchStatus): boolean {
  return status === "finished";
}

export function isMatchEligibleForCombinada(status: MatchStatus): boolean {
  return status === "scheduled" || status === "live";
}

export function shouldShowMatchScore(match: Match): boolean {
  if (!match.score) {
    return false;
  }

  return match.status === "finished" || match.status === "live";
}

export function formatMatchScore(match: Match): string {
  if (!match.score) {
    return "";
  }

  return `${match.score.home} - ${match.score.away}`;
}
