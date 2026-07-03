export interface MatchOdds {
  match: string;
  dateTime: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

export type OddsMarket = "1x2" | "totals";

export interface ScrapeOptions {
  /** URL de categoría OddsPortal (liga, partidos de hoy, etc.) */
  url: string;
  /** Mercado a extraer. Por defecto 1X2. */
  market?: OddsMarket;
  /** Tiempo máximo de espera por selector (ms). */
  timeoutMs?: number;
  /** Si true, muestra el navegador (útil ante bloqueos anti-bot). */
  headful?: boolean;
  /** Máximo de partidos a procesar en detalle (0 = sin límite). */
  maxMatches?: number;
}

export interface BrowserLaunchOptions {
  headful?: boolean;
}
