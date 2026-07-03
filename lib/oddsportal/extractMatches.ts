import type { Page } from "puppeteer";
import {
  EXTRACT_BET365_MATCH_SCRIPT,
  EXTRACT_CATEGORY_ROWS_SCRIPT,
} from "./browserScripts";
import { SELECTORS } from "./constants";
import { selectMarketTab } from "./selectMarketTab";
import type { MatchOdds, OddsMarket } from "./types";

function parseOddValue(raw: string): number | null {
  const cleaned = raw.replace(/\s+/g, "").replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return null;
  }

  const value = Number.parseFloat(cleaned);

  return Number.isFinite(value) && value > 1 ? value : null;
}

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

interface RawCategoryRow {
  match: string;
  dateTime: string;
  oddTexts: string[];
  matchUrl: string | null;
}

function mapOddTextsToMatchOdds(
  row: Pick<RawCategoryRow, "match" | "dateTime" | "oddTexts">,
  market: OddsMarket,
): MatchOdds {
  const values = row.oddTexts
    .map((text) => parseOddValue(text))
    .filter((value): value is number => value !== null);

  if (market === "totals") {
    if (values.length < 2) {
      throw new Error(`Cuotas insuficientes para totals: ${row.oddTexts.join(", ")}`);
    }

    return {
      match: cleanText(row.match),
      dateTime: cleanText(row.dateTime),
      odds: {
        home: values[0],
        draw: values[0],
        away: values[1],
      },
    };
  }

  if (values.length < 3) {
    throw new Error(`Cuotas 1X2 incompletas: ${row.oddTexts.join(", ")}`);
  }

  return {
    match: cleanText(row.match),
    dateTime: cleanText(row.dateTime),
    odds: {
      home: values[0],
      draw: values[1],
      away: values[2],
    },
  };
}

export async function extractCategoryRows(
  page: Page,
  market: OddsMarket,
): Promise<RawCategoryRow[]> {
  const script = EXTRACT_CATEGORY_ROWS_SCRIPT
    .replace("__SELECTORS__", JSON.stringify(SELECTORS))
    .replace("__MARKET__", JSON.stringify(market));

  return page.evaluate(script) as Promise<RawCategoryRow[]>;
}

async function extractBet365FromMatchPage(
  page: Page,
  market: OddsMarket,
): Promise<Pick<RawCategoryRow, "match" | "dateTime" | "oddTexts">> {
  await page
    .waitForSelector('[data-testid="odd-container-default"], [data-testid="bookmaker-item"]', {
      timeout: 30_000,
    })
    .catch(() => undefined);

  const script = EXTRACT_BET365_MATCH_SCRIPT.replace(
    "__MARKET__",
    JSON.stringify(market),
  );

  return page.evaluate(script) as Promise<
    Pick<RawCategoryRow, "match" | "dateTime" | "oddTexts">
  >;
}

export async function scrapeMatchDetail(
  page: Page,
  matchUrl: string,
  market: OddsMarket,
  fallback: Pick<RawCategoryRow, "match" | "dateTime">,
): Promise<MatchOdds> {
  await page.goto(matchUrl, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });

  await page
    .waitForFunction(
      `(() => {
        const rows = Array.from(document.querySelectorAll('div[provider-name], [data-testid="bookmaker-item"]'));
        return rows.some((row) => {
          if (!row.textContent || !row.textContent.toLowerCase().includes("bet365")) {
            return false;
          }
          return /\\d+(?:[.,]\\d{1,2})/.test(row.textContent);
        });
      })()`,
      { timeout: 30_000 },
    )
    .catch(() => undefined);

  await page
    .waitForNetworkIdle({ idleTime: 1_000, timeout: 10_000 })
    .catch(() => undefined);

  await selectMarketTab(page, market);

  const detail = await extractBet365FromMatchPage(page, market);

  return mapOddTextsToMatchOdds(
    {
      match: detail.match || fallback.match,
      dateTime: detail.dateTime || fallback.dateTime,
      oddTexts: detail.oddTexts,
    },
    market,
  );
}

export async function extractMatchOdds(
  page: Page,
  market: OddsMarket = "1x2",
  maxMatches = 0,
): Promise<MatchOdds[]> {
  const rawRows = await extractCategoryRows(page, market);
  const parsed: MatchOdds[] = [];
  const seen = new Set<string>();
  let detailCount = 0;

  for (const row of rawRows) {
    if (!row.match) {
      continue;
    }

    if (maxMatches > 0 && detailCount >= maxMatches) {
      break;
    }

    if (!row.matchUrl || !row.matchUrl.includes("/h2h/")) {
      console.error(
        `[OddsPortal] Fila omitida (${row.match}): sin enlace H2H al detalle del partido.`,
      );
      continue;
    }

    try {
      detailCount += 1;
      const detail = await scrapeMatchDetail(page, row.matchUrl, market, row);
      const key = `${detail.match}|${detail.dateTime}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      parsed.push(detail);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido al parsear partido";

      console.error(
        `[OddsPortal] Partido omitido (${row.match}): ${message}`,
      );
    }
  }

  return parsed;
}
