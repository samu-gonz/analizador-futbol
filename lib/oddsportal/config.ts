const DEFAULT_ODDS_PORTAL_BASE =
  process.env.ODDS_PORTAL_BASE_URL?.trim() || "https://www.cuotasahora.com";

export function isOddsPortalScrapingEnabled(): boolean {
  const flag = process.env.ODDS_PORTAL_SCRAPING_ENABLED?.trim().toLowerCase();

  if (flag === "false" || flag === "0") {
    return false;
  }

  if (flag === "true" || flag === "1") {
    return true;
  }

  return process.env.NODE_ENV === "development";
}

export function isOddsPortalScrapingAvailable(): boolean {
  if (!isOddsPortalScrapingEnabled()) {
    return false;
  }

  if (process.env.VERCEL === "1") {
    return false;
  }

  return typeof window === "undefined";
}

export function getOddsPortalCategoryUrl(isWorldCup: boolean): string {
  if (isWorldCup) {
    return `${DEFAULT_ODDS_PORTAL_BASE}/football/world/campeonato-del-mundo-2026/`;
  }

  return `${DEFAULT_ODDS_PORTAL_BASE}/matches/football/`;
}
