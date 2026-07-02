export interface StandingsRow {
  position: number;
  teamId: string;
  teamName: string;
  logoUrl?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingsGroup {
  id: string;
  name: string;
  rows: StandingsRow[];
}
