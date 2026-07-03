export type { MatchOdds, OddsMarket, ScrapeOptions } from "./types";
export { scrapeOddsPortal } from "./scrapeOddsPortal";
export { scrapeBet365OddsForMatch } from "./singleMatch";
export {
  isOddsPortalScrapingAvailable,
  isOddsPortalScrapingEnabled,
  getOddsPortalCategoryUrl,
} from "./config";
