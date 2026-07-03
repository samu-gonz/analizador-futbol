import type { OddsApiOutcome } from "@/types/theOddsApi";

export interface Bet365LabelContext {
  homeTeamName: string;
  awayTeamName: string;
}

const TEAM_SCOPED_MARKET_KEYS = new Set([
  "team_totals",
  "alternate_team_totals",
  "alternate_team_totals_corners",
]);

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);

  return left === right || left.includes(right) || right.includes(left);
}

function formatLine(point: number): string {
  if (Number.isInteger(point)) {
    return String(point);
  }

  return point.toFixed(2).replace(/\.?0+$/, "");
}

function translateOutcomeToken(
  token: string,
  context: Bet365LabelContext,
): string {
  const lower = token.trim().toLowerCase();

  if (lower === "draw" || lower === "x") {
    return "Empate";
  }

  if (lower === "home" || lower === "1") {
    return context.homeTeamName;
  }

  if (lower === "away" || lower === "2") {
    return context.awayTeamName;
  }

  if (namesMatch(token, context.homeTeamName)) {
    return context.homeTeamName;
  }

  if (namesMatch(token, context.awayTeamName)) {
    return context.awayTeamName;
  }

  return token.trim();
}

function formatOverUnderLabel(name: string, point: number): string {
  const lower = normalizeName(name);

  if (lower.includes("over") || lower === "mas" || lower.startsWith("más")) {
    return `Más de ${formatLine(point)}`;
  }

  return `Menos de ${formatLine(point)}`;
}

function formatDoubleChance(
  name: string,
  context: Bet365LabelContext,
): string | null {
  const lower = normalizeName(name);
  const { homeTeamName, awayTeamName } = context;

  if (lower === "1x") {
    return `${homeTeamName} o Empate`;
  }

  if (lower === "x2") {
    return `${awayTeamName} o Empate`;
  }

  if (lower === "12") {
    return `${homeTeamName} o ${awayTeamName}`;
  }

  if (lower.includes(" or ")) {
    const parts = name.split(/\s+or\s+/i);

    if (parts.length === 2) {
      const first = translateOutcomeToken(parts[0], context);
      const second = translateOutcomeToken(parts[1], context);

      return `${first} o ${second}`;
    }
  }

  if (lower.includes("draw")) {
    if (lower.includes(normalizeName(homeTeamName)) || lower.includes("home")) {
      return `${homeTeamName} o Empate`;
    }

    if (lower.includes(normalizeName(awayTeamName)) || lower.includes("away")) {
      return `${awayTeamName} o Empate`;
    }
  }

  if (
    lower.includes(normalizeName(homeTeamName)) &&
    lower.includes(normalizeName(awayTeamName))
  ) {
    return `${homeTeamName} o ${awayTeamName}`;
  }

  return null;
}

function formatSpreadLabel(
  name: string,
  point: number,
  context: Bet365LabelContext,
): string {
  const team = translateOutcomeToken(name, context);
  const sign = point > 0 ? "+" : "";

  return `${team} ${sign}${formatLine(point)}`;
}

export function isTeamScopedMarket(marketKey: string): boolean {
  return TEAM_SCOPED_MARKET_KEYS.has(marketKey);
}

export function getBet365MarketGroupName(
  marketKey: string,
  teamName?: string,
): string {
  if (teamName && marketKey === "alternate_team_totals_corners") {
    return `Total córners - ${teamName}`;
  }

  if (teamName && isTeamScopedMarket(marketKey)) {
    return `Total goles - ${teamName}`;
  }

  return getBet365MarketLabel(marketKey);
}

