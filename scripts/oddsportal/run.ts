import { scrapeOddsPortal } from "@/lib/oddsportal/scrapeOddsPortal";
import type { OddsMarket } from "@/lib/oddsportal/types";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);

  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined;
  }

  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main(): Promise<void> {
  const url =
    readArg("--url") ??
    "https://www.oddsportal.com/football/world/world-championship-2026/";

  const market = (readArg("--market") ?? "1x2") as OddsMarket;
  const timeoutMs = Number.parseInt(readArg("--timeout") ?? "45000", 10);
  const maxMatches = Number.parseInt(readArg("--limit") ?? "0", 10);
  const headful = hasFlag("--headful");

  if (market !== "1x2" && market !== "totals") {
    console.error("Mercado no válido. Usa --market 1x2 o --market totals");
    process.exit(1);
  }

  const results = await scrapeOddsPortal({
    url,
    market,
    timeoutMs,
    headful,
    maxMatches,
  });

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
