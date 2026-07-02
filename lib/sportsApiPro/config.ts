export const SPORTS_API_PRO_BASE_URL =
  process.env.SPORTS_API_PRO_BASE_URL?.trim() || "https://api.sportsapipro.com/";

export const WORLD_CUP_COMPETITION_ID = 5930;

export function getSportsApiProKey(): string | undefined {
  return (
    process.env.SPORTS_API_PRO_KEY?.trim() ||
    process.env.API_FOOTBALL_KEY?.trim() ||
    undefined
  );
}

export function getSportsApiProKeyStatus(): "missing" | "empty" | "ok" {
  const raw = process.env.SPORTS_API_PRO_KEY ?? process.env.API_FOOTBALL_KEY;

  if (raw === undefined) {
    return "missing";
  }

  if (!raw.trim()) {
    return "empty";
  }

  return "ok";
}

export function isSportsApiProConfigured(): boolean {
  return getSportsApiProKeyStatus() === "ok";
}

export function getSportsApiProSetupMessage(): string {
  const status = getSportsApiProKeyStatus();

  if (status === "empty") {
    return "SPORTS_API_PRO_KEY está vacía en .env.local. Pega tu clave de sportsapipro.com y reinicia npm run dev.";
  }

  return "Configura SPORTS_API_PRO_KEY en .env.local para seguir el Mundial en vivo.";
}
