import {
  PREFERRED_BOOKMAKER_KEYS,
  WORLD_CUP_SPORT_KEY,
  getBookmakerDisplayName,
} from "@/lib/oddsApi/config";
import {
  extractEventBookmakerMarkets,
  fetchSportOdds,
  isOddsApiQuotaExhausted,
} from "@/services/theOddsApiClient";
import type { OddsApiEvent, OddsApiMarket } from "@/types/theOddsApi";

/** Mercados bulk: 3 mercados × 2 regiones = 6 créditos por petición (todos los partidos). */
const SNAPSHOT_MARKETS = ["h2h", "totals", "spreads"] as const;

const SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const MAX_BOOKMAKER_ATTEMPTS = 2;

interface WorldCupOddsSnapshot {
  sportKey: string;
  bookmakerKey: string;
  bookmakerTitle: string;
  events: OddsApiEvent[];
  fetchedAt: number;
}

let cachedSnapshot: WorldCupOddsSnapshot | null = null;
let inflightSnapshot: Promise<WorldCupOddsSnapshot | null> | null = null;

function isSnapshotFresh(snapshot: WorldCupOddsSnapshot): boolean {
  return snapshot.fetchedAt + SNAPSHOT_TTL_MS > Date.now();
}

async function loadSnapshot(): Promise<WorldCupOddsSnapshot | null> {
  if (cachedSnapshot && isSnapshotFresh(cachedSnapshot)) {
    return cachedSnapshot;
  }

  if (inflightSnapshot) {
    return inflightSnapshot;
  }

  inflightSnapshot = (async () => {
    const bookmakersToTry = PREFERRED_BOOKMAKER_KEYS.filter(
      (key) => key !== "bet365",
    ).slice(0, MAX_BOOKMAKER_ATTEMPTS);

    for (const bookmakerKey of bookmakersToTry) {
      try {
        const events = await fetchSportOdds(
          WORLD_CUP_SPORT_KEY,
          bookmakerKey,
          [...SNAPSHOT_MARKETS],
        );

        if (events.length === 0) {
          continue;
        }

        const snapshot: WorldCupOddsSnapshot = {
          sportKey: WORLD_CUP_SPORT_KEY,
          bookmakerKey,
          bookmakerTitle: getBookmakerDisplayName(bookmakerKey),
          events,
          fetchedAt: Date.now(),
        };

        cachedSnapshot = snapshot;

        return snapshot;
      } catch (error) {
        if (isOddsApiQuotaExhausted(error)) {
          throw error;
        }
      }
    }

    return null;
  })();

  try {
    return await inflightSnapshot;
  } finally {
    inflightSnapshot = null;
  }
}

export async function getMarketsFromWorldCupSnapshot(
  eventId: string,
): Promise<{
  sportKey: string;
  bookmakerKey: string;
  bookmakerTitle: string;
  markets: OddsApiMarket[];
} | null> {
  const snapshot = await loadSnapshot();

  if (!snapshot) {
    return null;
  }

  const markets = extractEventBookmakerMarkets(
    snapshot.events,
    eventId,
    snapshot.bookmakerKey,
  );

  if (markets.length === 0) {
    return null;
  }

  return {
    sportKey: snapshot.sportKey,
    bookmakerKey: snapshot.bookmakerKey,
    bookmakerTitle: snapshot.bookmakerTitle,
    markets,
  };
}

export function clearWorldCupOddsSnapshotCache(): void {
  cachedSnapshot = null;
  inflightSnapshot = null;
}
