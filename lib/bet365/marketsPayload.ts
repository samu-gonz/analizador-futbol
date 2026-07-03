import { estimateSelectionProbability } from "@/lib/bet365/probabilityEstimator";
import {
  formatBet365SelectionName,
  getBet365MarketGroupName,
  getBet365MarketLabel,
  groupOutcomesByTeamDescription,
  isTeamScopedMarket,
} from "@/lib/bet365/selectionLabels";
import {
  MARKET_TAB_LABELS,
  MARKET_TAB_ORDER,
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

function buildSelection(
  market: OddsApiMarket,
  outcome: OddsApiOutcome,
  context: ProbabilityEstimateContext,
  marketName: string,
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
    marketName,
    selectionName: formatBet365SelectionName(market.key, outcome, {
      homeTeamName: context.homeTeamName,
      awayTeamName: context.awayTeamName,
    }),
    decimalOdd: outcome.price,
    impliedProbability,
    estimatedProbability,
    valuePercent: calculateValuePercent(outcome.price, estimatedProbability),
    hasValue: hasValueFromEstimate(outcome.price, estimatedProbability),
    point: outcome.point,
    description: outcome.description,
  };
}

function addMarketGroup(
  tabMap: Map<MarketTabId, Map<string, Bet365MarketGroup>>,
  tabId: MarketTabId,
  groupKey: string,
  group: Bet365MarketGroup,
): void {
  const groups = tabMap.get(tabId) ?? new Map();

  groups.set(groupKey, group);
  tabMap.set(tabId, groups);
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

    if (isTeamScopedMarket(market.key)) {
      const teamGroups = groupOutcomesByTeamDescription(market.outcomes);

      for (const [teamName, outcomes] of teamGroups) {
        const marketName = getBet365MarketGroupName(market.key, teamName);
        const selections = outcomes.map((outcome) =>
          buildSelection(market, outcome, context, marketName),
        );

        addMarketGroup(tabMap, tabId, `${market.key}__${teamName}`, {
          marketKey: market.key,
          marketName,
          selections,
        });
      }

      continue;
    }

    const marketName = market.key.startsWith("sap_")
      ? getBet365MarketLabel(market.key)
      : getBet365MarketLabel(market.key);

    const selections = market.outcomes.map((outcome) =>
      buildSelection(market, outcome, context, marketName),
    );

    addMarketGroup(tabMap, tabId, market.key, {
      marketKey: market.key,
      marketName,
      selections,
    });
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
  bookmaker?: string;
  bookmakerTitle?: string;
  message?: string;
}): Bet365MarketsPayload {
  const tabs = groupMarketsIntoTabs(params.markets, params.context);
  const allSelections = tabs.flatMap((tab) =>
    tab.groups.flatMap((group) => group.selections),
  );

  return {
    eventId: params.eventId,
    sportKey: params.sportKey,
    bookmaker: params.bookmaker ?? "bet365",
    bookmakerTitle: params.bookmakerTitle ?? "Bet365",
    tabs,
    totalSelections: allSelections.length,
    valueBetsCount: allSelections.filter((selection) => selection.hasValue).length,
    fetchedMarkets: params.markets.length,
    source: params.source,
    message: params.message,
  };
}
