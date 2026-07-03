import type { Page } from "puppeteer";
import {
  BET365_BOOKMAKER_SLUG,
  DEFAULT_TIMEOUT_MS,
  SELECTORS,
} from "./constants";

const ODDSPORTAL_HOSTS = ["oddsportal.com", "cuotasahora.com"] as const;

function isOddsPortalHost(hostname: string): boolean {
  return ODDSPORTAL_HOSTS.some((host) => hostname.includes(host));
}

function normalizeOddsPortalUrl(url: string): string {
  const parsed = new URL(url);

  if (!isOddsPortalHost(parsed.hostname)) {
    return parsed.toString();
  }

  if (parsed.pathname.includes(`/bookmaker/${BET365_BOOKMAKER_SLUG}`)) {
    return parsed.toString();
  }

  return parsed.toString();
}

async function dismissCookieBanner(page: Page): Promise<void> {
  try {
    const acceptButton = await page.$(SELECTORS.cookieAccept);

    if (acceptButton) {
      await acceptButton.click();
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 5_000 }).catch(
        () => undefined,
      );
    }
  } catch {
    // Sin banner o ya aceptado.
  }
}

async function activateUpcomingMatchesTab(page: Page): Promise<void> {
  await page.evaluate(`
    (() => {
      const labels = ["próximos partidos", "upcoming events", "next matches"];
      const candidates = Array.from(document.querySelectorAll("li, button, a, span"));

      for (const label of labels) {
        const tab = candidates.find(
          (node) => (node.textContent || "").trim().toLowerCase() === label,
        );

        if (tab) {
          tab.click();
          return;
        }
      }
    })()
  `);

  await new Promise((resolve) => setTimeout(resolve, 1_500));
}

async function waitForMatchTable(page: Page, timeoutMs: number): Promise<void> {
  await page.waitForSelector(SELECTORS.eventRow, {
    timeout: timeoutMs,
    visible: true,
  });

  await page.waitForFunction(
    (rowSelector) => document.querySelectorAll(rowSelector).length > 0,
    { timeout: timeoutMs },
    SELECTORS.eventRow,
  );
}

export async function navigateToCategory(
  page: Page,
  categoryUrl: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const targetUrl = normalizeOddsPortalUrl(categoryUrl);

  await page.goto(targetUrl, {
    waitUntil: "domcontentloaded",
    timeout: timeoutMs,
  });

  await dismissCookieBanner(page);

  const finalHost = new URL(page.url()).hostname;

  if (!isOddsPortalHost(finalHost)) {
    throw new Error(
      `OddsPortal redirigió a ${page.url()}. Prueba con VPN/región UK o usa --headful y verifica acceso.`,
    );
  }

  await activateUpcomingMatchesTab(page);

  await waitForMatchTable(page, timeoutMs);

  await page
    .waitForNetworkIdle({ idleTime: 1_000, timeout: 10_000 })
    .catch(() => undefined);

  return targetUrl;
}
