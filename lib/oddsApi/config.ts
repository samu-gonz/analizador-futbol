export const THE_ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

export const BET365_BOOKMAKER_KEY = "bet365";

export const WORLD_CUP_SPORT_KEY = "soccer_fifa_world_cup";

export const SOCCER_SPORT_KEYS = [
  WORLD_CUP_SPORT_KEY,
  "soccer_fifa_world_cup_womens",
  "soccer_epl",
  "soccer_spain_la_liga",
  "soccer_germany_bundesliga",
  "soccer_italy_serie_a",
  "soccer_france_ligue_one",
  "soccer_uefa_champs_league",
] as const;

export function getTheOddsApiKey(): string | undefined {
  return process.env.THE_ODDS_API_KEY?.trim() || undefined;
}

export function isTheOddsApiConfigured(): boolean {
  return Boolean(getTheOddsApiKey());
}
