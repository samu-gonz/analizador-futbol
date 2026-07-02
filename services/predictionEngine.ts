import { calculateFairOdd, hasBettingValue } from "@/lib/valueBetting";
import type {
  AnalysedMatch,
  MarketOdds,
  Match,
  PoissonProbabilities,
  Predictions,
  TeamHistoricalStats,
} from "@/types/football";

const LEAGUE_AVG_GOALS = 1.35;
const LEAGUE_AVG_CORNERS = 5.25;
const HOME_ADVANTAGE_GOALS = 1.12;
const HOME_ADVANTAGE_CORNERS = 1.08;
const MAX_GOALS = 10;
const MAX_CORNERS = 18;

const TEAM_STATS: Record<string, TeamHistoricalStats> = {
  "team-arsenal": {
    goalsScoredPerGame: 2.1,
    goalsConcededPerGame: 0.9,
    cornersForPerGame: 6.2,
    cornersAgainstPerGame: 4.1,
  },
  "team-chelsea": {
    goalsScoredPerGame: 1.7,
    goalsConcededPerGame: 1.1,
    cornersForPerGame: 5.8,
    cornersAgainstPerGame: 4.5,
  },
  "team-barcelona": {
    goalsScoredPerGame: 2.3,
    goalsConcededPerGame: 1.0,
    cornersForPerGame: 6.5,
    cornersAgainstPerGame: 3.9,
  },
  "team-real-madrid": {
    goalsScoredPerGame: 2.4,
    goalsConcededPerGame: 0.95,
    cornersForPerGame: 6.0,
    cornersAgainstPerGame: 4.2,
  },
  "team-bayern": {
    goalsScoredPerGame: 2.5,
    goalsConcededPerGame: 1.05,
    cornersForPerGame: 6.8,
    cornersAgainstPerGame: 4.0,
  },
  "team-dortmund": {
    goalsScoredPerGame: 1.9,
    goalsConcededPerGame: 1.3,
    cornersForPerGame: 5.5,
    cornersAgainstPerGame: 5.1,
  },
  "team-inter": {
    goalsScoredPerGame: 1.8,
    goalsConcededPerGame: 0.85,
    cornersForPerGame: 5.9,
    cornersAgainstPerGame: 4.3,
  },
  "team-milan": {
    goalsScoredPerGame: 1.6,
    goalsConcededPerGame: 1.15,
    cornersForPerGame: 5.2,
    cornersAgainstPerGame: 4.8,
  },
  "team-psg": {
    goalsScoredPerGame: 2.2,
    goalsConcededPerGame: 1.0,
    cornersForPerGame: 6.1,
    cornersAgainstPerGame: 4.4,
  },
  "team-marseille": {
    goalsScoredPerGame: 1.5,
    goalsConcededPerGame: 1.4,
    cornersForPerGame: 5.0,
    cornersAgainstPerGame: 5.3,
  },
};

const DEFAULT_TEAM_STATS: TeamHistoricalStats = {
  goalsScoredPerGame: 1.4,
  goalsConcededPerGame: 1.4,
  cornersForPerGame: 5.0,
  cornersAgainstPerGame: 5.0,
};

const MOCK_MATCHES: Match[] = [
  {
    id: "match-001",
    homeTeam: { id: "team-arsenal", name: "Arsenal", logoUrl: "/teams/arsenal.svg" },
    awayTeam: { id: "team-chelsea", name: "Chelsea", logoUrl: "/teams/chelsea.svg" },
    league: { id: "league-pl", name: "Premier League", country: "England" },
    date: new Date().toISOString(),
    status: "scheduled",
  },
  {
    id: "match-002",
    homeTeam: { id: "team-barcelona", name: "Barcelona", logoUrl: "/teams/barcelona.svg" },
    awayTeam: { id: "team-real-madrid", name: "Real Madrid", logoUrl: "/teams/real-madrid.svg" },
    league: { id: "league-laliga", name: "La Liga", country: "Spain" },
    date: new Date().toISOString(),
    status: "scheduled",
  },
  {
    id: "match-003",
    homeTeam: { id: "team-bayern", name: "Bayern Munich", logoUrl: "/teams/bayern.svg" },
    awayTeam: { id: "team-dortmund", name: "Borussia Dortmund", logoUrl: "/teams/dortmund.svg" },
    league: { id: "league-bundesliga", name: "Bundesliga", country: "Germany" },
    date: new Date().toISOString(),
    status: "scheduled",
  },
  {
    id: "match-004",
    homeTeam: { id: "team-inter", name: "Inter Milan", logoUrl: "/teams/inter.svg" },
    awayTeam: { id: "team-milan", name: "AC Milan", logoUrl: "/teams/milan.svg" },
    league: { id: "league-seriea", name: "Serie A", country: "Italy" },
    date: new Date().toISOString(),
    status: "scheduled",
  },
  {
    id: "match-005",
    homeTeam: { id: "team-psg", name: "Paris Saint-Germain", logoUrl: "/teams/psg.svg" },
    awayTeam: { id: "team-marseille", name: "Olympique Marseille", logoUrl: "/teams/marseille.svg" },
    league: { id: "league-ligue1", name: "Ligue 1", country: "France" },
    date: new Date().toISOString(),
    status: "scheduled",
  },
];

