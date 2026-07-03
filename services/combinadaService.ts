import {
  buildValueCombinadas,
  flattenMarketsPayloadToSelections,
} from "@/lib/combinada/buildValueCombinadas";
import { getBet365MarketsForAnalysedMatch } from "@/services/bet365MarketsService";
import type { AnalysedMatch } from "@/types/football";
import type { ValueCombinada } from "@/types/combinada";

export async function getValueCombinadasForMatch(
  analysedMatch: AnalysedMatch,
): Promise<ValueCombinada[]> {
  const { match } = analysedMatch;
  const marketsPayload = await getBet365MarketsForAnalysedMatch(analysedMatch);

  const pool = flattenMarketsPayloadToSelections({
    matchId: match.id,
    matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    kickoffIso: match.date,
    tabs: marketsPayload.tabs,
  });

  return buildValueCombinadas([pool], {
    minLegs: 2,
    maxLegs: 3,
    maxResults: 5,
  });
}

export async function getValueCombinadasForMatches(
  analysedMatches: AnalysedMatch[],
  options?: { maxMatches?: number },
): Promise<ValueCombinada[]> {
  const maxMatches = options?.maxMatches ?? 8;
  const targets = analysedMatches.slice(0, maxMatches);

  const pools = await Promise.all(
    targets.map(async (analysedMatch) => {
      const { match } = analysedMatch;
      const marketsPayload = await getBet365MarketsForAnalysedMatch(analysedMatch);

      return flattenMarketsPayloadToSelections({
        matchId: match.id,
        matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        kickoffIso: match.date,
        tabs: marketsPayload.tabs,
      });
    }),
  );

  return buildValueCombinadas(pools, {
    minLegs: 2,
    maxLegs: 3,
    maxResults: 10,
    maxLegsPerMatch: 3,
  });
}
