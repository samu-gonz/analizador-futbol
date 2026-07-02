import { getCompetitorLogoUrl } from "@/lib/sportsApiPro/images";
import type { SapStandingsRow } from "@/lib/sportsApiPro/types";
import { fetchWorldCupStandings } from "@/services/sportsApiProClient";
import type { StandingsGroup, StandingsRow } from "@/types/standings";

function mapStandingsRow(row: SapStandingsRow): StandingsRow {
  return {
    position: row.position,
    teamId: String(row.competitor.id),
    teamName: row.competitor.name,
    logoUrl: getCompetitorLogoUrl(
      row.competitor.id,
      row.competitor.imageVersion,
    ),
    played: row.gamePlayed,
    won: row.gamesWon,
    drawn: row.gamesEven,
    lost: row.gamesLost,
    goalsFor: row.for,
    goalsAgainst: row.against,
    goalDifference: row.for - row.against,
    points: row.points,
  };
}

export async function getWorldCupStandings(): Promise<StandingsGroup[]> {
  const response = await fetchWorldCupStandings();
  const groupStage =
    response.data?.standings?.find((table) => table.stageNum === 1) ??
    response.data?.standings?.[0];

  if (!groupStage) {
    return [];
  }

  const groupNames = new Map(
    (groupStage.groups ?? []).map((group) => [group.num, group.name]),
  );

  const grouped = new Map<number, StandingsRow[]>();

  for (const row of groupStage.rows ?? []) {
    const groupNum = row.groupNum;
    const rows = grouped.get(groupNum) ?? [];
    rows.push(mapStandingsRow(row));
    grouped.set(groupNum, rows);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([groupNum, rows]) => ({
      id: String(groupNum),
      name: groupNames.get(groupNum) ?? `Grupo ${groupNum}`,
      rows: rows.sort((a, b) => a.position - b.position),
    }));
}
