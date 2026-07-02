import type { League, Team } from "@/types/football";

export type LiveMatchPeriod = "1H" | "2H" | "HT";

export interface LiveScore {
  home: number;
  away: number;
}

export interface LiveCorners {
  home: number;
  away: number;
}

export interface LiveCards {
  homeYellow: number;
  homeRed: number;
  awayYellow: number;
  awayRed: number;
}

export interface LiveMatch {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  score: LiveScore;
  corners: LiveCorners;
  cards: LiveCards;
  minute: number;
  period: LiveMatchPeriod;
  status: "live";
}

/**
 * Marcador virtual para hándicaps asiáticos en vivo.
 * Al apostar en el minuto X, el hándicap arranca en 0-0 desde ese instante;
 * los goles previos no cuentan para la línea.
 */
export interface UserContextScore {
  home: 0;
  away: 0;
  capturedAtMinute: number;
}

export interface LiveMatchResultOdds {
  home: number;
  draw: number;
  away: number;
}

export interface AsianGoalsOdds {
  line: number;
  over: number;
  under: number;
}

export interface AsianHandicapOdds {
  line: number;
  home: number;
  away: number;
  userContextScore: UserContextScore;
}

export interface LiveOdds {
  bookmaker: string;
  matchResult1X2: LiveMatchResultOdds;
  asianGoals: AsianGoalsOdds;
  asianHandicap: AsianHandicapOdds;
}

export interface LiveOutcomePrediction {
  probability: number;
  hasValue: boolean;
}

export interface LiveMatchResultPrediction {
  home: LiveOutcomePrediction;
  draw: LiveOutcomePrediction;
  away: LiveOutcomePrediction;
}

export interface LiveAsianGoalsPrediction {
  over: LiveOutcomePrediction;
  under: LiveOutcomePrediction;
}

export interface LiveAsianHandicapPrediction {
  home: LiveOutcomePrediction;
  away: LiveOutcomePrediction;
}

export interface LivePredictions {
  matchResult1X2: LiveMatchResultPrediction;
  asianGoals: LiveAsianGoalsPrediction;
  asianHandicap: LiveAsianHandicapPrediction;
  remainingMinutes: number;
}

export interface LiveAnalysedMatch {
  match: LiveMatch;
  odds: LiveOdds;
  predictions: LivePredictions;
  updatedAt: string;
}

export type LiveOddsKey =
  | "1x2-home"
  | "1x2-draw"
  | "1x2-away"
  | "ag-over"
  | "ag-under"
  | "ah-home"
  | "ah-away";

export type OddsFlashDirection = "up" | "down";

export type LiveOddsFlashMap = Partial<Record<LiveOddsKey, OddsFlashDirection>>;

export type LiveMarketRow = {
  key: LiveOddsKey;
  market: string;
  selection: string;
  ourProbability: number;
  fairOdd: number;
  marketOdd: number;
  hasValue: boolean;
};

export interface TodayFixtureSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  status: string;
  score: string;
  isLive: boolean;
}

export interface LiveApiResponse {
  matches: LiveAnalysedMatch[];
  todaySchedule: TodayFixtureSummary[];
  meta: {
    source: string;
    tournament: string;
    season: number;
    configured: boolean;
    liveCount?: number;
    updatedAt?: string;
    error?: string;
    oddsBookmaker?: string;
    planNotice?: string;
    dataSource?: string;
  };
}
