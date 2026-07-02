import { NextResponse } from "next/server";
import { getBet365MarketsForMatch } from "@/services/bet365MarketsService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeTeam = searchParams.get("homeTeam");
  const awayTeam = searchParams.get("awayTeam");
  const commenceTime = searchParams.get("commenceTime") ?? undefined;
  const homeTeamId = searchParams.get("homeTeamId") ?? "home";
  const awayTeamId = searchParams.get("awayTeamId") ?? "away";
  const gameId = searchParams.get("gameId") ?? undefined;

  if (!homeTeam || !awayTeam) {
    return NextResponse.json(
      { error: "homeTeam y awayTeam son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const payload = await getBet365MarketsForMatch({
      homeTeam,
      awayTeam,
      commenceTime,
      homeTeamId,
      awayTeamId,
      gameId,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar mercados Bet365";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
