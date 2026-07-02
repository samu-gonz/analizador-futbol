export interface ApiFootballEnvelope<T> {
  get: string;
  parameters: Record<string, string | number>;
  errors: string[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: T;
}

export interface ApiFixtureTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

export interface ApiFixtureItem {
  fixture: {
    id: number;
    date: string;
    status: ApiFixtureStatus;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  teams: {
    home: ApiFixtureTeam;
    away: ApiFixtureTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface ApiStatisticEntry {
  type: string;
  value: number | string | null;
}

export interface ApiFixtureStatisticsItem {
  team: { id: number; name: string };
  statistics: ApiStatisticEntry[];
}

export interface ApiOddsValue {
  value: string;
  odd: string;
  handicap?: string | null;
  /** Marca la cuota principal cuando Bet365 ofrece varias líneas */
  main?: boolean;
  suspended?: boolean;
}

export interface ApiOddsBet {
  id: number;
  name: string;
  values: ApiOddsValue[];
}

export interface ApiOddsBookmaker {
  id: number;
  name: string;
  bets: ApiOddsBet[];
}

export interface ApiLiveOddsItem {
  fixture: { id: number };
  bookmakers: ApiOddsBookmaker[];
}
