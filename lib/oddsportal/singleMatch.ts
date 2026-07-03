import type { Browser } from "puppeteer";
import { teamsMatchEvent } from "@/lib/oddsApi/teamMatching";
import { launchBrowser, preparePage } from "./browser";
import { DEFAULT_TIMEOUT_MS } from "./constants";
import { extractCategoryRows, scrapeMatchDetail } from "./extractMatches";
import { navigateToCategory } from "./navigate";
import type { MatchOdds } from "./types";

function parseRowTeams(matchLabel: string): { home: string; away: string } | null {
  const parts = matchLabel.split(/\s+vs\s+/i);

  if (parts.length !== 2) {
    return null;
  }

  return {
    home: parts[0].trim(),
    away: parts[1].trim(),
  };
}

function rowMatchesTeams(
  rowMatch: string,
  homeTeam: string,
  awayTeam: string,
): boolean {
  const teams = parseRowTeams(rowMatch);

  if (!teams) {
    return false;
  }

  return teamsMatchEvent(homeTeam, awayTeam, teams.home, teams.away);
}

export async function scrapeBet365OddsForMatch(params: {
  homeTeam: string;
  awayTeam: string;
  categoryUrl: string;
  timeoutMs?: number;
}): Promise<MatchOdds | null> {
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await preparePage(browser);

    await navigateToCategory(page, params.categoryUrl, timeoutMs);

    const rows = await extractCategoryRows(page, "1x2");
    const targetRow = rows.find(
      (row) =>
        row.matchUrl &&
        row.matchUrl.includes("/h2h/") &&
        rowMatchesTeams(row.match, params.homeTeam, params.awayTeam),
    );

    if (!targetRow?.matchUrl) {
      return null;
    }

    return scrapeMatchDetail(page, targetRow.matchUrl, "1x2", {
      match: `${params.homeTeam} vs ${params.awayTeam}`,
      dateTime: targetRow.dateTime,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
