export type MarketTabId =
  | "principales"
  | "goles"
  | "corners"
  | "tarjetas"
  | "mitades"
  | "jugadores"
  | "otros";

export interface Bet365MarketSelection {
  id: string;
  marketKey: string;
  marketName: string;
  selectionName: string;
  decimalOdd: number;
  impliedProbability: number;
  estimatedProbability: number;
  valuePercent: number;
  hasValue: boolean;
  point?: number;
  description?: string;
}

export interface Bet365MarketGroup {
  marketKey: string;
  marketName: string;
  selections: Bet365MarketSelection[];
}

export interface Bet365MarketsTab {
  id: MarketTabId;
  label: string;
  groups: Bet365MarketGroup[];
}

export interface Bet365MarketsPayload {
  eventId: string | null;
  sportKey: string | null;
  bookmaker: "bet365";
  tabs: Bet365MarketsTab[];
  totalSelections: number;
  valueBetsCount: number;
  fetchedMarkets: number;
  source: "the-odds-api" | "sports-api-pro" | "unavailable";
  message?: string;
}
