import { buildMarketsPayload } from "@/lib/bet365/marketsPayload";
import { createMemoryCache } from "@/lib/cache/memoryCache";
import {
  getOddsPortalCategoryUrl,
  isOddsPortalScrapingAvailable,
} from "@/lib/oddsportal/config";
import { scrapeBet365OddsForMatch } from "@/lib/oddsportal/singleMatch";
import { calculatePoissonProbability } from "@/services/predictionEngine";
import type { Bet365MarketsPayload } from "@/types/bet365Markets";
import type { OddsApiMarket } from "@/types/theOddsApi";

const ODDS_PORTAL_CACHE_TTL_MS = 20 * 60 * 1000;
const oddsPortalCache = createMemoryCache<Bet365MarketsPayload>(ODDS_PORTAL_CACHE_TTL_MS);

export async function getBet365MarketsFromOddsPortal(params: {
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  isWorldCup?: boolean;
}): Promise<Bet365MarketsPayload | null> {
  if (!isOddsPortalScrapingAvailable()) {
    return null;
  }

  const cacheKey = `${params.homeTeam}-${params.awayTeam}-${params.isWorldCup ? "wc" : "all"}`;
  const cached = oddsPortalCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const scraped = await scrapeBet365OddsForMatch({
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      categoryUrl: getOddsPortalCategoryUrl(params.isWorldCup ?? false),
    });

    if (!scraped) {
      return null;
    }

    const poisson = calculatePoissonProbability(params.homeTeamId, params.awayTeamId);
    const markets: OddsApiMarket[] = [
      {
        key: "h2h",
        outcomes: [
          { name: params.homeTeam, price: scraped.odds.home },
          { name: "Draw", price: scraped.odds.draw },
          { name: params.awayTeam, price: scraped.odds.away },
        ],
      },
    ];

    const payload = buildMarketsPayload({
      markets,
      context: {
        homeTeamName: params.homeTeam,
        awayTeamName: params.awayTeam,
        poisson,
      },
      eventId: null,
      sportKey: "oddsportal",
      bookmaker: "bet365",
      bookmakerTitle: "Bet365",
      source: "oddsportal",
      message: "Cuotas Bet365 1X2 vía OddsPortal (scraping local).",
    });

    oddsPortalCache.set(cacheKey, payload);

    return payload;
  } catch {
    return null;
  }
}
