import type { Browser } from "puppeteer";
import { launchBrowser, preparePage } from "./browser";
import { DEFAULT_TIMEOUT_MS } from "./constants";
import { extractMatchOdds } from "./extractMatches";
import { navigateToCategory } from "./navigate";
import type { MatchOdds, ScrapeOptions } from "./types";

export async function scrapeOddsPortal(
  options: ScrapeOptions,
): Promise<MatchOdds[]> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const market = options.market ?? "1x2";

  let browser: Browser | null = null;

  try {
    browser = await launchBrowser({ headful: options.headful });
    const page = await preparePage(browser);

    const resolvedUrl = await navigateToCategory(page, options.url, timeoutMs);

    console.info(`[OddsPortal] Página cargada: ${resolvedUrl}`);
    console.info(`[OddsPortal] Mercado: ${market.toUpperCase()}`);

    const matches = await extractMatchOdds(page, market, options.maxMatches ?? 0);

    console.info(`[OddsPortal] Partidos extraídos: ${matches.length}`);

    return matches;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido en scraping";

    console.error(`[OddsPortal] Error fatal: ${message}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export type { MatchOdds, ScrapeOptions } from "./types";
