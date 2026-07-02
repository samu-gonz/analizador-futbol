import { buildBet365MarketsFromAnalysedMatch } from "@/lib/bet365/buildFromAnalysedMatch";
import { estimateSelectionProbability } from "@/lib/bet365/probabilityEstimator";
import { percentToDecimalOdd } from "@/lib/sportsApiPro/odds";
import type { SapGameOdds, SapPredictionMarket } from "@/lib/sportsApiPro/types";
import { calculatePoissonProbability } from "@/services/predictionEngine";
import { fetchWorldCupOdds } from "@/services/sportsApiProClient";
import {
  calculateValuePercent,
  hasValueFromEstimate,
  impliedProbabilityFromOdds,
} from "@/lib/valueBetting";
import {
  MARKET_TAB_LABELS,
  MARKET_TAB_ORDER,
  getMarketLabel,
  getMarketTab,
} from "@/lib/oddsApi/soccerMarkets";
import type {
  Bet365MarketGroup,
  Bet365MarketsPayload,
  Bet365MarketsTab,
  MarketTabId,
} from "@/types/bet365Markets";
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

function buildSelection(
  market: OddsApiMarket,
  outcome: OddsApiOutcome,
  context: Parameters<typeof estimateSelectionProbability>[3],
): Bet365MarketsPayload["tabs"][number]["groups"][number]["selections"][number] {
  const impliedProbability = impliedProbabilityFromOdds(outcome.price);
  const estimatedProbability = estimateSelectionProbability(
    market.key,
    outcome,
    market.outcomes,
    context,
  );

  return {
    id: `${market.key}-${outcome.name}-${outcome.point ?? "na"}`,
    marketKey: market.key,
    marketName: getMarketLabel(market.key),
    selectionName:
      outcome.point !== undefined
        ? `${outcome.name} (${outcome.point})`
        : outcome.name,
    decimalOdd: outcome.price,
    impliedProbability,
    estimatedProbability,
    valuePercent: calculateValuePercent(outcome.price, estimatedProbability),
    hasValue: hasValueFromEstimate(outcome.price, estimatedProbability),
    point: outcome.point,
  };
}

function groupIntoTabs(
  markets: OddsApiMarket[],
  context: Parameters<typeof estimateSelectionProbability>[3],
): Bet365MarketsTab[] {
  const tabMap = new Map<MarketTabId, Map<string, Bet365MarketGroup>>();

  for (const tabId of MARKET_TAB_ORDER) {
    tabMap.set(tabId, new Map());
  }

  for (const market of markets) {
    if (market.outcomes.length === 0) {
      continue;
    }

    const tabId = getMarketTab(market.key);
    const groups = tabMap.get(tabId) ?? new Map();
    const marketName =
      market.key.startsWith("sap_")
        ? market.key.replace(/^sap_/, "").replaceAll("_", " ")
        : getMarketLabel(market.key);

    groups.set(market.key, {
      marketKey: market.key,
      marketName,
      selections: market.outcomes.map((outcome) =>
        buildSelection(market, outcome, context),
      ),
    });

    tabMap.set(tabId, groups);
  }

  return MARKET_TAB_ORDER.map((tabId) => ({
    id: tabId,
    label: MARKET_TAB_LABELS[tabId],
    groups: Array.from(tabMap.get(tabId)?.values() ?? []),
  })).filter((tab) => tab.groups.length > 0);
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
      bookmaker: "bet365",
      tabs: [],
      totalSelections: 0,
      valueBetsCount: 0,
      fetchedMarkets: 0,
      source: "sports-api-pro",
      message:
        "No hay mercados disponibles para este partido en SportsAPI Pro.",
    };
  }

  const tabs = groupIntoTabs(markets, context);
  const allSelections = tabs.flatMap((tab) =>
    tab.groups.flatMap((group) => group.selections),
  );

  return {
    eventId: params.gameId,
    sportKey: "sports-api-pro",
    bookmaker: "bet365",
    tabs,
    totalSelections: allSelections.length,
    valueBetsCount: allSelections.filter((selection) => selection.hasValue).length,
    fetchedMarkets: markets.length,
    source: "sports-api-pro",
    message:
      "Cuotas de comunidad vía SportsAPI Pro. Para todos los mercados Bet365, añade THE_ODDS_API_KEY.",
  };
}
