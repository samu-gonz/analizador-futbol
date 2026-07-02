export interface SapCompetitor {
  id: number;
  name: string;
  score: number;
  imageVersion?: number;
}

export interface SapGame {
  id: number;
  competitionId: number;
  competitionDisplayName: string;
  startTime: string;
  statusGroup: number;
  statusText: string;
  shortStatusText: string;
  gameTime: number;
  homeCompetitor: SapCompetitor;
  awayCompetitor: SapCompetitor;
}

export interface SapGamesEnvelope {
  success: boolean;
  type: string;
  data: {
    games: SapGame[];
  };
}

export interface SapPredictionOption {
  num: number;
  name: string;
  vote?: {
    percentage: number;
  };
}

export interface SapPredictionMarket {
  title: string;
  options: SapPredictionOption[];
}

export interface SapGameOdds {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  statusText: string;
  predictions?: {
    predictions: SapPredictionMarket[];
  };
}

export interface SapWorldCupOddsEnvelope {
  success: boolean;
  data: {
    games: SapGameOdds[];
  };
}

export interface SapGameEvent {
  competitorId: number;
  eventType: {
    id: number;
    name: string;
  };
}

export interface SapGameEventsEnvelope {
  success: boolean;
  data: {
    events: SapGameEvent[];
  };
}

export interface SapStandingsGroupMeta {
  num: number;
  name: string;
}

export interface SapStandingsRow {
  position: number;
  groupNum: number;
  gamePlayed: number;
  gamesWon: number;
  gamesEven: number;
  gamesLost: number;
  for: number;
  against: number;
  points: number;
  competitor: {
    id: number;
    name: string;
    imageVersion?: number;
    symbolicName?: string;
  };
}

export interface SapStandingsTable {
  stageNum: number;
  groups: SapStandingsGroupMeta[];
  rows: SapStandingsRow[];
}

export interface SapWorldCupStandingsEnvelope {
  success: boolean;
  data: {
    standings: SapStandingsTable[];
  };
}

export interface SapBracketGameRef {
  gameId: number;
  startTime: string;
}

export interface SapWorldCupBracketsEnvelope {
  success: boolean;
  data: {
    brackets: Array<{
      stages?: Array<{
        groups?: Array<{
          games?: SapBracketGameRef[];
          stages?: Array<{
            groups?: Array<{
              games?: SapBracketGameRef[];
            }>;
          }>;
        }>;
      }>;
    }>;
  };
}

export interface SapGameDetailEnvelope {
  success: boolean;
  data: {
    game: SapGame;
  };
}
