import { buildMarketsPayload } from "@/lib/bet365/marketsPayload";
import { buildSyntheticBet365Markets } from "@/lib/bet365/syntheticMarkets";
import { calculatePoissonProbability } from "@/services/predictionEngine";
import type { Bet365MarketsPayload } from "@/types/bet365Markets";
import type { AnalysedMatch } from "@/types/football";

export function buildBet365MarketsFromAnalysedMatch(
  analysedMatch: AnalysedMatch,
): Bet365MarketsPayload {
  const { match } = analysedMatch;
  const poisson = calculatePoissonProbability(
    match.homeTeam.id,
    match.awayTeam.id,
  );

  const markets = buildSyntheticBet365Markets(analysedMatch);

  return buildMarketsPayload({
    markets,
    context: {
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      poisson,
    },
    eventId: match.id,
    sportKey: "sports-api-pro",
    source: "sports-api-pro",
    message:
      "Mercados estimados con modelo Poisson + cuotas SportsAPI Pro. Para cuotas reales Bet365 de todos los mercados (incl. jugadores), añade THE_ODDS_API_KEY en .env.local.",
  });
}
