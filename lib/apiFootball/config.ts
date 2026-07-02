export const API_FOOTBALL_BASE_URL =
  process.env.API_FOOTBALL_BASE_URL?.trim() || "https://v3.football.api-sports.io";

/** FIFA World Cup — API-Football league id */
export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;

/** Estados de partido en juego según API-Football */
export const LIVE_MATCH_STATUSES = "1H-HT-2H-ET-P-BT-LIVE" as const;

export function getApiFootballKey(): string | undefined {
  return process.env.API_FOOTBALL_KEY?.trim() || undefined;
}

export function getApiFootballKeyStatus(): "missing" | "empty" | "ok" {
  const raw = process.env.API_FOOTBALL_KEY;

  if (raw === undefined) {
    return "missing";
  }

  if (!raw.trim()) {
    return "empty";
  }

  return "ok";
}

export function isApiFootballConfigured(): boolean {
  return getApiFootballKeyStatus() === "ok";
}

export function getApiFootballSetupMessage(): string {
  const status = getApiFootballKeyStatus();

  if (status === "empty") {
    return "API_FOOTBALL_KEY está vacía en .env.local. Pega tu clave del dashboard de API-Football y reinicia npm run dev.";
  }

  return "Configura API_FOOTBALL_KEY en .env.local para seguir el Mundial en vivo.";
}

export { BET365_BOOKMAKER_ID, BET365_BOOKMAKER_NAME } from "@/lib/apiFootball/bet365";
