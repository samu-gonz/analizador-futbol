import {
  BET365_BOOKMAKER_NAME,
  extractBet365FromLiveOdds,
} from "@/lib/apiFootball/bet365";
import type {
  ApiFixtureItem,
  ApiFixtureStatisticsItem,
  ApiLiveOddsItem,
  ApiOddsBet,
  ApiOddsBookmaker,
  ApiOddsValue,
} from "@/lib/apiFootball/types";
import { adjustLiveProbability } from "@/services/liveEngine";
import type {
  LiveAnalysedMatch,
  LiveCards,
  LiveCorners,
  LiveMatch,
  LiveMatchPeriod,
  LiveOdds,
  TodayFixtureSummary,
  UserContextScore,
} from "@/types/liveMatch";

const LIVE_STATUS_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE"]);

function createUserContextScore(minute: number): UserContextScore {
  return {
    home: 0,
    away: 0,
    capturedAtMinute: minute,
  };
}

function mapPeriod(statusShort: string): LiveMatchPeriod {
  if (statusShort === "1H") {
    return "1H";
  }

  if (statusShort === "HT") {
    return "HT";
  }

  return "2H";
}

function parseStatisticValue(value: number | string | null): number {
  if (value === null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = Number.parseInt(value.replace("%", ""), 10);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function extractStatistics(
  statistics: ApiFixtureStatisticsItem[],
  homeTeamId: number,
  awayTeamId: number,
): { corners: LiveCorners; cards: LiveCards } {
  const empty: { corners: LiveCorners; cards: LiveCards } = {
    corners: { home: 0, away: 0 },
    cards: { homeYellow: 0, homeRed: 0, awayYellow: 0, awayRed: 0 },
  };

  if (statistics.length === 0) {
    return empty;
  }

  const homeStats = statistics.find((item) => item.team.id === homeTeamId);
  const awayStats = statistics.find((item) => item.team.id === awayTeamId);

  const readStat = (
    teamStats: ApiFixtureStatisticsItem | undefined,
    type: string,
  ): number => {
    const entry = teamStats?.statistics.find((stat) => stat.type === type);
    return parseStatisticValue(entry?.value ?? 0);
  };

  return {
    corners: {
      home: readStat(homeStats, "Corner Kicks"),
      away: readStat(awayStats, "Corner Kicks"),
    },
    cards: {
      homeYellow: readStat(homeStats, "Yellow Cards"),
      homeRed: readStat(homeStats, "Red Cards"),
      awayYellow: readStat(awayStats, "Yellow Cards"),
      awayRed: readStat(awayStats, "Red Cards"),
    },
  };
}

function parseOdd(value: string): number {
  return Number.parseFloat(value);
}

function isActiveOdd(value: ApiOddsValue): boolean {
  return !value.suspended && parseOdd(value.odd) > 1;
}

function selectBet365Values(values: ApiOddsValue[]): ApiOddsValue[] {
  const active = values.filter(isActiveOdd);

  if (active.length === 0) {
    return [];
  }

  const mainValues = active.filter((value) => value.main === true);

  return mainValues.length > 0 ? mainValues : active;
}

function findBet(bookmaker: ApiOddsBookmaker, names: string[]): ApiOddsBet | undefined {
  return bookmaker.bets.find((bet) =>
    names.some((name) => bet.name.toLowerCase() === name.toLowerCase()),
  );
}

function extract1X2FromBet365(bookmaker: ApiOddsBookmaker): LiveOdds["matchResult1X2"] | null {
  const bet = findBet(bookmaker, ["Match Winner", "Fulltime Result", "1X2", "Home/Draw/Away"]);

  if (!bet) {
    return null;
  }

  const values = selectBet365Values(bet.values);
  let home = 0;
  let draw = 0;
  let away = 0;

  values.forEach((value) => {
    const odd = parseOdd(value.odd);
    const label = value.value.toLowerCase();

    if (label === "home" || label === "1") {
      home = odd;
    } else if (label === "draw" || label === "x") {
      draw = odd;
    } else if (label === "away" || label === "2") {
      away = odd;
    }
  });

  if (home > 0 && draw > 0 && away > 0) {
    return {
      home: Number(home.toFixed(2)),
      draw: Number(draw.toFixed(2)),
      away: Number(away.toFixed(2)),
    };
  }

  return null;
}

function extractAsianGoalsFromBet365(bookmaker: ApiOddsBookmaker): LiveOdds["asianGoals"] | null {
  const bet = findBet(bookmaker, [
    "Goals Over/Under",
    "Goal Line",
    "Match Goals",
    "Total Goals",
  ]);

  if (!bet) {
    return null;
  }

  const values = selectBet365Values(bet.values);
  let line = 2.5;
  let over = 0;
  let under = 0;

  values.forEach((value) => {
    const odd = parseOdd(value.odd);
    const label = value.value.toLowerCase();
    const handicap = value.handicap ?? value.value.match(/[\d.]+/)?.[0];
    const parsedLine = handicap ? Number.parseFloat(handicap) : NaN;

    if (!Number.isNaN(parsedLine)) {
      line = parsedLine;
    }

    if (label.includes("over")) {
      over = odd;
    } else if (label.includes("under")) {
      under = odd;
    }
  });

  if (over > 0 && under > 0) {
    return {
      line,
      over: Number(over.toFixed(2)),
      under: Number(under.toFixed(2)),
    };
  }

  return null;
}

function extractAsianHandicapFromBet365(
  bookmaker: ApiOddsBookmaker,
  minute: number,
): LiveOdds["asianHandicap"] | null {
  const bet = findBet(bookmaker, ["Asian Handicap", "Handicap Result", "Handicap"]);

  if (!bet) {
    return null;
  }

  const values = selectBet365Values(bet.values);
  let line = 0;
  let home = 0;
  let away = 0;

  values.forEach((value) => {
    const odd = parseOdd(value.odd);
    const handicapRaw = value.handicap ?? value.value;
    const label = value.value.toLowerCase();
    const lineMatch = handicapRaw.match(/-?\+?[\d.]+/);
    const parsedLine = lineMatch ? Number.parseFloat(lineMatch[0]) : 0;

    if (label.includes("home") || handicapRaw.trim().startsWith("-")) {
      line = parsedLine;
      home = odd;
    } else if (label.includes("away") || handicapRaw.trim().startsWith("+")) {
      line = parsedLine > 0 ? -parsedLine : parsedLine;
      away = odd;
    }
  });

  if (home > 0 && away > 0) {
    return {
      line,
      home: Number(home.toFixed(2)),
      away: Number(away.toFixed(2)),
      userContextScore: createUserContextScore(minute),
    };
  }

  return null;
}

function buildDefaultOdds(minute: number): LiveOdds {
  return {
    bookmaker: BET365_BOOKMAKER_NAME,
    matchResult1X2: { home: 2.1, draw: 3.3, away: 3.5 },
    asianGoals: { line: 2.5, over: 1.9, under: 1.9 },
    asianHandicap: {
      line: 0,
      home: 1.95,
      away: 1.95,
      userContextScore: createUserContextScore(minute),
    },
  };
}

export function mapBet365LiveOdds(
  oddsItems: ApiLiveOddsItem[],
  minute: number,
): LiveOdds {
  const bet365 = extractBet365FromLiveOdds(oddsItems);

  if (!bet365) {
    return buildDefaultOdds(minute);
  }

  const matchResult1X2 = extract1X2FromBet365(bet365);
  const asianGoals = extractAsianGoalsFromBet365(bet365);
  const asianHandicap = extractAsianHandicapFromBet365(bet365, minute);
  const defaults = buildDefaultOdds(minute);

  return {
    bookmaker: BET365_BOOKMAKER_NAME,
    matchResult1X2: matchResult1X2 ?? defaults.matchResult1X2,
    asianGoals: asianGoals ?? defaults.asianGoals,
    asianHandicap: asianHandicap ?? defaults.asianHandicap,
  };
}

export function mapFixtureToLiveMatch(
  fixture: ApiFixtureItem,
  statistics: ApiFixtureStatisticsItem[] = [],
): LiveMatch {
  const { corners, cards } = extractStatistics(
    statistics,
    fixture.teams.home.id,
    fixture.teams.away.id,
  );

  return {
    id: String(fixture.fixture.id),
    homeTeam: {
      id: String(fixture.teams.home.id),
      name: fixture.teams.home.name,
      logoUrl: fixture.teams.home.logo,
    },
    awayTeam: {
      id: String(fixture.teams.away.id),
      name: fixture.teams.away.name,
      logoUrl: fixture.teams.away.logo,
    },
    league: {
      id: String(fixture.league.id),
      name: fixture.league.name,
      country: fixture.league.country,
      logoUrl: fixture.league.logo,
    },
    score: {
      home: fixture.goals.home ?? 0,
      away: fixture.goals.away ?? 0,
    },
    corners,
    cards,
    minute: fixture.fixture.status.elapsed ?? 0,
    period: mapPeriod(fixture.fixture.status.short),
    status: "live",
  };
}

export function mapLiveOdds(
  oddsItems: ApiLiveOddsItem[],
  minute: number,
): LiveOdds {
  return mapBet365LiveOdds(oddsItems, minute);
}

export function buildAnalysedMatch(
  fixture: ApiFixtureItem,
  statistics: ApiFixtureStatisticsItem[],
  oddsItems: ApiLiveOddsItem[],
): LiveAnalysedMatch {
  const match = mapFixtureToLiveMatch(fixture, statistics);
  const odds = mapBet365LiveOdds(oddsItems, match.minute);

  return {
    match,
    odds,
    predictions: adjustLiveProbability(match, odds),
    updatedAt: new Date().toISOString(),
  };
}

export function isFixtureLive(fixture: ApiFixtureItem): boolean {
  return LIVE_STATUS_CODES.has(fixture.fixture.status.short);
}

export function mapTodayFixtureSummary(fixture: ApiFixtureItem): TodayFixtureSummary {
  const home = fixture.goals.home ?? 0;
  const away = fixture.goals.away ?? 0;

  return {
    id: String(fixture.fixture.id),
    homeTeam: fixture.teams.home.name,
    awayTeam: fixture.teams.away.name,
    kickoff: fixture.fixture.date,
    status: fixture.fixture.status.short,
    score: `${home} - ${away}`,
    isLive: isFixtureLive(fixture),
  };
}
