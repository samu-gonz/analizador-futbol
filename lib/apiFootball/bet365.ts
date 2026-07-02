import type { ApiLiveOddsItem, ApiOddsBookmaker } from "@/lib/apiFootball/types";

/** ID oficial de Bet365 en API-Football v3 */
export const BET365_BOOKMAKER_ID = 8;
export const BET365_BOOKMAKER_NAME = "Bet365";

export function isBet365Bookmaker(bookmaker: Pick<ApiOddsBookmaker, "id" | "name">): boolean {
  return (
    bookmaker.id === BET365_BOOKMAKER_ID ||
    bookmaker.name.toLowerCase().replace(/\s/g, "") === "bet365"
  );
}

/**
 * Extrae únicamente el bookmaker Bet365 de la respuesta de /odds/live.
 */
export function extractBet365FromLiveOdds(
  oddsItems: ApiLiveOddsItem[],
): ApiOddsBookmaker | null {
  for (const item of oddsItems) {
    const bet365 = item.bookmakers.find(isBet365Bookmaker);

    if (bet365) {
      return bet365;
    }
  }

  return null;
}