const MOCK_MARKET_ODDS: Record<string, MarketOdds> = {
  "match-001": {
    matchResult1X2: { home: 2.05, draw: 3.45, away: 3.8 },
    goalsOverUnder25: { over: 1.92, under: 1.98, line: 2.5 },
    cornersOverUnder95: { over: 1.88, under: 2.02, line: 9.5 },
  },
  "match-002": {
    matchResult1X2: { home: 2.65, draw: 3.6, away: 2.55 },
    goalsOverUnder25: { over: 1.75, under: 2.15, line: 2.5 },
    cornersOverUnder95: { over: 1.95, under: 1.9, line: 9.5 },
  },
  "match-003": {
    matchResult1X2: { home: 1.72, draw: 4.1, away: 4.6 },
    goalsOverUnder25: { over: 1.65, under: 2.3, line: 2.5 },
    cornersOverUnder95: { over: 1.82, under: 2.05, line: 9.5 },
  },
  "match-004": {
    matchResult1X2: { home: 2.2, draw: 3.3, away: 3.4 },
    goalsOverUnder25: { over: 2.05, under: 1.82, line: 2.5 },
    cornersOverUnder95: { over: 2.1, under: 1.78, line: 9.5 },
  },
  "match-005": {
    matchResult1X2: { home: 1.55, draw: 4.5, away: 5.8 },
    goalsOverUnder25: { over: 1.58, under: 2.45, line: 2.5 },
    cornersOverUnder95: { over: 1.7, under: 2.2, line: 9.5 },
  },
};

function factorial(n: number): number {
  if (n <= 1) {
    return 1;
  }

  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }

  return result;
}

function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) {
    return k === 0 ? 1 : 0;
  }

  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function getTeamStats(teamId: string): TeamHistoricalStats {
  return TEAM_STATS[teamId] ?? DEFAULT_TEAM_STATS;
}

function calculateExpectedGoals(
  homeTeamId: string,
  awayTeamId: string,
): { homeLambda: number; awayLambda: number } {
  const home = getTeamStats(homeTeamId);
  const away = getTeamStats(awayTeamId);

  const homeLambda =
    (home.goalsScoredPerGame / LEAGUE_AVG_GOALS) *
    (away.goalsConcededPerGame / LEAGUE_AVG_GOALS) *
    LEAGUE_AVG_GOALS *
    HOME_ADVANTAGE_GOALS;

  const awayLambda =
    (away.goalsScoredPerGame / LEAGUE_AVG_GOALS) *
    (home.goalsConcededPerGame / LEAGUE_AVG_GOALS) *
    LEAGUE_AVG_GOALS;

  return {
    homeLambda: Number(homeLambda.toFixed(3)),
    awayLambda: Number(awayLambda.toFixed(3)),
  };
}

function calculateExpectedCorners(
  homeTeamId: string,
  awayTeamId: string,
): { homeLambda: number; awayLambda: number } {
  const home = getTeamStats(homeTeamId);
  const away = getTeamStats(awayTeamId);

  const homeLambda =
    (home.cornersForPerGame / LEAGUE_AVG_CORNERS) *
    (away.cornersAgainstPerGame / LEAGUE_AVG_CORNERS) *
    LEAGUE_AVG_CORNERS *
    HOME_ADVANTAGE_CORNERS;

  const awayLambda =
    (away.cornersForPerGame / LEAGUE_AVG_CORNERS) *
    (home.cornersAgainstPerGame / LEAGUE_AVG_CORNERS) *
    LEAGUE_AVG_CORNERS;

  return {
    homeLambda: Number(homeLambda.toFixed(3)),
    awayLambda: Number(awayLambda.toFixed(3)),
  };
}

function toPercent(probability: number): number {
  return Number((probability * 100).toFixed(1));
}

function deriveMatchResultProbabilities(
  homeLambda: number,
  awayLambda: number,
): PoissonProbabilities["matchResult1X2"] {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    const homeProb = poissonPMF(homeGoals, homeLambda);

    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      const jointProb = homeProb * poissonPMF(awayGoals, awayLambda);

      if (homeGoals > awayGoals) {
        homeWin += jointProb;
      } else if (homeGoals === awayGoals) {
        draw += jointProb;
      } else {
        awayWin += jointProb;
      }
    }
  }

  return {
    home: toPercent(homeWin),
    draw: toPercent(draw),
    away: toPercent(awayWin),
  };
}

function deriveGoalsOverUnderProbabilities(
  homeLambda: number,
  awayLambda: number,
): PoissonProbabilities["goalsOverUnder25"] {
  let under25 = 0;

  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    const homeProb = poissonPMF(homeGoals, homeLambda);

    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      if (homeGoals + awayGoals <= 2) {
        under25 += homeProb * poissonPMF(awayGoals, awayLambda);
      }
    }
  }

  const over25 = 1 - under25;

  return {
    over: toPercent(over25),
    under: toPercent(under25),
  };
}