export function getBet365MarketLabel(marketKey: string): string {
  const labels: Record<string, string> = {
    h2h: "Resultado final",
    h2h_3_way: "Resultado final",
    spreads: "Hándicap asiático",
    alternate_spreads: "Hándicap asiático alternativo",
    totals: "Total de goles",
    alternate_totals: "Total de goles alternativo",
    team_totals: "Total de goles por equipo",
    alternate_team_totals: "Total de goles por equipo",
    btts: "Ambos equipos marcan",
    btts_h1: "Ambos equipos marcan (1ª parte)",
    draw_no_bet: "Empate no válido",
    double_chance: "Doble oportunidad",
    double_chance_h1: "Doble oportunidad (1ª parte)",
    halftime_fulltime: "Descanso / Final",
    h2h_h1: "Resultado 1ª parte",
    h2h_h2: "Resultado 2ª parte",
    h2h_3_way_h1: "Resultado 1ª parte",
    h2h_3_way_h2: "Resultado 2ª parte",
    spreads_h1: "Hándicap 1ª parte",
    spreads_h2: "Hándicap 2ª parte",
    alternate_spreads_h1: "Hándicap alternativo 1ª parte",
    alternate_spreads_h2: "Hándicap alternativo 2ª parte",
    totals_h1: "Total goles 1ª parte",
    totals_h2: "Total goles 2ª parte",
    alternate_totals_h1: "Total goles alternativo 1ª parte",
    alternate_totals_h2: "Total goles alternativo 2ª parte",
    alternate_spreads_corners: "Hándicap córners",
    alternate_totals_corners: "Total córners",
    alternate_team_totals_corners: "Total córners por equipo",
    corners_1x2: "Córners 1X2",
    alternate_spreads_cards: "Hándicap tarjetas",
    alternate_totals_cards: "Total tarjetas",
    player_goal_scorer_anytime: "Jugador marca en cualquier momento",
    player_first_goal_scorer: "Primer goleador",
    player_last_goal_scorer: "Último goleador",
    player_to_receive_card: "Jugador recibe tarjeta",
    player_to_receive_red_card: "Jugador recibe tarjeta roja",
    player_shots_on_target: "Tiros a puerta del jugador",
    player_shots: "Tiros del jugador",
    player_assists: "Asistencias del jugador",
    outrights: "Ganador del torneo",
  };

  if (labels[marketKey]) {
    return labels[marketKey];
  }

  if (marketKey.startsWith("sap_")) {
    return marketKey
      .replace(/^sap_/, "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return marketKey.replaceAll("_", " ");
}

export function formatBet365SelectionName(
  marketKey: string,
  outcome: OddsApiOutcome,
  context: Bet365LabelContext,
): string {
  const name = outcome.name;
  const lower = normalizeName(name);

  if (marketKey === "double_chance" || marketKey === "double_chance_h1") {
    const formatted = formatDoubleChance(name, context);

    if (formatted) {
      return formatted;
    }
  }

  if (marketKey === "halftime_fulltime") {
    return name
      .split("/")
      .map((part) => translateOutcomeToken(part, context))
      .join(" / ");
  }

  if (marketKey.includes("spreads") && outcome.point !== undefined) {
    return formatSpreadLabel(name, outcome.point, context);
  }

  if (
    outcome.point !== undefined &&
    (lower.includes("over") || lower.includes("under"))
  ) {
    return formatOverUnderLabel(name, outcome.point);
  }

  if (marketKey.startsWith("player_") && outcome.description) {
    if (lower === "yes" || lower === "no") {
      return `${outcome.description} - ${lower === "yes" ? "Sí" : "No"}`;
    }

    if (outcome.point !== undefined && (lower.includes("over") || lower.includes("under"))) {
      return `${outcome.description} - ${formatOverUnderLabel(name, outcome.point)}`;
    }

    return `${outcome.description} - ${translateOutcomeToken(name, context)}`;
  }

  if (lower === "draw") {
    return "Empate";
  }

  if (lower === "yes") {
    return "Sí";
  }

  if (lower === "no") {
    return "No";
  }

  if (lower === "over") {
    return "Más de";
  }

  if (lower === "under") {
    return "Menos de";
  }

  return translateOutcomeToken(name, context);
}

export function groupOutcomesByTeamDescription(
  outcomes: OddsApiOutcome[],
): Map<string, OddsApiOutcome[]> {
  const groups = new Map<string, OddsApiOutcome[]>();

  for (const outcome of outcomes) {
    const team = outcome.description?.trim() || "General";
    const current = groups.get(team) ?? [];

    current.push(outcome);
    groups.set(team, current);
  }

  return groups;
}
