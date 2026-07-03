export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface League {
  id: string;
  name: string;
  country: string;
  logoUrl?: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  date: string;
  status: MatchStatus;
  score?: {
    home: number;
    away: number;
  };
}

export interface MatchResultOdds {
  home: number;
  draw: number;
  away: number;
}

export interface OverUnderOdds {
  over: number;
  under: number;
  line: number;
}

export interface MarketOdds {
  matchResult1X2: MatchResultOdds;
  goalsOverUnder25: OverUnderOdds;
  cornersOverUnder95: OverUnderOdds;
}

export interface OutcomePrediction {
  probability: number;
  hasValue: boolean;
}

export interface MatchResultPrediction {
  home: OutcomePrediction;
  draw: OutcomePrediction;
  away: OutcomePrediction;
}

export interface OverUnderPrediction {
  over: OutcomePrediction;
  under: OutcomePrediction;
}

export interface Predictions {
  matchResult1X2: MatchResultPrediction;
  goalsOverUnder25: OverUnderPrediction;
  cornersOverUnder95: OverUnderPrediction;
}

export interface AnalysedMatch {
  match: Match;
  marketOdds: MarketOdds;
  predictions: Predictions;
}

export interface PoissonProbabilities {
  matchResult1X2: {
    home: number;
    draw: number;
    away: number;
  };
  goalsOverUnder25: {
    over: number;
    under: number;
  };
  cornersOverUnder95: {
    over: number;
    under: number;
  };
}

export interface TeamHistoricalStats {
  goalsScoredPerGame: number;
  goalsConcededPerGame: number;
  cornersForPerGame: number;
  cornersAgainstPerGame: number;
}

export type MarketRow = {
  market: string;
  selection: string;
  ourProbability: number;
  fairOdd: number;
  marketOdd: number;
  hasValue: boolean;
};