function deriveCornersOverUnderProbabilities(
  homeLambda: number,
  awayLambda: number,
): PoissonProbabilities["cornersOverUnder95"] {
  let under95 = 0;

  for (let homeCorners = 0; homeCorners <= MAX_CORNERS; homeCorners += 1) {
    const homeProb = poissonPMF(homeCorners, homeLambda);

    for (let awayCorners = 0; awayCorners <= MAX_CORNERS; awayCorners += 1) {
      if (homeCorners + awayCorners <= 9) {
        under95 += homeProb * poissonPMF(awayCorners, awayLambda);
      }
    }
  }

  const over95 = 1 - under95;

  return {
    over: toPercent(over95),
    under: toPercent(under95),
  };
}

export function calculatePoissonProbability(
  homeTeamId: string,
  awayTeamId: string,
): PoissonProbabilities {
  const goalLambdas = calculateExpectedGoals(homeTeamId, awayTeamId);
  const cornerLambdas = calculateExpectedCorners(homeTeamId, awayTeamId);

  return {
    matchResult1X2: deriveMatchResultProbabilities(
      goalLambdas.homeLambda,
      goalLambdas.awayLambda,
    ),
    goalsOverUnder25: deriveGoalsOverUnderProbabilities(
      goalLambdas.homeLambda,
      goalLambdas.awayLambda,
    ),
    cornersOverUnder95: deriveCornersOverUnderProbabilities(
      cornerLambdas.homeLambda,
      cornerLambdas.awayLambda,
    ),
  };
}

function buildPredictions(
  probabilities: PoissonProbabilities,
  marketOdds: MarketOdds,
): Predictions {
  return {
    matchResult1X2: {
      home: {
        probability: probabilities.matchResult1X2.home,
        hasValue: hasBettingValue(
          probabilities.matchResult1X2.home,
          marketOdds.matchResult1X2.home,
        ),
      },
      draw: {
        probability: probabilities.matchResult1X2.draw,
        hasValue: hasBettingValue(
          probabilities.matchResult1X2.draw,
          marketOdds.matchResult1X2.draw,
        ),
      },
      away: {
        probability: probabilities.matchResult1X2.away,
        hasValue: hasBettingValue(
          probabilities.matchResult1X2.away,
          marketOdds.matchResult1X2.away,
        ),
      },
    },
    goalsOverUnder25: {
      over: {
        probability: probabilities.goalsOverUnder25.over,
        hasValue: hasBettingValue(
          probabilities.goalsOverUnder25.over,
          marketOdds.goalsOverUnder25.over,
        ),
      },
      under: {
        probability: probabilities.goalsOverUnder25.under,
        hasValue: hasBettingValue(
          probabilities.goalsOverUnder25.under,
          marketOdds.goalsOverUnder25.under,
        ),
      },
    },
    cornersOverUnder95: {
      over: {
        probability: probabilities.cornersOverUnder95.over,
        hasValue: hasBettingValue(
          probabilities.cornersOverUnder95.over,
          marketOdds.cornersOverUnder95.over,
        ),
      },
      under: {
        probability: probabilities.cornersOverUnder95.under,
        hasValue: hasBettingValue(
          probabilities.cornersOverUnder95.under,
          marketOdds.cornersOverUnder95.under,
        ),
      },
    },
  };
}

function analyseMatch(match: Match): AnalysedMatch {
  const marketOdds = MOCK_MARKET_ODDS[match.id] ?? {
    matchResult1X2: { home: 2.0, draw: 3.5, away: 3.5 },
    goalsOverUnder25: { over: 1.9, under: 1.9, line: 2.5 },
    cornersOverUnder95: { over: 1.9, under: 1.9, line: 9.5 },
  };

  const probabilities = calculatePoissonProbability(
    match.homeTeam.id,
    match.awayTeam.id,
  );

  const predictions = buildPredictions(probabilities, marketOdds);

  return {
    match,
    marketOdds,
    predictions,
  };
}

export async function getAnalysedMatches(): Promise<AnalysedMatch[]> {
  const { isSportsApiProConfigured } = await import("@/lib/sportsApiPro/config");

  if (isSportsApiProConfigured()) {
    const { getWorldCupAnalysedMatches } = await import(
      "@/services/worldCupAnalysisService"
    );

    return getWorldCupAnalysedMatches();
  }

  return MOCK_MATCHES.map(analyseMatch);
}

export async function getAnalysedMatchById(
  matchId: string,
): Promise<AnalysedMatch | null> {
  const { isSportsApiProConfigured } = await import("@/lib/sportsApiPro/config");

  if (isSportsApiProConfigured()) {
    const { getWorldCupAnalysedMatches } = await import(
      "@/services/worldCupAnalysisService"
    );

    const matches = await getWorldCupAnalysedMatches();
    return matches.find((item) => item.match.id === matchId) ?? null;
  }

  const match = MOCK_MATCHES.find((item) => item.id === matchId);

  if (!match) {
    return null;
  }

  return analyseMatch(match);
}

export { calculateFairOdd };
