import type { MarketTabId } from "@/types/bet365Markets";

export const SOCCER_MARKET_KEYS = [
  "h2h",
  "h2h_3_way",
  "spreads",
  "alternate_spreads",
  "totals",
  "alternate_totals",
  "team_totals",
  "alternate_team_totals",
  "btts",
  "btts_h1",
  "draw_no_bet",
  "double_chance",
  "double_chance_h1",
  "halftime_fulltime",
  "h2h_h1",
  "h2h_h2",
  "h2h_3_way_h1",
  "h2h_3_way_h2",
  "spreads_h1",
  "spreads_h2",
  "alternate_spreads_h1",
  "alternate_spreads_h2",
  "totals_h1",
  "totals_h2",
  "alternate_totals_h1",
  "alternate_totals_h2",
  "alternate_spreads_corners",
  "alternate_totals_corners",
  "alternate_team_totals_corners",
  "corners_1x2",
  "alternate_spreads_cards",
  "alternate_totals_cards",
  "player_goal_scorer_anytime",
  "player_first_goal_scorer",
  "player_last_goal_scorer",
  "player_to_receive_card",
  "player_to_receive_red_card",
  "player_shots_on_target",
  "player_shots",
  "player_assists",
  "outrights",
] as const;

export type SoccerMarketKey = (typeof SOCCER_MARKET_KEYS)[number];

const MARKET_LABELS: Record<string, string> = {
  h2h: "Resultado final (1X2)",
  h2h_3_way: "Resultado 3 vías",
  spreads: "Hándicap asiático",
  alternate_spreads: "Hándicaps alternativos",
  totals: "Total de goles",
  alternate_totals: "Totales de goles alternativos",
  team_totals: "Total goles por equipo",
  alternate_team_totals: "Totales alternativos por equipo",
  btts: "Ambos equipos marcan",
  btts_h1: "Ambos marcan — 1ª parte",
  draw_no_bet: "Empate no válido",
  double_chance: "Doble oportunidad",
  double_chance_h1: "Doble oportunidad — 1ª parte",
  halftime_fulltime: "Medio tiempo / Final",
  h2h_h1: "Resultado 1ª parte",
  h2h_h2: "Resultado 2ª parte",
  h2h_3_way_h1: "1X2 — 1ª parte",
  h2h_3_way_h2: "1X2 — 2ª parte",
  spreads_h1: "Hándicap — 1ª parte",
  spreads_h2: "Hándicap — 2ª parte",
  alternate_spreads_h1: "Hándicaps alt. — 1ª parte",
  alternate_spreads_h2: "Hándicaps alt. — 2ª parte",
  totals_h1: "Total goles — 1ª parte",
  totals_h2: "Total goles — 2ª parte",
  alternate_totals_h1: "Totales alt. goles — 1ª parte",
  alternate_totals_h2: "Totales alt. goles — 2ª parte",
  alternate_spreads_corners: "Hándicap córners",
  alternate_totals_corners: "Total córners",
  alternate_team_totals_corners: "Córners por equipo",
  corners_1x2: "Córners 1X2",
  alternate_spreads_cards: "Hándicap tarjetas",
  alternate_totals_cards: "Total tarjetas",
  player_goal_scorer_anytime: "Goleador en cualquier momento",
  player_first_goal_scorer: "Primer goleador",
  player_last_goal_scorer: "Último goleador",
  player_to_receive_card: "Jugador recibe tarjeta",
  player_to_receive_red_card: "Jugador recibe roja",
  player_shots_on_target: "Tiros a puerta (jugador)",
  player_shots: "Tiros totales (jugador)",
  player_assists: "Asistencias (jugador)",
  outrights: "Ganador del torneo",
};

const TAB_BY_MARKET: Record<string, MarketTabId> = {
  h2h: "principales",
  h2h_3_way: "principales",
  spreads: "principales",
  alternate_spreads: "principales",
  draw_no_bet: "principales",
  double_chance: "principales",
  halftime_fulltime: "principales",
  outrights: "principales",
  totals: "goles",
  alternate_totals: "goles",
  team_totals: "goles",
  alternate_team_totals: "goles",
  btts: "goles",
  btts_h1: "goles",
  h2h_h1: "mitades",
  h2h_h2: "mitades",
  h2h_3_way_h1: "mitades",
  h2h_3_way_h2: "mitades",
  spreads_h1: "mitades",
  spreads_h2: "mitades",
  alternate_spreads_h1: "mitades",
  alternate_spreads_h2: "mitades",
  totals_h1: "mitades",
  totals_h2: "mitades",
  alternate_totals_h1: "mitades",
  alternate_totals_h2: "mitades",
  double_chance_h1: "mitades",
  alternate_spreads_corners: "corners",
  alternate_totals_corners: "corners",
  alternate_team_totals_corners: "corners",
  corners_1x2: "corners",
  alternate_spreads_cards: "tarjetas",
  alternate_totals_cards: "tarjetas",
  player_goal_scorer_anytime: "jugadores",
  player_first_goal_scorer: "jugadores",
  player_last_goal_scorer: "jugadores",
  player_to_receive_card: "jugadores",
  player_to_receive_red_card: "jugadores",
  player_shots_on_target: "jugadores",
  player_shots: "jugadores",
  player_assists: "jugadores",
};

export const MARKET_TAB_ORDER: MarketTabId[] = [
  "principales",
  "goles",
  "mitades",
  "corners",
  "tarjetas",
  "jugadores",
  "otros",
];

export const MARKET_TAB_LABELS: Record<MarketTabId, string> = {
  principales: "Principales",
  goles: "Goles",
  mitades: "Mitades",
  corners: "Córners",
  tarjetas: "Tarjetas",
  jugadores: "Jugadores",
  otros: "Otros",
};

export function getMarketLabel(marketKey: string): string {
  return MARKET_LABELS[marketKey] ?? marketKey.replaceAll("_", " ");
}

export function getMarketTab(marketKey: string): MarketTabId {
  if (marketKey.startsWith("player_")) {
    return "jugadores";
  }

  return TAB_BY_MARKET[marketKey] ?? "otros";
}

export function chunkMarketKeys(keys: string[], size = 12): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < keys.length; index += size) {
    chunks.push(keys.slice(index, index + size));
  }

  return chunks;
}
