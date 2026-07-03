import { buildBet365MarketsFromAnalysedMatch } from "@/lib/bet365/buildFromAnalysedMatch";
import { buildMarketsPayload } from "@/lib/bet365/marketsPayload";
import { percentToDecimalOdd } from "@/lib/sportsApiPro/odds";
import type { SapGameOdds, SapPredictionMarket } from "@/lib/sportsApiPro/types";
import { calculatePoissonProbability } from "@/services/predictionEngine";
import { fetchWorldCupOdds } from "@/services/sportsApiProClient";
import type { Bet365MarketsPayload } from "@/types/bet365Markets";
import type { OddsApiMarket, OddsApiOutcome } from "@/types/theOddsApi";

function mapPredictionTitleToMarketKey(title: string): string {
  const normalized = title.toLowerCase();

  if (normalized.includes("who will win") || normalized.includes("1x2")) {
    return "h2h";
  }

  if (normalized.includes("both teams") || normalized.includes("btts")) {
    return "btts";
  }

  if (normalized.includes("total goals") || normalized.includes("over/under")) {
    return "totals";
  }

  if (normalized.includes("corner")) {
    return "alternate_totals_corners";
  }

  if (normalized.includes("card") || normalized.includes("booking")) {
    return "alternate_totals_cards";
  }

  if (normalized.includes("half")) {
    return "totals_h1";
  }

  return `sap_${normalized.replace(/[^a-z0-9]+/g, "_").slice(0, 40)}`;
}

function predictionMarketsToOddsApiMarkets(
  markets: SapPredictionMarket[],
): OddsApiMarket[] {
  return markets.map((market) => {
    const lineMatch = market.title.match(/[\d.]+/);
    const line = lineMatch ? Number.parseFloat(lineMatch[0]) : undefined;
    const marketKey = mapPredictionTitleToMarketKey(market.title);

    const outcomes: OddsApiOutcome[] = market.options
      .map((option) => {
        const percentage = option.vote?.percentage ?? 0;
        const price = percentToDecimalOdd(percentage);

        if (price <= 1) {
          return null;
        }

        const outcome: OddsApiOutcome = {
          name: option.name,
          price,
        };

        if (
          line !== undefined &&
          (option.name.toLowerCase().includes("over") ||
            option.name.toLowerCase().includes("under"))
        ) {
          outcome.point = line;
        }

        return outcome;
      })
      .filter((outcome): outcome is OddsApiOutcome => outcome !== null);

    return {
      key: marketKey,
      outcomes,
    };
  });
}

function buildCornersMarket(
  homeTeamId: string,
  awayTeamId: string,
): OddsApiMarket {
  const poisson = calculatePoissonProbability(homeTeamId, awayTeamId);
  const line = 9.5;
  const overProb = poisson.cornersOverUnder95.over;
  const underProb = poisson.cornersOverUnder95.under;

  return {
    key: "alternate_totals_corners",
    outcomes: [
      { name: "Over", price: percentToDecimalOdd(overProb), point: line },
      { name: "Under", price: percentToDecimalOdd(underProb), point: line },
    ],
  };
}

export async function getBet365MarketsFromSportsApiPro(params: {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  analysedMatch?: import("@/types/football").AnalysedMatch;
}): Promise<Bet365MarketsPayload> {
  if (params.analysedMatch) {
    return buildBet365MarketsFromAnalysedMatch(params.analysedMatch);
  }

  const gameId = Number.parseInt(params.gameId, 10);
  const oddsResponse = await fetchWorldCupOdds().catch(() => ({
    success: true,
    data: { games: [] as SapGameOdds[] },
  }));

  const oddsEntry = oddsResponse.data?.games?.find((entry) => entry.gameId === gameId);
  const predictionMarkets = oddsEntry?.predictions?.predictions ?? [];

  const poisson = calculatePoissonProbability(params.homeTeamId, params.awayTeamId);
  const context = {
    homeTeamName: params.homeTeam,
    awayTeamName: params.awayTeam,
    poisson,
  };

  const markets: OddsApiMarket[] = [
    ...predictionMarketsToOddsApiMarkets(predictionMarkets),
    buildCornersMarket(params.homeTeamId, params.awayTeamId),
  ];

  if (markets.length === 0) {
    return {
      eventId: params.gameId,
      sportKey: "sports-api-pro",
      bookmaker: "sports-api-pro",
      bookmakerTitle: "SportsAPI Pro",
      tabs: [],
      totalSelections: 0,
      valueBetsCount: 0,
      fetchedMarkets: 0,
      source: "sports-api-pro",
      message:
        "No hay mercados disponibles para este partido en SportsAPI Pro.",
    };
  }

  return buildMarketsPayload({
    markets,
    context,
    eventId: params.gameId,
    sportKey: "sports-api-pro",
    bookmaker: "sports-api-pro",
    bookmakerTitle: "SportsAPI Pro",
    source: "sports-api-pro",
    message:
      "Cuotas de comunidad vía SportsAPI Pro. Para todos los mercados Bet365, añade THE_ODDS_API_KEY.",
  });
}
