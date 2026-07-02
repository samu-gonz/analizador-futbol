import { estimateSelectionProbability } from "@/lib/bet365/probabilityEstimator";
import {
  MARKET_TAB_LABELS,
  MARKET_TAB_ORDER,
  getMarketLabel,
  getMarketTab,
} from "@/lib/oddsApi/soccerMarkets";
import {
  calculateValuePercent,
  hasValueFromEstimate,
  impliedProbabilityFromOdds,
} from "@/lib/valueBetting";
import type {
  Bet365MarketGroup,
  Bet365MarketSelection,
  Bet365MarketsPayload,
  Bet365MarketsTab,
  MarketTabId,
} from "@/types/bet365Markets";
import type { ProbabilityEstimateContext } from "@/lib/bet365/probabilityEstimator";
import type { OddsApiMarket, OddsApiOutcome } from "@/types/theOddsApi";

function formatSelectionName(outcome: OddsApiOutcome): string {
  if (outcome.point !== undefined) {
    const pointLabel = Number.isInteger(outcome.point)
      ? outcome.point
      : outcome.point.toFixed(2);

    return `${outcome.name} (${pointLabel})`;
  }

  if (outcome.description) {
    return `${outcome.description} — ${outcome.name}`;
  }

  return outcome.name;
}

function buildSelection(
  market: OddsApiMarket,
  outcome: OddsApiOutcome,
  context: ProbabilityEstimateContext,
): Bet365MarketSelection {
  const impliedProbability = impliedProbabilityFromOdds(outcome.price);
  const estimatedProbability = estimateSelectionProbability(
    market.key,
    outcome,
    market.outcomes,
    context,
  );

  return {
    id: `${market.key}-${outcome.name}-${outcome.point ?? "na"}-${outcome.description ?? ""}`,
    marketKey: market.key,
    marketName: getMarketLabel(market.key),
    selectionName: formatSelectionName(outcome),
    decimalOdd: outcome.price,
    impliedProbability,
    estimatedProbability,
    valuePercent: calculateValuePercent(outcome.price, estimatedProbability),
    hasValue: hasValueFromEstimate(outcome.price, estimatedProbability),
    point: outcome.point,
    description: outcome.description,
  };
}

export function groupMarketsIntoTabs(
  markets: OddsApiMarket[],
  context: ProbabilityEstimateContext,
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
    const marketName = market.key.startsWith("sap_")
      ? market.key.replace(/^sap_/, "").replaceAll("_", " ")
      : getMarketLabel(market.key);

    const selections = market.outcomes.map((outcome) =>
      buildSelection(market, outcome, context),
    );

    groups.set(market.key, {
      marketKey: market.key,
      marketName,
      selections,
    });

    tabMap.set(tabId, groups);
  }

  return MARKET_TAB_ORDER.map((tabId) => ({
    id: tabId,
    label: MARKET_TAB_LABELS[tabId],
    groups: Array.from(tabMap.get(tabId)?.values() ?? []).sort((a, b) =>
      a.marketName.localeCompare(b.marketName, "es"),
    ),
  })).filter((tab) => tab.groups.length > 0);
}

export function buildMarketsPayload(params: {
  markets: OddsApiMarket[];
  context: ProbabilityEstimateContext;
  eventId: string | null;
  sportKey: string | null;
  source: Bet365MarketsPayload["source"];
  message?: string;
}): Bet365MarketsPayload {
  const tabs = groupMarketsIntoTabs(params.markets, params.context);
  const allSelections = tabs.flatMap((tab) =>
    tab.groups.flatMap((group) => group.selections),
  );

  return {
    eventId: params.eventId,
    sportKey: params.sportKey,
    bookmaker: "bet365",
    tabs,
    totalSelections: allSelections.length,
    valueBetsCount: allSelections.filter((selection) => selection.hasValue).length,
    fetchedMarkets: params.markets.length,
    source: params.source,
    message: params.message,
  };
}
