export const THE_ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

export const BET365_BOOKMAKER_KEY = "bet365";

/** Regiones ampliadas: Bet365 suele no publicar en Mundial; otras casas sí. */
export const ODDS_API_REGIONS = "uk,eu,us,au";

/**
 * Orden de prioridad para cuotas reales.
 * Bet365 primero; si no hay líneas, se usa la siguiente casa disponible.
 */
export const PREFERRED_BOOKMAKER_KEYS = [
  "bet365",
  "betrivers",
  "pinnacle",
  "unibet_uk",
  "betway",
  "coral",
  "ladbrokes_uk",
  "bovada",
  "mybookieag",
  "gtbets",
] as const;

export const BOOKMAKER_DISPLAY_NAMES: Record<string, string> = {
  bet365: "Bet365",
  betrivers: "BetRivers",
  pinnacle: "Pinnacle",
  unibet_uk: "Unibet",
  betway: "Betway",
  coral: "Coral",
  ladbrokes_uk: "Ladbrokes",
  bovada: "Bovada",
  mybookieag: "MyBookie",
  gtbets: "GTbets",
};

export function getBookmakerDisplayName(key: string, title?: string): string {
  return BOOKMAKER_DISPLAY_NAMES[key] ?? title ?? key;
}

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
